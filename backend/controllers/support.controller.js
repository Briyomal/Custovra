import { SupportTicket } from "../models/SupportTicket.js";
import { uploadFileToS3, getPresignedUrl } from "../utils/s3.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Configure S3 client for direct file serving
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to generate a unique key for support ticket files
const generateSupportFileKey = (userId, originalname) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `support_tickets/${userId}/${timestamp}_${randomString}_${originalname}`;
};

// Create a new support ticket
export const createSupportTicket = async (req, res) => {
  console.log("Starting createSupportTicket for user:", req.userId);
  const startTime = Date.now();
  
  try {
    const { subject, message } = req.body;
    const user_id = req.userId;

    // Create the ticket
    const newTicket = new SupportTicket({
      user_id,
      subject,
      messages: []
    });

    // Add the initial message
    const initialMessage = {
      sender: user_id,
      message
    };

    // Handle file upload if present
    if (req.file) {
      try {
        console.log("Uploading file for ticket creation");
        const key = generateSupportFileKey(user_id, req.file.originalname);
        await uploadFileToS3(req.file.buffer, key, req.file.originalname);
        initialMessage.file_url = key;
        console.log("File uploaded successfully");
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        // Don't fail the ticket creation if file upload fails
        return res.status(400).json({
          success: false,
          message: "Failed to upload file. " + uploadError.message,
          error: uploadError.message
        });
      }
    }

    newTicket.messages.push(initialMessage);
    const savedTicket = await newTicket.save();
    
    // Populate the ticket with sender information
    const populatedTicket = await SupportTicket.findById(savedTicket._id)
      .populate("messages.sender", "name email role");

    const endTime = Date.now();
    console.log(`createSupportTicket completed in ${endTime - startTime}ms`);

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket: populatedTicket
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in createSupportTicket after ${endTime - startTime}ms:`, error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 2MB limit",
        error: "File too large"
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: "Only image files (JPG, JPEG, PNG, GIF) are allowed",
        error: "Invalid file type"
      });
    }
    
    console.error("Error creating support ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
      error: error.message
    });
  }
};

// Get all support tickets for a user
export const getUserSupportTickets = async (req, res) => {
  console.log("Starting getUserSupportTickets for user:", req.userId);
  const startTime = Date.now();
  
  try {
    const user_id = req.userId;
    
    const tickets = await SupportTicket.find({ user_id })
      .sort({ updated_at: -1 })
      .populate("messages.sender", "name email role");

    const endTime = Date.now();
    console.log(`getUserSupportTickets completed in ${endTime - startTime}ms`);

    res.status(200).json({
      success: true,
      tickets
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in getUserSupportTickets after ${endTime - startTime}ms:`, error);
    console.error("Error fetching support tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
      error: error.message
    });
  }
};

// Get a specific support ticket by ID
export const getSupportTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const user_id = req.userId;

    const ticket = await SupportTicket.findOne({ _id: ticketId, user_id })
      .populate("messages.sender", "name email role");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support ticket",
      error: error.message
    });
  }
};

