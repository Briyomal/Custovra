import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, AlertCircle, RefreshCw, CreditCard } from "lucide-react";
import { formatDate } from "@/utils/billing";
import { formatCurrency } from "@/utils/billing";
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';

const SubscriptionOverview = ({ subscriptionDetails, getStatusBadge, setActiveTab }) => {
  // Helper function to get renewal information
  const getRenewalInfo = (subscription) => {
    if (!subscription || !subscription.subscription_end) return null;
    
    const endDate = new Date(subscription.subscription_end);
    const today = new Date();
    const daysUntilRenewal = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      date: endDate,
      daysRemaining: daysUntilRenewal,
      isExpiringSoon: daysUntilRenewal <= 7 && daysUntilRenewal > 0,
      isExpired: daysUntilRenewal <= 0
    };
  };

  const renewalInfo = subscriptionDetails?.subscription ? 
    getRenewalInfo(subscriptionDetails.subscription) : null;

  // Payment Methods State
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Load payment methods - redirect to Polar billing portal
  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      // Redirect to Polar's customer billing portal since Polar manages payment methods
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/billing-portal`, { withCredentials: true });
      
      // Open the Polar customer billing portal in a new tab
      window.open(response.data.url, '_blank');
      
      // Show a toast notification
      toast.success('Redirecting to Polar billing portal...');
    } catch (error) {
      console.error('Error getting billing portal:', error);
      toast.error('Failed to access billing portal. Please try again later.');
    } finally {
      setLoadingPaymentMethods(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
            <CardTitle className="text-xl md:text-2xl font-bold">Polar Subscription</CardTitle>
            <Button
              className="px-12 py-2 rounded-md font-semibold text-black border border-lime-500 bg-gradient-to-r from-[#16bf4c] to-lime-500 transition-all duration-700 ease-in-out hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] focus:outline-none focus:ring-2 focus:ring-lime-400"
              onClick={() => setActiveTab("plans")}
            >
              Change Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptionDetails?.subscription ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{subscriptionDetails.subscription.plan_name}</h3>
                  <p className="text-gray-500">
                    {formatCurrency(subscriptionDetails.subscription.amount)} / {subscriptionDetails.subscription.billing_period}
                  </p>
                  {subscriptionDetails.subscription.external_provider && (
                    <p className="text-xs text-gray-400 mt-1">
                      Provider: {subscriptionDetails.subscription.external_provider.toUpperCase()}
                    </p>
                  )}
                </div>
                {getStatusBadge(subscriptionDetails.subscription.status, subscriptionDetails.subscription.subscription_end)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">
                      {formatDate(subscriptionDetails.subscription.subscription_start)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Renewal Date</p>
                    <p className="font-medium">
                      {formatDate(subscriptionDetails.subscription.subscription_end)}
                    </p>
                    {renewalInfo && renewalInfo.daysRemaining >= 0 && (
                      <p className={`text-xs ${renewalInfo.isExpiringSoon ? 'text-orange-500' : 'text-gray-500'}`}>
                        {renewalInfo.daysRemaining === 0 
                          ? 'Renews today' 
                          : renewalInfo.daysRemaining === 1 
                            ? '1 day remaining' 
                            : `${renewalInfo.daysRemaining} days remaining`
                          }
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Forms Used</p>
                    <p className="font-medium">
                      {subscriptionDetails.formCount} / {subscriptionDetails.plan?.formLimit || 'Unlimited'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-renew status */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`h-4 w-4 ${subscriptionDetails.subscription.auto_renew ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">
                      {subscriptionDetails.subscription.auto_renew ? 'Auto-renewal enabled' : 'Auto-renewal disabled'}
                    </span>
                  </div>
                  {subscriptionDetails.subscription.auto_renew && renewalInfo && (
                    <div className="text-sm text-gray-500">
                      Next renewal: {formatDate(renewalInfo.date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
              <p className="text-gray-500 mb-4">
                You don&apos;t have an active Polar subscription. Select a plan to get started.
              </p>
              <Button onClick={() => setActiveTab("plans")}>
                Choose a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
            <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Payment Methods
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CreditCard className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Manage Payment Methods</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Payment methods are securely managed through Polar. Click the button below to access your customer billing portal.
            </p>
            <Button 
              onClick={loadPaymentMethods}
              disabled={loadingPaymentMethods}
              className="px-6 py-2"
            >
              {loadingPaymentMethods ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Go to Billing Portal
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              You will be redirected to Polar&apos;s secure billing portal to manage your payment methods.
            </p>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default SubscriptionOverview;