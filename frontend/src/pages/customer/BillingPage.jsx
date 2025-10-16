import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CustomerLayoutPage from "./LayoutPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
    CreditCard, 
    Calendar, 
    DollarSign, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Trash2,
    Star,
    ExternalLink,
    Download,
    Settings
} from "lucide-react";
import toast from "react-hot-toast";
import AddPaymentMethodDialog from "@/components/AddPaymentMethodDialog";
import PlanDowngradeDialog from "@/components/PlanDowngradeDialog";
// Plan downgrade check is now handled directly in handlePlanChange

function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [loadingPlanId, setLoadingPlanId] = useState(null);
    const [planInterval, setPlanInterval] = useState("yearly");
    const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
    const [downgradeData, setDowngradeData] = useState(null);
    const [togglingAutoRenewal, setTogglingAutoRenewal] = useState(false);
    
    // Plan downgrade state is now managed locally in handlePlanChange
    
    const { isAuthenticated, updateUserPayment } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchBillingData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const [subscriptionRes, historyRes, plansRes, methodsRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/billing/subscription-details`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/billing/payment-history`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/billing/available-plans`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/billing/payment-methods`, { withCredentials: true })
            ]);

            if (subscriptionRes.status === 'fulfilled') {
                setSubscriptionDetails(subscriptionRes.value.data.data);
            }

            if (historyRes.status === 'fulfilled') {
                setPaymentHistory(historyRes.value.data.data);
            }

            if (plansRes.status === 'fulfilled') {
                setAvailablePlans(plansRes.value.data.data);
            }

            if (methodsRes.status === 'fulfilled') {
                setPaymentMethods(methodsRes.value.data.data);
            }

        } catch (err) {
            console.error('Error fetching billing data:', err);
            setError('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    };

    const handleManagePortal = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/billing/create-customer-portal-session`,
                {},
                { withCredentials: true }
            );
            window.open(response.data.url, '_blank');
        } catch (err) {
            console.error('Error opening billing portal:', err);
            toast.error('Failed to open billing portal');
        }
    };

    const handlePlanChange = async (priceId, planName) => {
        try {
            setLoadingPlanId(priceId);
            
            // Step 1: Check plan change requirements FIRST (before any Stripe update)
            console.log('🔍 Checking plan change requirements for:', { priceId, planName });
            
            const checkResponse = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/check-plan-change`,
                { priceId, planName },
                { withCredentials: true }
            );
            
            if (!checkResponse.data.success) {
                if (checkResponse.data.current) {
                    toast.error('You are already subscribed to this plan');
                    return;
                }
                toast.error(checkResponse.data.error || 'Failed to check plan requirements');
                return;
            }
            
            const checkResult = checkResponse.data;
            console.log('📊 Plan change check result:', checkResult);
            console.log('🔍 Check details:');
            console.log('  - requiresFormSelection:', checkResult.requiresFormSelection);
            console.log('  - isDowngrade:', checkResult.isDowngrade);
            console.log('  - isNewSubscription:', checkResult.isNewSubscription);
            console.log('  - currentPlan:', checkResult.currentPlan);
            console.log('  - targetPlan:', checkResult.targetPlan);
            
            // Step 2: Handle based on check results
            if (checkResult.requiresFormSelection && checkResult.isDowngrade) {
                // Show modal immediately for downgrades requiring form selection
                console.log('📦 Opening modal for downgrade form selection');
                
                const modalData = {
                    ...checkResult.planChangeInfo,
                    targetPlan: checkResult.targetPlan,
                    currentPlan: checkResult.currentPlan,
                    subscriptionInfo: checkResult.subscriptionInfo
                };
                
                setDowngradeData(modalData);
                setShowDowngradeDialog(true);
                toast(`Select which forms to keep active when switching to ${planName}`, {
                    icon: 'ℹ️',
                    duration: 4000
                });
                return; // Don't proceed with Stripe update yet
            }
            
            if (checkResult.isNewSubscription) {
                // Create new subscription via checkout
                console.log('🆕 Creating new subscription');
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/checkout-session`,
                    { priceId, planName },
                    { withCredentials: true }
                );
                
                // Redirect to Stripe checkout
                window.location.href = response.data.url;
                return;
            }
            
            // Step 3: For upgrades or non-conflicting changes, proceed directly
            console.log('⬆️ Proceeding with direct subscription update');
            
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/update-plan`,
                { priceId, planName },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                // Handle completed updates (upgrades or non-conflicting changes)
                const protectionResult = response.data.planChangeProtection;
                if (protectionResult && protectionResult.requiresAction && protectionResult.autoHandled) {
                    if (protectionResult.isUpgrade) {
                        toast.success(`Plan upgraded! ${protectionResult.unlockedForms || 0} forms were unlocked.`);
                    } else {
                        toast.info(protectionResult.message);
                    }
                } else {
                    toast.success(response.data.message);
                }
                
                // Refresh billing data for completed updates
                await fetchBillingData();
                
                // Update global user payment data to refresh header
                try {
                    const updatedUser = await updateUserPayment();
                    console.log('✅ Global user payment data updated:', updatedUser?.payment?.plan);
                } catch (updateError) {
                    console.warn('Failed to update global user data:', updateError);
                }
            }
            
        } catch (err) {
            console.error('Error handling plan change:', err);
            const errorMessage = err.response?.data?.error || 'Failed to process plan change';
            
            if (err.response?.data?.current) {
                toast.error('You are already subscribed to this plan');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoadingPlanId(null);
        }
    };

    const handleDowngradeComplete = async () => {
        // Refresh billing data after downgrade handling
        await fetchBillingData();
        
        // Update global user payment data to refresh header
        try {
            const updatedUser = await updateUserPayment();
            console.log('✅ Global user payment data updated after downgrade:', updatedUser?.payment?.plan);
        } catch (updateError) {
            console.warn('Failed to update global user data after downgrade:', updateError);
        }
        
        setShowDowngradeDialog(false);
        setDowngradeData(null);
        toast.success('Plan downgrade completed successfully!');
    };

    const handleDowngradeClose = () => {
        setShowDowngradeDialog(false);
        setDowngradeData(null);
    };

    const handleDeletePaymentMethod = async (paymentMethodId) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/billing/payment-methods/${paymentMethodId}`,
                { withCredentials: true }
            );
            toast.success('Payment method removed successfully');
            fetchBillingData();
        } catch (err) {
            console.error('Error removing payment method:', err);
            toast.error('Failed to remove payment method');
        }
    };

    const formatCurrency = (amount, currency = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Helper function to determine if a plan is an upgrade or downgrade
    const getPlanChangeType = (currentPlan, targetPlan) => {
        if (!currentPlan || !targetPlan) return 'upgrade';
        
        // Normalize plan names for comparison
        const normalizePlanName = (name) => {
            if (!name) return 'basic';
            return name.toLowerCase().replace(/\s*plan\s*$/i, '').trim();
        };
        
        const currentPlanName = normalizePlanName(currentPlan.name);
        const targetPlanName = normalizePlanName(targetPlan.name);
        
        // Define plan hierarchy (basic < standard < premium)
        const planHierarchy = {
            'basic': 1,
            'standard': 2,
            'premium': 3
        };
        
        const currentLevel = planHierarchy[currentPlanName] || 1;
        const targetLevel = planHierarchy[targetPlanName] || 1;
        
        if (targetLevel > currentLevel) return 'upgrade';
        if (targetLevel < currentLevel) return 'downgrade';
        return 'same'; // Same plan level
    };

    // Toggle auto-renewal for subscription
    const handleToggleAutoRenewal = async () => {
        try {
            setTogglingAutoRenewal(true);
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/toggle-auto-renewal`,
                {},
                { withCredentials: true }
            );
            
            if (response.data.success) {
                // Refresh subscription details
                await fetchBillingData();
                toast.success(response.data.message);
            }
        } catch (err) {
            console.error('Error toggling auto-renewal:', err);
            const errorMessage = err.response?.data?.error || 'Failed to toggle auto-renewal';
            
            // Check if the error is because no payment method is set
            if (err.response?.data?.requiresPaymentMethod) {
                toast.error(errorMessage, {
                    duration: 6000,
                    icon: '💳'
                });
                // Optionally switch to the payment methods tab to prompt user to add one
                setActiveTab("payment-methods");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setTogglingAutoRenewal(false);
        }
    };

    // Renew previous subscription plan
    const handleRenewPreviousPlan = async () => {
        try {
            setLoadingPlanId('renew_previous');
            
            // First check if user has a payment method
            if (!paymentMethods || paymentMethods.length === 0) {
                toast.error('Please add a payment method before renewing your plan.', {
                    duration: 6000,
                    icon: '💳'
                });
                setActiveTab("payment-methods");
                return;
            }
            
            // Call backend to create a new subscription based on previous plan
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/renew-previous-plan`,
                { previousPlan: subscriptionDetails.previousPlan },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                if (response.data.redirectUrl) {
                    // Redirect to Stripe checkout
                    window.location.href = response.data.redirectUrl;
                } else {
                    // Refresh billing data for completed updates
                    await fetchBillingData();
                    toast.success('Plan renewed successfully!');
                    
                    // Update global user payment data to refresh header
                    try {
                        const updatedUser = await updateUserPayment();
                        console.log('✅ Global user payment data updated:', updatedUser?.payment?.plan);
                    } catch (updateError) {
                        console.warn('Failed to update global user data:', updateError);
                    }
                }
            }
        } catch (err) {
            console.error('Error renewing previous plan:', err);
            const errorMessage = err.response?.data?.error || 'Failed to renew previous plan';
            toast.error(errorMessage);
        } finally {
            setLoadingPlanId(null);
        }
    };

    // Filter plans by interval
    const monthlyPlans = availablePlans.filter(plan => plan.interval === 'month');
    const yearlyPlans = availablePlans.filter(plan => plan.interval === 'year');
    const currentPlans = planInterval === 'monthly' ? monthlyPlans : yearlyPlans;
    
    // Check if user has no active subscription
    const hasNoSubscription = !subscriptionDetails || 
        subscriptionDetails.subscription.status === 'inactive' || 
        subscriptionDetails.subscription.status === 'canceled';

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { color: 'w-fit bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
            past_due: { color: 'w-fit bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Past Due' },
            canceled: { color: 'w-fit bg-red-100 text-red-800', icon: XCircle, text: 'Canceled' },
            inactive: { color: 'w-fit bg-gray-100 text-gray-800', icon: XCircle, text: 'Inactive' },
        };
        
        const config = statusConfig[status] || statusConfig.inactive;
        const Icon = config.icon;
        
        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <Icon size={12} />
                {config.text}
            </Badge>
        );
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return (
            <CustomerLayoutPage>
                <div className="pt-4 md:p-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please log in to access your billing information.
                        </AlertDescription>
                    </Alert>
                </div>
            </CustomerLayoutPage>
        );
    }

    if (error) {
        return (
            <CustomerLayoutPage>
                <div className="pt-4 md:p-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                </div>
            </CustomerLayoutPage>
        );
    }

    return (
        <CustomerLayoutPage>
            <div className="pt-4 md:p-4 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                            Billing & Subscription
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage your subscription, payment methods, and billing history
                        </p>
                    </div>
                    <Button onClick={handleManagePortal} variant="outline" className="flex items-center gap-2 w-full md:w-auto">
                        <Settings size={16} />
                        Stripe Portal
                        <ExternalLink size={14} />
                    </Button>
                </div>

                <Tabs value={hasNoSubscription ? "plans" : activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="overview" disabled={hasNoSubscription} className="col-span-1">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="plans" className="col-span-1">Plans</TabsTrigger>
                        <TabsTrigger value="payment-methods" disabled={hasNoSubscription} className="col-span-1">
                            Payment Methods
                        </TabsTrigger>
                        <TabsTrigger value="history" disabled={hasNoSubscription} className="col-span-1">
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Current Subscription */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <Star className="h-5 w-5" />
                                    Current Subscription
                                </CardTitle>
                                <CardDescription>
                                    Your current plan details and usage
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subscriptionDetails ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-500">Plan</p>
                                            <p className="text-lg font-semibold">{subscriptionDetails.plan.displayName}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-500">Status</p>
                                            {getStatusBadge(subscriptionDetails.subscription.status)}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-500">Next Billing</p>
                                            <p className="text-sm">
                                                {subscriptionDetails.subscription.current_period_end
                                                    ? formatDate(subscriptionDetails.subscription.current_period_end)
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-500">Forms Limit</p>
                                            <p className="text-sm">{subscriptionDetails.plan.formLimit} forms</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No active subscription</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        {subscriptionDetails && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <DollarSign className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Plan Features</p>
                                                <p className="text-lg font-semibold">{subscriptionDetails.plan.features?.length || 0} included</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Submission Limit</p>
                                                <p className="text-lg font-semibold">{subscriptionDetails.plan.submissionLimit?.toLocaleString() || 'Unlimited'}/month</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Calendar className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Auto Renewal</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg font-semibold">
                                                        {subscriptionDetails.subscription.cancel_at_period_end ? 'Disabled' : 'Enabled'}
                                                    </p>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={handleToggleAutoRenewal}
                                                        disabled={togglingAutoRenewal}
                                                        className="h-8 px-2"
                                                    >
                                                        {togglingAutoRenewal ? (
                                                            <div className="flex items-center gap-1">
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900"></div>
                                                                <span>...</span>
                                                            </div>
                                                        ) : subscriptionDetails.subscription.cancel_at_period_end ? (
                                                            'Enable'
                                                        ) : (
                                                            'Disable'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>

                    {/* Plans Tab */}
                    <TabsContent value="plans" className="space-y-6">
                        {hasNoSubscription && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    You don&apos;t have an active subscription. Choose a plan below to get started.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold">
                                {hasNoSubscription ? 'Choose Your Subscription Plan' : 'Available Plans'}
                            </h3>
                            <div className="flex flex-col md:flex-row items-center gap-2">
                                <span className="text-sm text-gray-500">Billing:</span>
                                <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-2">
                                    <button
                                        onClick={() => setPlanInterval('monthly')}
                                        className={`px-4 py-2 text-sm rounded-md transition-colors ${
                                            planInterval === 'monthly'
                                                ? 'bg-white dark:bg-slate-950 shadow-sm  dark:text-gray-300'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setPlanInterval('yearly')}
                                        className={`px-4 py-2 text-sm rounded-md transition-colors ${
                                            planInterval === 'yearly'
                                                ? 'bg-white dark:bg-slate-950 shadow-sm dark:text-gray-300'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                        }`}
                                    >
                                        Yearly
                                        <span className="ml-1 text-xs text-green-600 font-medium">
                                            (Save 16%)
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Previous Plan Renewal Option */}
                        {hasNoSubscription && subscriptionDetails?.previousPlan && (
                            <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                        <Star className="h-5 w-5" />
                                        Renew Your Previous Plan
                                    </CardTitle>
                                    <CardDescription>
                                        You previously had the {subscriptionDetails.previousPlan.plan} plan. 
                                        Renew it with your existing payment method.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span>Expired: {formatDate(subscriptionDetails.previousPlan.subscription_expiry)}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleRenewPreviousPlan()}
                                        disabled={loadingPlanId === 'renew_previous'}
                                    >
                                        {loadingPlanId === 'renew_previous' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            'Renew Previous Plan'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentPlans.map((plan) => {
                                // Check if this plan matches both name and billing interval
                                // Convert frontend interval format (monthly/yearly) to Stripe format (month/year)
                                const currentInterval = planInterval === 'monthly' ? 'month' : 'year';
                                const isCurrentPlan = subscriptionDetails?.plan.name.toLowerCase().includes(plan.name.toLowerCase()) &&
                                    subscriptionDetails?.subscription.status === 'active' &&
                                    subscriptionDetails?.subscription.interval === currentInterval;
                                
                                return (
                                    <Card key={plan.priceId} className={`relative ${
                                        isCurrentPlan ? 'ring-2 ring-blue-500 bg-slate-200 dark:bg-slate-900' : ''
                                    }`}>
                                        {isCurrentPlan && (
                                            <div className="absolute -top-2 -right-2">
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    Current Plan
                                                </Badge>
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                                            <CardDescription>{plan.description}</CardDescription>
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(plan.amount)}
                                                <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                                            </div>
                                            {planInterval === 'yearly' && (
                                                <div className="text-xs text-green-600">
                                                    Save {formatCurrency((plan.amount * 12 - plan.amount * 10) / 12)} per month
                                                </div>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {plan.features && plan.features.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {plan.features.map((feature, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm">
                                                            <CheckCircle size={14} className="text-green-500" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <ul className="space-y-2">
                                                    <li className="flex items-center gap-2 text-sm">
                                                        <CheckCircle size={14} className="text-green-500" />
                                                        All features included
                                                    </li>
                                                </ul>
                                            )}
                                            <Button 
                                                className={`w-full text-white ${
                                                    isCurrentPlan 
                                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                                }`}
                                                onClick={() => handlePlanChange(plan.priceId, plan.name)}
                                                disabled={isCurrentPlan || loadingPlanId === plan.priceId}
                                            >
                                                {loadingPlanId === plan.priceId ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Processing...</span>
                                                    </div>
                                                ) : isCurrentPlan ? (
                                                    'Current Plan'
                                                ) : hasNoSubscription && subscriptionDetails?.previousPlan ? (
                                                    // User had a previous plan, check if this is the same plan
                                                    (subscriptionDetails.previousPlan.plan.toLowerCase().includes(plan.name.toLowerCase()) || 
                                                     plan.name.toLowerCase().includes(subscriptionDetails.previousPlan.plan.toLowerCase())) ? (
                                                        'Renew Plan'
                                                    ) : getPlanChangeType(
                                                        { name: subscriptionDetails.previousPlan.plan }, 
                                                        plan
                                                    ) === 'downgrade' ? (
                                                        'Downgrade to This Plan'
                                                    ) : (
                                                        'Upgrade to This Plan'
                                                    )
                                                ) : hasNoSubscription ? (
                                                    'Choose Plan'
                                                ) : (
                                                    // Determine button text based on plan comparison
                                                    getPlanChangeType(subscriptionDetails?.plan, plan) === 'downgrade' 
                                                        ? 'Downgrade to This Plan' 
                                                        : 'Upgrade to This Plan'
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        
                        {currentPlans.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">No {planInterval} plans available</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Payment Methods Tab */}
                    <TabsContent value="payment-methods" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Payment Methods</h3>
                            <AddPaymentMethodDialog onPaymentMethodAdded={fetchBillingData} />
                        </div>
                        
                        {paymentMethods.length > 0 ? (
                            <div className="grid gap-4">
                                {paymentMethods.map((method) => (
                                    <Card key={method.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 rounded">
                                                        <CreditCard className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Expires {method.card?.exp_month}/{method.card?.exp_year}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 mb-4">No payment methods found</p>
                                    <AddPaymentMethodDialog onPaymentMethodAdded={fetchBillingData} />
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Payment History</h3>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Download size={14} />
                                Export
                            </Button>
                        </div>
                        
                        {paymentHistory.length > 0 ? (
                            <div className="space-y-3">
                                {paymentHistory.map((payment) => (
                                    <Card key={payment.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded ${
                                                        payment.status === 'succeeded' || payment.status === 'paid'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        <DollarSign className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{payment.description}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(payment.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {formatCurrency(payment.amount, payment.currency)}
                                                    </p>
                                                    <Badge 
                                                        className={`text-xs ${
                                                            payment.status === 'succeeded' || payment.status === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">No payment history found</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
            
            {/* Plan Downgrade Dialog */}
            <PlanDowngradeDialog
                isOpen={showDowngradeDialog}
                onClose={handleDowngradeClose}
                onComplete={handleDowngradeComplete}
                initialDowngradeData={downgradeData}
            />
        </CustomerLayoutPage>
    );
}

export default BillingPage;