export const formatCurrency = (amount) => {
  // For LKR, we don't need to divide by 100 as the amount is already in the correct format
  return `Rs ${new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getStatusBadge = (status, endDate = null) => {
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  
  // Check if subscription is expired
  const isExpired = end && end < now;
  
  const statusConfig = {
    active: { color: 'w-fit bg-green-100 text-green-800', text: 'Active' },
    past_due: { color: 'w-fit bg-yellow-100 text-yellow-800', text: 'Past Due' },
    cancelled: { color: 'w-fit bg-red-100 text-red-800', text: 'Cancelled' },
    canceled: { color: 'w-fit bg-red-100 text-red-800', text: 'Cancelled' },
    expired: { color: 'w-fit bg-gray-100 text-gray-800', text: 'Expired' },
    inactive: { color: 'w-fit bg-gray-100 text-gray-800', text: 'Inactive' },
  };
  
  // If subscription is expired but status is still active, show expired
  let displayStatus = status;
  if (isExpired && status === 'active') {
    displayStatus = 'expired';
  }
  
  const config = statusConfig[displayStatus] || statusConfig.inactive;
  
  return {
    className: config.color,
    text: config.text,
    isExpired: isExpired,
    endDate: endDate
  };
};