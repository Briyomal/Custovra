import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatDate } from "@/utils/billing";

const PaymentHistory = ({ paymentHistory, formatCurrency }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentHistory.length > 0 ? (
          <div className="space-y-4">
            {paymentHistory.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{payment.plan}</h4>
                  <p className="text-sm text-gray-500">
                    {payment.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(payment.date)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {formatCurrency(payment.amount)}
                  </span>
                  <Badge variant={
                    payment.status === 'approved' ? 'default' : 
                    payment.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payment history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;