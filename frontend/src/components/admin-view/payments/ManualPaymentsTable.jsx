import { useState, useEffect } from "react";
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
import { Eye, Check, X, Loader2, ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ManualPaymentsTable = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, paymentId: null });

  useEffect(() => {
    fetchManualPayments();
  }, []);

  const fetchManualPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-payments`,
        { withCredentials: true }
      );
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching manual payments:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setProcessingId(paymentId);
      const response = await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-payments/${paymentId}/approve`,
        { admin_notes: "Payment approved by admin" },
        { withCredentials: true }
      );
      
      if (response.data) {
        toast.success("Payment approved successfully");
        fetchManualPayments(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      toast.error("Failed to approve payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      setProcessingId(paymentId);
      const response = await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-payments/${paymentId}/reject`,
        { admin_notes: "Payment rejected by admin" },
        { withCredentials: true }
      );
      
      if (response.data) {
        toast.success("Payment rejected successfully");
        fetchManualPayments(); // Refresh the list
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      setProcessingId(paymentId);
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/manual-payments/${paymentId}`,
        { withCredentials: true }
      );
      
      if (response.data) {
        toast.success("Payment deleted successfully");
        fetchManualPayments(); // Refresh the list
        setDeleteDialog({ open: false, paymentId: null });
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPayments = [...payments].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aValue, bValue;

    switch (key) {
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
      case 'payment_method':
        aValue = a.payment_method.toLowerCase();
        bValue = b.payment_method.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'payment_status':
        aValue = a.payment_status.toLowerCase();
        bValue = b.payment_status.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Payment Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No manual payment requests found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('user')}>
                  User
                  {sortConfig.key === 'user' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('plan')}>
                  Plan
                  {sortConfig.key === 'plan' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                  Amount
                  {sortConfig.key === 'amount' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('billing_period')}>
                  Billing Period
                  {sortConfig.key === 'billing_period' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('payment_method')}>
                  Payment Method
                  {sortConfig.key === 'payment_method' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                  Date
                  {sortConfig.key === 'created_at' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('payment_status')}>
                  Status
                  {sortConfig.key === 'payment_status' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.user_id?.name}</div>
                      <div className="text-sm text-gray-500">{payment.user_id?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{payment.plan_name}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="capitalize">{payment.billing_period}</TableCell>
                  <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                  <TableCell>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => console.log("View payment", payment._id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50" 
                          onClick={() => setDeleteDialog({ open: true, paymentId: payment._id })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {payment.payment_status === 'pending' && (
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayment(payment._id)}
                          disabled={processingId === payment._id}
                        >
                          {processingId === payment._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectPayment(payment._id)}
                          disabled={processingId === payment._id}
                        >
                          {processingId === payment._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, paymentId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeletePayment(deleteDialog.paymentId)} 
              disabled={processingId === deleteDialog.paymentId}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId === deleteDialog.paymentId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ManualPaymentsTable;