// Add a message to an existing support ticket
export const addMessageToTicket = async (req, res) => {
  console.log("Starting addMessageToTicket for user:", req.userId);
  const startTime = Date.now();
  
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const user_id = req.userId;

    // Find the ticket and verify ownership
    const ticket = await SupportTicket.findOne({ _id: ticketId, user_id });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    // Create the new message
    const newMessage = {
      sender: user_id,
      message
    };

    // Handle file upload if present
    if (req.file) {
      try {
        console.log("Uploading file for message");
        const key = generateSupportFileKey(user_id, req.file.originalname);
        await uploadFileToS3(req.file.buffer, key, req.file.originalname);
        newMessage.file_url = key;
        console.log("File uploaded successfully");
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        // Don't fail the message addition if file upload fails
        return res.status(400).json({
          success: false,
          message: "Failed to upload file. " + uploadError.message,
          error: uploadError.message
        });
      }
    }

    // Add the message to the ticket
    ticket.messages.push(newMessage);
    
    // If ticket was closed/resolved, reopen it when customer adds a message
    if (ticket.status === "closed" || ticket.status === "resolved") {
      ticket.status = "open";
    }
    
    ticket.updated_at = Date.now();
    const updatedTicket = await ticket.save();

    // Populate the sender information for the newly added message
    const populatedTicket = await SupportTicket.findById(updatedTicket._id)
      .populate("messages.sender", "name email role");

    const endTime = Date.now();
    console.log(`addMessageToTicket completed in ${endTime - startTime}ms`);

    res.status(200).json({
      success: true,
      message: "Message added successfully",
      ticket: populatedTicket
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in addMessageToTicket after ${endTime - startTime}ms:`, error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 2MB limit",
        error: "File too large"
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: "Only image files (JPG, JPEG, PNG, GIF) are allowed",
        error: "Invalid file type"
      });
    }
    
    console.error("Error adding message to ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add message to ticket",
      error: error.message
    });
  }
};

// Update ticket status (for customers to close tickets)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const user_id = req.userId;

    // Only allow customers to close or reopen their own tickets
    if (!["closed", "open"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Customers can only close or reopen tickets."
      });
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, user_id });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    ticket.status = status;
    ticket.updated_at = Date.now();
    const updatedTicket = await ticket.save();

    res.status(200).json({
      success: true,
      message: `Ticket ${status} successfully`,
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message
    });
  }
};

// Admin functions

// Get all support tickets (admin only)
export const getAllSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .sort({ updated_at: -1 })
      .populate("user_id", "name email")
      .populate("messages.sender", "name email role");

    res.status(200).json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error("Error fetching all support tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch support tickets",
      error: error.message
    });
  }
};

// Add admin reply to ticket
export const addAdminReplyToTicket = async (req, res) => {
  console.log("Starting addAdminReplyToTicket for admin:", req.userId);
  const startTime = Date.now();
  
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const admin_id = req.userId;

    // Find the ticket
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    // Create the admin message
    const adminMessage = {
      sender: admin_id,
      message
    };

    // Handle file upload if present
    if (req.file) {
      try {
        console.log("Uploading file for admin reply");
        const key = generateSupportFileKey(admin_id, req.file.originalname);
        await uploadFileToS3(req.file.buffer, key, req.file.originalname);
        adminMessage.file_url = key;
        console.log("File uploaded successfully");
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        // Don't fail the message addition if file upload fails
        return res.status(400).json({
          success: false,
          message: "Failed to upload file. " + uploadError.message,
          error: uploadError.message
        });
      }
    }

    // Add the message to the ticket
    ticket.messages.push(adminMessage);
    
    // Update status to in_progress if it was open
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }
    
    ticket.updated_at = Date.now();
    const updatedTicket = await ticket.save();

    // Populate the sender information for all messages
    const populatedTicket = await SupportTicket.findById(updatedTicket._id)
      .populate("user_id", "name email")
      .populate("messages.sender", "name email role");

    const endTime = Date.now();
    console.log(`addAdminReplyToTicket completed in ${endTime - startTime}ms`);

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      ticket: populatedTicket
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in addAdminReplyToTicket after ${endTime - startTime}ms:`, error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 2MB limit",
        error: "File too large"
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: "Only image files (JPG, JPEG, PNG, GIF) are allowed",
        error: "Invalid file type"
      });
    }
    
    console.error("Error adding admin reply to ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add reply to ticket",
      error: error.message
    });
  }
};

// Update ticket status (admin only)
export const adminUpdateTicketStatus = async (req, res) => {
  console.log("Starting adminUpdateTicketStatus for admin:", req.userId);
  const startTime = Date.now();
  
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    ticket.status = status;
    ticket.updated_at = Date.now();
    const updatedTicket = await ticket.save();

    const endTime = Date.now();
    console.log(`adminUpdateTicketStatus completed in ${endTime - startTime}ms`);

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket: updatedTicket
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in adminUpdateTicketStatus after ${endTime - startTime}ms:`, error);
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message
    });
  }
};

// Serve a support ticket file
export const serveSupportFile = async (req, res) => {
  console.log("Starting serveSupportFile for fileKey:", req.params[0]);
  const startTime = Date.now();
  
  try {
    // Get the file key from the wildcard route and decode it
    const fileKey = decodeURIComponent(req.params[0]);
    
    if (!fileKey) {
      return res.status(400).json({
        success: false,
        message: "File key is required"
      });
    }
    
    // Create command to get the object
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    
    // Get the object from S3
    const response = await s3Client.send(command);
    
    // Set appropriate headers
    res.set({
      'Content-Type': response.ContentType,
      'Content-Length': response.ContentLength,
      'Last-Modified': response.LastModified,
    });
    
    // Stream the file directly to the response
    response.Body.pipe(res);
    
    const endTime = Date.now();
    console.log(`serveSupportFile completed in ${endTime - startTime}ms`);
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error in serveSupportFile after ${endTime - startTime}ms:`, error);
    
    // If there's an error, try to generate a presigned URL as fallback
    try {
      console.log("Falling back to presigned URL");
      const fileKey = decodeURIComponent(req.params[0]);
      const presignedUrl = await getPresignedUrl(fileKey);
      res.redirect(presignedUrl);
    } catch (redirectError) {
      console.error("Error generating presigned URL as fallback:", redirectError);
      res.status(500).json({
        success: false,
        message: "Failed to serve file",
        error: error.message
      });
    }
  }
};
