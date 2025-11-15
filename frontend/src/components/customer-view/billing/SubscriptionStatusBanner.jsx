import { AlertCircle, XCircle } from "lucide-react";
import { formatDate } from "@/utils/billing";

const SubscriptionStatusBanner = ({ subscriptionDetails }) => {
  if (!subscriptionDetails?.subscription) return null;

  const now = new Date();
  const endDate = new Date(subscriptionDetails.subscription.subscription_end);
  const isExpired = endDate < now;
  const isCancelled = subscriptionDetails.subscription.status === 'cancelled' || subscriptionDetails.subscription.status === 'canceled';
  
  if (isExpired) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">
            Subscription Expired
          </span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Your subscription expired on {formatDate(subscriptionDetails.subscription.subscription_end)}. 
          Please renew your subscription to continue using the service.
        </p>
      </div>
    );
  }
  
  if (isCancelled) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">
            Subscription Cancelled
          </span>
        </div>
        <p className="text-red-700 text-sm mt-1">
          Your subscription was cancelled. 
          Please choose a new plan to continue using the service.
        </p>
      </div>
    );
  }
  
  return null;
};

export default SubscriptionStatusBanner;