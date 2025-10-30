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
  Paperclip, 
  Send, 
  MessageCircle, 
  User,
  Shield,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import AdminLayoutPage from "./LayoutPage";
import toast from "react-hot-toast";

const AdminSupportPage = () => {
  const { user } = useAuthStore();
  const [allTickets, setAllTickets] = useState([]); // Store all tickets
  const [tickets, setTickets] = useState([]); // Store filtered tickets
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;
  
  const fileInputRef = useRef(null);

  // Fetch all support tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/support/admin/all`, {
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

  // Apply filters and pagination
  useEffect(() => {
    let filtered = [...allTickets];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(term) ||
        ticket.messages.some(msg => msg.message.toLowerCase().includes(term)) ||
        (ticket.user_id?.name && ticket.user_id.name.toLowerCase().includes(term)) ||
        (ticket.user_id?.email && ticket.user_id.email.toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    // Apply user filter
    if (userFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.user_id?._id === userFilter);
    }
    
    setTickets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, userFilter, allTickets]);

  // Get unique users for filter dropdown
  const getUsersForFilter = () => {
    const users = {};
    allTickets.forEach(ticket => {
      if (ticket.user_id) {
        users[ticket.user_id._id] = {
          name: ticket.user_id.name,
          email: ticket.user_id.email
        };
      }
    });
    return users;
  };

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
        `${import.meta.env.VITE_SERVER_URL}/api/support/${selectedTicket._id}/admin-reply`,
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

  // Update ticket status
  const updateTicketStatus = async (ticketId, status) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/support/${ticketId}/admin-status`,
        { status },
        { withCredentials: true }
      );

      toast.success(`Ticket status updated to ${status}`);

      // Update tickets list
      const updatedTicket = response.data.ticket;
      setAllTickets(allTickets.map(ticket => 
        ticket._id === ticketId ? updatedTicket : ticket
      ));

      // If we're viewing this ticket, update it
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error(error.response?.data?.message || "Failed to update ticket status");
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

  // Pagination logic
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <AdminLayoutPage>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage customer support requests
            </p>
          </div>
        </div>

        {selectedTicket ? (
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
                  <p className="text-sm text-gray-500 mt-1">
                    Customer: {selectedTicket.user_id?.name || "Unknown"} ({selectedTicket.user_id?.email || "No email"})
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTicket(null)}
                  disabled={isSubmitting}
                >
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
                
                {/* Reply Form */}
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
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button" 
                      variant={selectedTicket.status === "open" ? "default" : "outline"}
                      onClick={() => updateTicketStatus(selectedTicket._id, "open")}
                      disabled={isSubmitting || selectedTicket.status === "open"}
                      className={selectedTicket.status === "open" ? "bg-blue-500 hover:bg-blue-600" : ""}
                    >
                      Mark as Open
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedTicket.status === "in_progress" ? "default" : "outline"}
                      onClick={() => updateTicketStatus(selectedTicket._id, "in_progress")}
                      disabled={isSubmitting || selectedTicket.status === "in_progress"}
                      className={selectedTicket.status === "in_progress" ? "bg-purple-500 hover:bg-purple-600" : ""}
                    >
                      Mark as In Progress
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedTicket.status === "resolved" ? "default" : "outline"}
                      onClick={() => updateTicketStatus(selectedTicket._id, "resolved")}
                      disabled={isSubmitting || selectedTicket.status === "resolved"}
                      className={selectedTicket.status === "resolved" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      Mark as Resolved
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedTicket.status === "closed" ? "default" : "outline"}
                      onClick={() => updateTicketStatus(selectedTicket._id, "closed")}
                      disabled={isSubmitting || selectedTicket.status === "closed"}
                      className={selectedTicket.status === "closed" ? "bg-gray-500 hover:bg-gray-600" : ""}
                    >
                      Close Ticket
                    </Button>
                    <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </form>
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
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="all">All Users</option>
                        {Object.entries(getUsersForFilter()).map(([userId, userInfo]) => (
                          <option key={userId} value={userId}>
                            {userInfo.name} ({userInfo.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Support Tickets</h2>
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, tickets.length)} of {tickets.length} tickets
              </p>
            </div>
            
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
                  <h3 className="mt-4 text-lg font-medium">No support tickets found</h3>
                  <p className="mt-2 text-gray-500">
                    {searchTerm || statusFilter !== "all" || userFilter !== "all" 
                      ? "No tickets match your filter criteria. Try adjusting your filters."
                      : "There are currently no support tickets to display."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {currentTickets.map((ticket) => (
                    <Card 
                      key={ticket._id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => !isSubmitting && setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Customer: {ticket.user_id?.name || "Unknown"} ({ticket.user_id?.email || "No email"})
                            </p>
                            <p className="text-sm text-gray-500">
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
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first, last, current, and nearby pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            className={currentPage === pageNumber ? "bg-blue-500" : ""}
                          >
                            {pageNumber}
                          </Button>
                        );
                      } else if (
                        (pageNumber === currentPage - 2 && currentPage > 3) ||
                        (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                      ) {
                        return <span key={pageNumber} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    
                    <Button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayoutPage>
  );
};

export default AdminSupportPage;