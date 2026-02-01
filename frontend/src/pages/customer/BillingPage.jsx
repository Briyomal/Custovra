import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import CustomerLayoutPage from "./LayoutPage";
import LoadingSpinner from "@/components/LoadingSpinner";

// Import our new components directly
import SubscriptionOverview from "@/components/customer-view/billing/SubscriptionOverview";
import SubscriptionStatusBanner from "@/components/customer-view/billing/SubscriptionStatusBanner";
import StatusBadge from "@/components/customer-view/billing/StatusBadge";

// Import utility functions from main utils folder
import { formatCurrency, formatDate } from "@/utils/billing";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentPlans from "@/components/customer-view/billing/PaymentPlans";

function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            fetchBillingData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Handle payment status query parameters
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const paymentStatus = searchParams.get("paymentStatus");
        const message = searchParams.get("message");

        if (paymentStatus) {
            setTimeout(() => {
                switch (paymentStatus) {
                    case "success":
                        toast({ 
                            title: "Payment Successful", 
                            description: message || "Your payment was successful",
                            variant: "default"
                        });
                        console.log("Payment successful:", message);
                        // Refresh billing data after successful payment
                        fetchBillingData();
                        break;
                    case "cancelled":
                        toast({ 
                            title: "Payment Cancelled", 
                            description: message || "Payment was cancelled", 
                            variant: "destructive" 
                        });
                        console.log("Payment cancelled:", message);
                        break;
                    case "failed":
                        toast({ 
                            title: "Payment Failed", 
                            description: message || "Payment failed. Please try again.", 
                            variant: "destructive" 
                        });
                        console.log("Payment failed:", message);
                        break;
                    case "error":
                        toast({ 
                            title: "Payment Error", 
                            description: message || "Something went wrong with your payment", 
                            variant: "destructive" 
                        });
                        console.log("Payment error:", message);
                        break;
                    default:
                        // Handle unknown payment states
                        toast({ 
                            title: "Payment Status", 
                            description: message || `Payment status: ${paymentStatus}`, 
                            variant: "default" 
                        });
                        console.log("Payment status:", message);
                        // Still refresh billing data in case of success
                        if (paymentStatus.toLowerCase() === "success") {
                            fetchBillingData();
                        }
                        break;
                }
            }, 100); // small delay ensures toast renders

            // Clean up URL parameters after a short delay to ensure toast is shown
            setTimeout(() => {
                navigate(location.pathname, { replace: true });
            }, 2000);
        }
    }, [location.search, location.pathname, navigate]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const [subscriptionRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/subscriptions`, { withCredentials: true })
            ]);

            if (subscriptionRes.status === 'fulfilled') {
                // Use subscription data directly from our database
                const polarData = subscriptionRes.value.data;

                // Get the first active subscription
                const activeSubscription = polarData.subscriptions?.[0] || null;

                // Transform the data structure to match what SubscriptionOverview expects
                const transformedData = {
                    subscription: activeSubscription ? {
                        id: activeSubscription.id,
                        plan_name: activeSubscription.plan_name,
                        amount: activeSubscription.amount,
                        currency: activeSubscription.currency,
                        billing_period: activeSubscription.billing_period,
                        status: activeSubscription.status,
                        subscription_start: activeSubscription.subscription_start,
                        subscription_end: activeSubscription.subscription_end,
                        auto_renew: activeSubscription.auto_renew,
                        external_subscription_id: activeSubscription.external_subscription_id,
                        external_provider: activeSubscription.external_provider,
                        external_plan_id: activeSubscription.external_plan_id,
                        customer_id: activeSubscription.customer_id
                    } : null,
                    // Keep other data as is for backward compatibility
                    plan: activeSubscription ? {
                        formLimit: polarData.limits?.formLimit || 'Unlimited',
                        submissionLimit: polarData.limits?.submissionLimit || 'Unlimited',
                        name: activeSubscription.plan_name
                    } : null,
                    formCount: polarData.formCount || 0,
                    // Add additional metadata for Polar subscriptions
                    isPolarSubscription: true,
                    customerId: polarData.customerId
                };

                setSubscriptionDetails(transformedData);
            }

        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, endDate = null) => {
        return <StatusBadge status={status} endDate={endDate} />;
    };

    // Check if user has no active subscription
    const hasNoSubscription = !subscriptionDetails ||
        !subscriptionDetails.subscription ||
        subscriptionDetails.subscription.status !== 'active';

    // State for Polar portal loading
    const [portalLoading, setPortalLoading] = useState(false);

    // Handle opening Polar customer portal
    const handleOpenPolarPortal = async () => {
        setPortalLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/polar/billing-portal`,
                { withCredentials: true }
            );

            if (response.data.url) {
                window.open(response.data.url, '_blank');
            } else {
                toast({
                    title: "Error",
                    description: "Could not open billing portal. Please try again.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error opening billing portal:', error);
            toast({
                title: "Error",
                description: "Could not open billing portal. Please try again.",
                variant: "destructive"
            });
        } finally {
            setPortalLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <CustomerLayoutPage>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Manage your subscription and payment history
                        </p>
                    </div>
                    <Button
                        onClick={handleOpenPolarPortal}
                        disabled={portalLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        {portalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ExternalLink className="h-4 w-4" />
                        )}
                        Manage in Polar
                    </Button>
                </div>

                {/* Subscription Status Banner - Shown at the top */}
                <SubscriptionStatusBanner 
                    subscriptionDetails={subscriptionDetails} 
                    formatDate={formatDate} 
                />

                <Tabs value={hasNoSubscription ? "plans" : activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview" disabled={hasNoSubscription}>
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="plans">Plans</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <SubscriptionOverview 
                            subscriptionDetails={subscriptionDetails}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                            getStatusBadge={getStatusBadge}
                            setActiveTab={setActiveTab}
                            //toggleAutoRenew={toggleAutoRenew}
                        />
                    </TabsContent>

                    {/* Plans Tab */}
                    <TabsContent value="plans" className="space-y-6">
                        <PaymentPlans />
                    </TabsContent>

                </Tabs>
            </div>
        </CustomerLayoutPage>
    );
}

export default BillingPage;