import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, AlertCircle } from "lucide-react";
import { formatDate } from "@/utils/billing";

const SubscriptionOverview = ({ subscriptionDetails, formatCurrency, getStatusBadge, setActiveTab }) => {
  // Check if user has no active subscription
  // const hasNoSubscription = !subscriptionDetails || 
  //   !subscriptionDetails.subscription || 
  //   subscriptionDetails.subscription.status !== 'active';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Current Subscription</CardTitle>
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
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {formatDate(subscriptionDetails.subscription.subscription_end)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Forms Used</p>
                  <p className="font-medium">
                    {subscriptionDetails.formCount} / {subscriptionDetails.subscription.plan_id?.form_limit || 'Unlimited'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
            <p className="text-gray-500 mb-4">
              You don&apos;t have an active subscription. Select a plan to get started.
            </p>
            <Button onClick={() => setActiveTab("plans")}>
              Choose a Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionOverview;