import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { formatDate } from "@/utils/billing";

const StatusBadge = ({ status, endDate = null }) => {
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  
  // Check if subscription is expired
  const isExpired = end && end < now;
  
  const statusConfig = {
    active: { color: 'w-fit bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
    past_due: { color: 'w-fit bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Past Due' },
    cancelled: { color: 'w-fit bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' },
    canceled: { color: 'w-fit bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' },
    expired: { color: 'w-fit bg-gray-100 text-gray-800', icon: XCircle, text: 'Expired' },
    inactive: { color: 'w-fit bg-gray-100 text-gray-800', icon: XCircle, text: 'Inactive' },
  };
  
  // If subscription is expired but status is still active, show expired
  let displayStatus = status;
  if (isExpired && status === 'active') {
    displayStatus = 'expired';
  }
  
  const config = statusConfig[displayStatus] || statusConfig.inactive;
  const Icon = config.icon;
  
  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
      {isExpired && endDate && (
        <span className="ml-1 text-xs">
          ({formatDate(endDate)})
        </span>
      )}
    </Badge>
  );
};

export default StatusBadge;