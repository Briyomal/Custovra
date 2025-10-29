import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, 
  Paperclip, 
  Send, 
  MessageCircle, 
  XCircle,
  User,
  Shield,
  Search,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import CustomerLayoutPage from "./LayoutPage";
import toast from "react-hot-toast";

const SupportPage = () => {
  const { user } = useAuthStore();
  const [allTickets, setAllTickets] = useState([]); // Store all tickets
  const [tickets, setTickets] = useState([]); // Store filtered tickets
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });
  const [replyMessage, setReplyMessage] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const fileInputRef = useRef(null);

  // Fetch user's support tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/support/`, {
          withCredentials: true
        });
        setAllTickets(response.data.tickets);
        setTickets(response.data.tickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to fetch support tickets");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allTickets];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(term) ||
        ticket.messages.some(msg => msg.message.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    setTickets(filtered);
  }, [searchTerm, statusFilter, allTickets]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Create a new support ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error("Please provide both subject and message");
      return;
    }

    // File validation
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit");
        return;
      }
      
      // Check file type (images only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only image files (JPG, JPEG, PNG, GIF) are allowed");
        return;
      }
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("subject", newTicket.subject);
    formData.append("message", newTicket.message);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/support/`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      toast.success("Support ticket created successfully");

      // Reset form
      setNewTicket({ subject: "", message: "" });
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsCreatingTicket(false);

      // Refresh tickets list with properly populated data
      // The response should include populated sender info
      const newTicketData = response.data.ticket;
      setAllTickets([newTicketData, ...allTickets]);
      setTickets([newTicketData, ...tickets]);
    } catch (error) {
      console.error("Error creating ticket:", error);
      // Handle specific error messages from backend
      if (error.response?.data?.error?.includes("Invalid file type")) {
        toast.error("Only image files (JPG, JPEG, PNG, GIF) are allowed");
      } else if (error.response?.data?.error?.includes("limit")) {
        toast.error("File size exceeds 2MB limit");
      } else {
        toast.error(error.response?.data?.message || "Failed to create support ticket");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add reply to existing ticket
  const handleAddReply = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // File validation
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit");
        return;
      }
      
      // Check file type (images only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only image files (JPG, JPEG, PNG, GIF) are allowed");
        return;
      }
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("message", replyMessage);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/support/${selectedTicket._id}/message`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      toast.success("Reply added successfully");

      // Reset form
      setReplyMessage("");
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Update selected ticket with properly populated data
      // The response should include populated sender info, but let's ensure we have the full structure
      const updatedTicket = {
        ...response.data.ticket,
        messages: response.data.ticket.messages.map(msg => ({
          ...msg,
          sender: msg.sender || { _id: user._id, name: user.name, role: user.role } // Fallback to current user
        }))
      };
      
      setSelectedTicket(updatedTicket);
      
      // Update tickets list
      setAllTickets(allTickets.map(ticket => 
        ticket._id === selectedTicket._id ? updatedTicket : ticket
      ));
      setTickets(tickets.map(ticket => 
        ticket._id === selectedTicket._id ? updatedTicket : ticket
      ));
    } catch (error) {
      console.error("Error adding reply:", error);
      // Handle specific error messages from backend
      if (error.response?.data?.error?.includes("Invalid file type")) {
        toast.error("Only image files (JPG, JPEG, PNG, GIF) are allowed");
      } else if (error.response?.data?.error?.includes("limit")) {
        toast.error("File size exceeds 2MB limit");
      } else {
        toast.error(error.response?.data?.message || "Failed to add reply");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close a ticket
  const handleCloseTicket = async (ticketId) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/support/${ticketId}/status`,
        { status: "closed" },
        { withCredentials: true }
      );

      toast.success("Ticket closed successfully");

      // Update tickets list
      const updatedTicket = response.data.ticket;
      setAllTickets(allTickets.map(ticket => 
        ticket._id === ticketId ? updatedTicket : ticket
      ));
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId ? updatedTicket : ticket
      ));

      // If we're viewing this ticket, update it
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error(error.response?.data?.message || "Failed to close ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format file name to be more readable
  const formatFileName = (fileName) => {
    if (!fileName) return "";
    // Extract just the file name without path
    const name = fileName.split('/').pop();
    // Remove timestamp and random string prefix
    const cleanName = name.replace(/^\d+_[a-z0-9]+_/, '');
    return cleanName;
  };

  // Get status badge variant with color coding
  const getStatusVariant = (status) => {
    switch (status) {
      case "open": return "default"; // Blue color for open
      case "in_progress": return "secondary"; // Purple color for in progress
      case "resolved": return "success"; // Green color for resolved
      case "closed": return "outline"; // Gray outline for closed
      default: return "default";
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    switch (status) {
      case "open": return "Open";
      case "in_progress": return "In Progress";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return status;
    }
  };

  return (
    <CustomerLayoutPage>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Support Center</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create support tickets and manage your requests
            </p>
          </div>
          <Button 
            onClick={() => setIsCreatingTicket(true)}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
            disabled={isSubmitting}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {isCreatingTicket ? (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Create New Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                    placeholder="Describe your issue in detail"
                    rows={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Attachment (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.gif"
                      className="flex-1"
                    />
                    {previewUrl && (
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="h-16 w-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);
                            setFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported formats: JPG, PNG, GIF (Max 2MB)
                  </p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsCreatingTicket(false);
                      setNewTicket({ subject: "", message: "" });
                      setFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : selectedTicket ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Ticket Details */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant={getStatusVariant(selectedTicket.status)}
                      className={`
                        ${selectedTicket.status === "open" ? "bg-blue-500" : ""}
                        ${selectedTicket.status === "in_progress" ? "bg-purple-500" : ""}
                        ${selectedTicket.status === "resolved" ? "bg-green-500" : ""}
                        ${selectedTicket.status === "closed" ? "bg-gray-500" : ""}
                      `}
                    >
                      {getStatusText(selectedTicket.status)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Created {format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTicket(null)}
                  disabled={isSubmitting}
                >
                    <ArrowLeft className="h-4 w-4" />
                  Back to Tickets
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Messages */}
                <div className="space-y-6">
                  {selectedTicket.messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.sender._id === user._id 
                            ? 'bg-blue-100 dark:bg-blue-900' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {message.sender.role === "admin" ? (
                              <Shield className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="font-medium">
                              {message.sender._id === user._id ? "You" : message.sender.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.created_at), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {message.message}
                        </p>
                        
                        {message.file_url && (
                          <div className="mt-3">
                            <a 
                              href={`${import.meta.env.VITE_SERVER_URL}/api/support/file/${encodeURIComponent(message.file_url)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Paperclip className="h-4 w-4" />
                              {formatFileName(message.file_url)}
                            </a>
                            {/* Show image preview if it's an image */}
                            {message.file_url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                              <div className="mt-2">
                                <a 
                                  href={`${import.meta.env.VITE_SERVER_URL}/api/support/file/${encodeURIComponent(message.file_url)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img 
                                    src={`${import.meta.env.VITE_SERVER_URL}/api/support/file/${encodeURIComponent(message.file_url)}`}
                                    alt="Attachment"
                                    className="max-w-xs max-h-48 rounded border object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Reply Form - Only show if ticket is not closed */}
                {selectedTicket.status !== "closed" && (
                  <form onSubmit={handleAddReply} className="space-y-4 border-t pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="reply">Your Reply</Label>
                      <Textarea
                        id="reply"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply here..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Attachment (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".jpg,.jpeg,.png,.gif"
                          className="flex-1"
                        />
                        {previewUrl && (
                          <div className="relative">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="h-16 w-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewUrl(null);
                                setFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Supported formats: JPG, PNG, GIF (Max 2MB)
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant={selectedTicket.status === "closed" ? "default" : "outline"}
                        onClick={() => handleCloseTicket(selectedTicket._id)}
                        disabled={isSubmitting || selectedTicket.status === "closed"}
                        className={selectedTicket.status === "closed" ? "bg-gray-500 hover:bg-gray-600" : ""}
                      >
                        Close Ticket
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
                
                {/* Closed message */}
                {selectedTicket.status === "closed" && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      This ticket is closed. If you need further assistance, please create a new ticket.
                    </p>
                    <Button 
                      onClick={() => setIsCreatingTicket(true)}
                      className="mt-3"
                      disabled={isSubmitting}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-4 pr-8 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <h2 className="text-xl font-semibold">Your Support Tickets</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No support tickets yet</h3>
                  <p className="mt-2 text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "No tickets match your filter criteria. Try adjusting your filters."
                      : "You haven't created any support tickets. Get started by creating your first ticket."}
                  </p>
                  <Button 
                    onClick={() => setIsCreatingTicket(true)}
                    className="mt-4"
                    disabled={isSubmitting}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card 
                    key={ticket._id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                    onClick={() => !isSubmitting && setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Last updated {format(new Date(ticket.updated_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={getStatusVariant(ticket.status)}
                            className={`
                              ${ticket.status === "open" ? "bg-blue-500" : ""}
                              ${ticket.status === "in_progress" ? "bg-purple-500" : ""}
                              ${ticket.status === "resolved" ? "bg-green-500" : ""}
                              ${ticket.status === "closed" ? "bg-gray-500" : ""}
                            `}
                          >
                            {getStatusText(ticket.status)}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            {ticket.messages.length}
                          </div>
                        </div>
                      </div>
                      
                      {ticket.messages.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {ticket.messages[0].sender.role === "admin" ? (
                                <Shield className="h-4 w-4 text-blue-500" />
                              ) : (
                                <User className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {ticket.messages[0].sender._id === user._id ? "You" : ticket.messages[0].sender.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {ticket.messages[0].message}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </CustomerLayoutPage>
  );
};

export default SupportPage;