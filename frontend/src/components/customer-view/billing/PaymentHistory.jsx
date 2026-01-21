import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CreditCard } from "lucide-react";
import { formatDate } from "@/utils/billing";
import { useState, useEffect } from "react";
import axios from "axios";

const PaymentHistory = ({ paymentHistory = [], formatDate: propFormatDate }) => {
  const [localPaymentHistory, setLocalPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        // Use the polar payment history endpoint
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/payment-history`, { 
          withCredentials: true 
        });
        
        setLocalPaymentHistory(response.data.data || []);
      } catch (err) {
        console.error('Error fetching Polar payment history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Polar Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-green"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Polar Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading payment history: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use local payment history (fetched from polar endpoint) or fallback to prop
  const displayPaymentHistory = localPaymentHistory.length > 0 ? localPaymentHistory : paymentHistory;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>Polar Payment History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {displayPaymentHistory.length > 0 ? (
          <div className="space-y-4">
            {displayPaymentHistory.map((payment) => (
              <div key={payment.id || payment._id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div>
                  <h4 className="font-medium">{payment.plan_name || payment.plan || 'Polar Subscription'}</h4>
                  <p className="text-sm text-gray-500">
                    {payment.description || payment.event_type || 'Payment'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {propFormatDate ? propFormatDate(payment.createdAt || payment.date || payment.created_at) : formatDate(payment.createdAt || payment.date || payment.created_at)}
                  </p>
                  {payment.transaction_id && (
                    <p className="text-xs text-gray-400">
                      Transaction: {payment.transaction_id}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {payment.currency === 'usd' || payment.currency === 'USD' ? `$${(payment.amount / 100).toFixed(2)}` : `${payment.amount} ${payment.currency?.toUpperCase()}`}
                  </span>
                  <Badge
                    className={
                      (payment.status === "completed" || payment.status === "paid" || payment.status === "active")
                        ? "bg-green-500 hover:bg-green-600 text-white capitalize"
                        : payment.status === "pending" || payment.status === "processing"
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white capitalize"
                          : "bg-red-500 hover:bg-red-600 text-white capitalize"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No Polar payment history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;