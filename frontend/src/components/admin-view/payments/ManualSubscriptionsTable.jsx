import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, X, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ManualSubscriptionsTable = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [assignFormData, setAssignFormData] = useState({
    userId: "",
    planId: "",
    billingPeriod: "monthly",
    startDate: new Date(),
    duration: "1"
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    userSearch: "",
    planId: "all",
    status: "all",
    startDate: "",
    endDate: ""
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sorting states
  const [sortConfig, setSortConfig] = useState({
    key: 'subscription_start',
    direction: 'desc'
  });
  
  // Filter and paginate subscriptions
  const filteredAndPaginatedSubscriptions = useMemo(() => {
    // Apply filters
    let filtered = subscriptions.filter(sub => {
      // User search filter (name or email)
      if (filters.userSearch) {
        const user = sub.user_id;
        if (user && 
            !user.name.toLowerCase().includes(filters.userSearch.toLowerCase()) && 
            !user.email.toLowerCase().includes(filters.userSearch.toLowerCase())) {
          return false;
        }
      }
      
      // Plan filter
      if (filters.planId && filters.planId !== 'all') {
        // Handle both string and object plan_id formats
        const subscriptionPlanId = sub.plan_id?._id || sub.plan_id;
        const filterPlanId = filters.planId;
        
        // Convert both to strings for comparison
        const subscriptionPlanIdStr = subscriptionPlanId?.toString();
        const filterPlanIdStr = filterPlanId?.toString();
        
        if (subscriptionPlanIdStr !== filterPlanIdStr) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && filters.status !== 'all' && sub.status !== filters.status) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'user':
          aValue = a.user_id?.name.toLowerCase() || '';
          bValue = b.user_id?.name.toLowerCase() || '';
          break;
        case 'plan':
          aValue = a.plan_name.toLowerCase();
          bValue = b.plan_name.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'billing_period':
          aValue = a.billing_period.toLowerCase();
          bValue = b.billing_period.toLowerCase();
          break;
        case 'subscription_start':
          aValue = new Date(a.subscription_start);
          bValue = new Date(b.subscription_start);
          break;
        case 'subscription_end':
          aValue = new Date(a.subscription_end);
          bValue = new Date(b.subscription_end);
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [subscriptions, filters, currentPage, itemsPerPage, sortConfig]);
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when items per page change
  };
  
  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Calculate total pages based on filtered subscriptions
  const totalPages = Math.ceil(filteredAndPaginatedSubscriptions.length / itemsPerPage) || 1;

  useEffect(() => {
    fetchManualSubscriptions();
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchManualSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-subscriptions`,
        { withCredentials: true }
      );
      setSubscriptions(response.data);
    } catch (error) {
      console.error("Error fetching manual subscriptions:", error);
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/users/all-users`,
        { withCredentials: true }
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-plans`,
        { withCredentials: true }
      );
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to fetch plans");
    }
  };

  const resetAssignForm = () => {
    setEditingSubscription(null);
    setAssignFormData({
      userId: "",
      planId: "",
      billingPeriod: "monthly",
      startDate: new Date(),
      duration: "1"
    });
  };

  // Function to open the edit dialog with subscription data
  const openEditDialog = (subscription) => {
    setEditingSubscription(subscription);
    // Calculate duration based on start and end dates
    const startDate = new Date(subscription.subscription_start);
    const endDate = new Date(subscription.subscription_end);
    const diffTime = Math.abs(endDate - startDate);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    // Find the plan in our plans array - handle both string IDs and object IDs
    let plan = null;
    if (subscription.plan_id) {
      // Check if plan_id is an object with _id property or a string
      const subscriptionPlanId = subscription.plan_id._id || subscription.plan_id;
      const subscriptionPlanIdStr = subscriptionPlanId.toString();
      
      for (let i = 0; i < plans.length; i++) {
        const planIdStr = plans[i]._id.toString();
        if (planIdStr === subscriptionPlanIdStr) {
          plan = plans[i];
          break;
        }
      }
    }
    
    const planIdToSet = plan ? plan._id.toString() : "";
    
    setAssignFormData({
      userId: subscription.user_id?._id || "",
      planId: planIdToSet,
      billingPeriod: subscription.billing_period || "monthly",
      startDate: startDate,
      duration: diffMonths.toString()
    });
    
    setIsAssignDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    try {
      // Calculate end date based on start date and duration
      const startDateObj = new Date(assignFormData.startDate);
      const endDateObj = new Date(startDateObj);
      if (assignFormData.billingPeriod === 'yearly') {
        endDateObj.setFullYear(endDateObj.getFullYear() + parseInt(assignFormData.duration));
      } else {
        endDateObj.setMonth(endDateObj.getMonth() + parseInt(assignFormData.duration));
      }
      
      // Get the selected plan to calculate amount
      const selectedPlan = plans.find(plan => plan._id === assignFormData.planId);
      const amount = assignFormData.billingPeriod === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly;
      
      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-subscriptions/${editingSubscription._id}`,
        {
          user_id: assignFormData.userId,
          plan_id: assignFormData.planId,
          plan_name: selectedPlan.name,
          billing_period: assignFormData.billingPeriod,
          amount: amount,
          subscription_start: startDateObj,
          subscription_end: endDateObj,
          status: 'active'
        },
        { withCredentials: true }
      );
      
      toast.success("Subscription updated successfully");
      setIsAssignDialogOpen(false);
      resetAssignForm();
      fetchManualSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const handleAssignPlan = async () => {
    if (editingSubscription) {
      handleUpdateSubscription();
      return;
    }
    
    // Check if user already has an active subscription (only when assigning, not editing)
    const userHasActiveSubscription = subscriptions.some(
      sub => sub.user_id?._id === assignFormData.userId && sub.status === 'active'
    );
    
    if (userHasActiveSubscription) {
      toast.error("This user already has an active subscription. Please cancel the existing subscription first.");
      return;
    }
    
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-subscriptions/assign-plan`,
        {
          userId: assignFormData.userId,
          planId: assignFormData.planId,
          billingPeriod: assignFormData.billingPeriod,
          startDate: assignFormData.startDate,
          duration: parseInt(assignFormData.duration)
        },
        { withCredentials: true }
      );
      
      toast.success("Plan assigned successfully");
      setIsAssignDialogOpen(false);
      resetAssignForm();
      fetchManualSubscriptions();
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("Failed to assign plan");
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
    
    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-subscriptions/${subscriptionId}/cancel`,
        {},
        { withCredentials: true }
      );
      
      toast.success("Subscription cancelled successfully");
      fetchManualSubscriptions();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'cancelled':
      case 'canceled': // Handle both spellings
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Expired</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return `Rs ${new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };
  
  // Function to get plan badge class based on plan name
  const getPlanBadgeClass = (planName) => {
    switch (planName) {
      case 'Gold':
      case 'Diamond':
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      case 'Silver':
      case 'Platinum':
        return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      case 'Bronze':
        return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>User Subscriptions</CardTitle>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetAssignForm();
                setIsAssignDialogOpen(true);
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Plan to User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubscription ? "Edit Subscription" : "Assign Plan to User"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userId" className="text-right">
                    User
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={assignFormData.userId}
                      onValueChange={(value) => setAssignFormData({ ...assignFormData, userId: value })}
                      disabled={!!editingSubscription} // Disable user selection when editing
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(user => {
                            // When editing, show all users including those with active subscriptions
                            if (editingSubscription) return true;
                            // When assigning, filter out users with active subscriptions
                            const hasActiveSubscription = subscriptions.some(
                              sub => sub.user_id?._id === user._id && sub.status === 'active'
                            );
                            return !hasActiveSubscription;
                          })
                          .filter(user => user._id) // Filter out users without valid IDs
                          .map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Only users without active subscriptions are shown
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="planId" className="text-right">
                    Plan
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={assignFormData.planId}
                      onValueChange={(value) => setAssignFormData({ ...assignFormData, planId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {plans.find(plan => plan._id.toString() === assignFormData.planId)?.name || "Select a plan"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {plans
                          .filter(plan => plan._id) // Filter out plans without valid IDs
                          .map((plan) => (
                            <SelectItem key={plan._id} value={plan._id.toString()}>
                              {plan.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="billingPeriod" className="text-right">
                    Billing Period
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={assignFormData.billingPeriod}
                      onValueChange={(value) => setAssignFormData({ ...assignFormData, billingPeriod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !assignFormData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {assignFormData.startDate ? (
                            format(assignFormData.startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={assignFormData.startDate}
                          onSelect={(date) => setAssignFormData({ ...assignFormData, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">
                    Duration
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={assignFormData.duration}
                      onChange={(e) => setAssignFormData({ ...assignFormData, duration: e.target.value })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {assignFormData.billingPeriod === 'yearly' ? 'years' : 'months'}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignPlan}>
                    {editingSubscription ? "Update Subscription" : "Assign Plan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <Input
              placeholder="Search by user name or email"
              value={filters.userSearch}
              onChange={(e) => handleFilterChange('userSearch', e.target.value)}
            />
          </div>
          <div>
            <Select
              value={filters.planId}
              onValueChange={(value) => handleFilterChange('planId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans
                  .filter(plan => plan._id) // Filter out plans without valid IDs
                  .map((plan) => (
                    <SelectItem key={plan._id} value={plan._id.toString()}>
                      {plan.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredAndPaginatedSubscriptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('user')}>
                    User {sortConfig.key === 'user' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('plan')}>
                    Plan {sortConfig.key === 'plan' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                    Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('billing_period')}>
                    Billing Period {sortConfig.key === 'billing_period' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('subscription_start')}>
                    Start Date {sortConfig.key === 'subscription_start' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('subscription_end')}>
                    End Date {sortConfig.key === 'subscription_end' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndPaginatedSubscriptions.map((subscription) => (
                  <TableRow key={subscription._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.user_id?.name}</div>
                        <div className="text-sm text-gray-500">{subscription.user_id?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                    <Badge className={getPlanBadgeClass(subscription.plan_name)}>
                      {subscription.plan_name}
                    </Badge>
                  </TableCell>
                    <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                    <TableCell className="capitalize">{subscription.billing_period}</TableCell>
                    <TableCell>{format(new Date(subscription.subscription_start), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(subscription.subscription_end), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {subscription.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelSubscription(subscription._id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(subscription)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualSubscriptionsTable;