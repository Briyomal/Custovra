import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a consistent S3 key for an employee profile photo
 * @param {string} employeeId - Employee ID
 * @param {string} originalName - Original file name
 * @returns {string} - S3 key
 */
export const generateEmployeePhotoKey = (employeeId, originalName) => {
  const fileExtension = path.extname(originalName);
  return `employee_profiles/${employeeId}${fileExtension}`;
};

/**
 * Generate a consistent S3 key for a form logo
 * @param {string} formId - Form ID
 * @param {string} originalName - Original file name
 * @returns {string} - S3 key
 */
export const generateFormLogoKey = (formId, originalName) => {
  const fileExtension = path.extname(originalName);
  return `form_logos/${formId}${fileExtension}`;
};

/**
 * Upload file to S3 with a specific key
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} key - S3 key
 * @param {string} originalName - Original file name
 * @returns {Promise<object>} - Object with key and URL
 */
export const uploadFileToS3 = async (fileBuffer, key, originalName) => {
  try {
    // Set up S3 upload parameters
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: getFileMimeType(originalName),
    };
    
    // Upload file to S3 (this will overwrite if key already exists)
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    
    // Generate presigned URL for the uploaded file
    const url = await getPresignedUrl(key);
    
    // Return both key and URL for later use
    return { key, url };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

/**
 * Generate a presigned URL for an S3 object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Presigned URL
 */
export const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate presigned URL");
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFileFromS3 = async (key) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    // Don't throw error, just log it - we don't want to fail the entire operation
    // if we can't delete the old file
  }
};

/**
 * Get MIME type based on file extension
 * @param {string} fileName - File name
 * @returns {string} - MIME type
 */
const getFileMimeType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export default {
  uploadFileToS3,
  getPresignedUrl,
  deleteFileFromS3,
  generateEmployeePhotoKey,
  generateFormLogoKey,
};