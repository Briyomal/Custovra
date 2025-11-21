import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

import CustomerLayoutPage from "./LayoutPage";
import LoadingSpinner from "@/components/LoadingSpinner";

// Import our new components directly
import SubscriptionOverview from "@/components/customer-view/billing/SubscriptionOverview";
import SubscriptionPlans from "@/components/customer-view/billing/SubscriptionPlans";
import PaymentHistory from "@/components/customer-view/billing/PaymentHistory";
import DowngradeDialog from "@/components/customer-view/billing/DowngradeDialog";
import SubscriptionStatusBanner from "@/components/customer-view/billing/SubscriptionStatusBanner";
import StatusBadge from "@/components/customer-view/billing/StatusBadge";

// Import utility functions from main utils folder
import { formatCurrency, formatDate } from "@/utils/billing";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    // Downgrade form selection state
    const [isDowngradeDialogOpen, setIsDowngradeDialogOpen] = useState(false);
    const [downgradeInfo, setDowngradeInfo] = useState(null);
    const [selectedFormIds, setSelectedFormIds] = useState([]);
    const [isCheckingDowngrade, setIsCheckingDowngrade] = useState(false);
    const [isSubmittingDowngrade, setIsSubmittingDowngrade] = useState(false);
    const [downgradeError, setDowngradeError] = useState('');
    const [paymentFormData, setPaymentFormData] = useState({
        planId: "",
        billingPeriod: "monthly",
        paymentMethod: "genie_card",
        paymentProof: null
    });
    
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
    }, [location.search, navigate]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const [subscriptionRes, historyRes, plansRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/subscription-details`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/genie/payment-history`, { withCredentials: true }), // Use Genie payment history
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/available-plans`, { withCredentials: true })
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

        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            planId: "",
            billingPeriod: "monthly",
            paymentMethod: "genie_card",
            paymentProof: null
        });
        // Reset downgrade state as well
        setDowngradeInfo(null);
        setSelectedFormIds([]);
    };

    const getStatusBadge = (status, endDate = null) => {
        return <StatusBadge status={status} endDate={endDate} />;
    };

    // Downgrade form selection functions
    const checkDowngradeImpact = async (planId) => {
        try {
            setIsCheckingDowngrade(true);
            setDowngradeError('');
            
            console.log('Checking downgrade impact for planId:', planId);
            
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/plan-downgrade/check-downgrade-impact`,
                { 
                    params: { targetPlanId: planId },
                    withCredentials: true 
                }
            );
            
            const data = response.data.data;
            console.log('Downgrade check response:', data);
            
            if (data.requiresAction) {
                // User needs to select forms
                setDowngradeInfo({
                    ...data,
                    targetPlanId: planId
                });
                // Pre-select forms up to the limit
                const preSelectedIds = data.activeForms
                    .slice(0, data.newPlanLimit)
                    .map(form => form._id);
                setSelectedFormIds(preSelectedIds);
                setIsDowngradeDialogOpen(true);
            } else {
                // No action needed, proceed with normal payment flow
                // Proceed directly to payment
                const paymentData = {
                    planId: planId,
                    billingPeriod: paymentFormData.billingPeriod,
                    paymentMethod: "genie_card",
                    paymentProof: null
                };
                await handleDirectPayment(paymentData);
            }
        } catch (err) {
            console.error('Error checking downgrade impact:', err);
            const errorMessage = err.response?.data?.error || 'Failed to check downgrade impact';
            setDowngradeError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsCheckingDowngrade(false);
        }
    };

    const handleFormToggle = (formId) => {
        setSelectedFormIds(prev => {
            const isSelected = prev.includes(formId);
            
            if (isSelected) {
                // Remove form
                return prev.filter(id => id !== formId);
            } else {
                // Add form (check limit)
                // For upgrades, use targetPlanLimit; for downgrades, use newPlanLimit
                const limit = downgradeInfo?.isUpgrade ? downgradeInfo.targetPlanLimit : downgradeInfo?.newPlanLimit;
                if (limit && prev.length >= limit) {
                    toast({
                        title: "Error",
                        description: `You can only select ${limit} form(s)` ,
                        variant: "destructive",
                    });
                    return prev;
                }
                return [...prev, formId];
            }
        });
    };

    const handleAutoSelect = () => {
        if (downgradeInfo?.isUpgrade) {
            // For upgrades, auto-select up to the target plan limit or total form count (whichever is smaller)
            // We can select any forms, but let's select unlocked ones first, then locked ones
            const unlockedForms = downgradeInfo.allForms.filter(form => !form.is_locked);
            const lockedForms = downgradeInfo.allForms.filter(form => form.is_locked);
            
            // Combine unlocked forms first, then locked forms
            const allFormsSorted = [...unlockedForms, ...lockedForms];
            
            // Select up to the target plan limit or total form count (whichever is smaller)
            const maxSelectable = Math.min(downgradeInfo.targetPlanLimit, downgradeInfo.totalFormCount);
            const preSelectedIds = allFormsSorted
                .slice(0, maxSelectable)
                .map(form => form._id);
                
            setSelectedFormIds(preSelectedIds);
            toast({
                title: "Info",
                description: `Auto-selected ${preSelectedIds.length} forms`,
            });
        } else {
            // For downgrades, auto-select the most recent forms up to the limit
            const preSelectedIds = downgradeInfo.activeForms
                .slice(0, downgradeInfo.newPlanLimit)
                .map(form => form._id);
            setSelectedFormIds(preSelectedIds);
            toast({
                title: "Info",
                description: `Auto-selected ${preSelectedIds.length} most recent forms`,
            });
        }
    };

    const handleDowngradeSubmit = async () => {
        try {
            setIsSubmittingDowngrade(true);
            setDowngradeError('');
            
            if (selectedFormIds.length === 0) {
                setDowngradeError('Please select at least one form to keep active');
                return;
            }
            
            if (selectedFormIds.length > downgradeInfo.newPlanLimit) {
                setDowngradeError(`You can only select ${downgradeInfo.newPlanLimit} form(s)`);
                return;
            }
            
            // Debug log
            console.log('Submitting form selection for downgrade with targetPlanId:', downgradeInfo.targetPlanId);
            console.log('Selected form IDs:', selectedFormIds);
            
            // Set payment form data first with form selection info
            const newPaymentFormData = {
                planId: downgradeInfo.targetPlanId,
                billingPeriod: paymentFormData.billingPeriod,
                paymentMethod: "genie_card",
                paymentProof: null,
                // Store form selection for processing after payment
                formSelection: {
                    selectedFormIds: selectedFormIds,
                    isUpgrade: false,
                    targetPlanId: downgradeInfo.targetPlanId
                }
            };
            console.log('Setting payment form data to:', newPaymentFormData);
            setPaymentFormData(newPaymentFormData);
            
            // Close dialog and proceed directly to payment
            setIsDowngradeDialogOpen(false);
            
            // Proceed directly to payment
            await handleDirectPayment(newPaymentFormData);
        } catch (err) {
            console.error('Error handling form selection:', err);
            const errorMessage = err.response?.data?.error || 'Failed to save form selection';
            setDowngradeError(errorMessage);
            console.log('Form selection saved successfully');
        } finally {
            setIsSubmittingDowngrade(false);
        }
    };

    // Check if user needs to manage forms due to plan upgrade
    const checkUpgradeImpact = async (planId) => {
        try {
            setIsCheckingDowngrade(true);
            setDowngradeError('');
            
            console.log('Checking upgrade impact for planId:', planId);
            
            // For upgrades, we need to show all forms, not just locked ones
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/plan-downgrade/all-forms-for-upgrade`,
                { withCredentials: true }
            );
            
            const allFormsData = response.data.data;
            console.log('All forms data:', allFormsData);
            
            // Get the target plan to get its limit
            const targetPlan = availablePlans.find(plan => plan.id === planId);
            
            // For upgrades, show all forms if the target plan allows more forms than currently available
            if (allFormsData.count > 0 && targetPlan) {
                // User has forms, need to select which ones to unlock/use with new plan
                setDowngradeInfo({
                    requiresAction: true,
                    isUpgrade: true, // Indicator for upgrade scenario
                    targetPlanId: planId,
                    targetPlanName: targetPlan.name,
                    targetPlanLimit: targetPlan.form_limit,
                    allForms: allFormsData.allForms, // Show all forms, not just locked ones
                    totalFormCount: allFormsData.count,
                    message: `You have ${allFormsData.count} form(s). Please select up to ${targetPlan.form_limit} form(s) to use with your new ${targetPlan.name} plan.`
                });
                // Pre-select forms up to the limit
                setSelectedFormIds([]);
                setIsDowngradeDialogOpen(true);
            } else {
                // No forms or no target plan, proceed with normal payment flow
                // Proceed directly to payment
                const paymentData = {
                    planId: planId,
                    billingPeriod: paymentFormData.billingPeriod,
                    paymentMethod: "genie_card",
                    paymentProof: null
                };
                await handleDirectPayment(paymentData);
            }
        } catch (err) {
            console.error('Error checking upgrade impact:', err);
            const errorMessage = err.response?.data?.error || 'Failed to check upgrade impact';
            setDowngradeError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsCheckingDowngrade(false);
        }
    };

    const handleUpgradeSubmit = async () => {
        try {
            setIsSubmittingDowngrade(true);
            setDowngradeError('');
            
            if (selectedFormIds.length === 0) {
                setDowngradeError('Please select at least one form to unlock');
                return;
            }
            
            // Get the target plan to validate the selection
            const targetPlan = availablePlans.find(plan => plan.id === downgradeInfo.targetPlanId);
            if (!targetPlan) {
                setDowngradeError('Target plan not found');
                return;
            }
            
            if (selectedFormIds.length > targetPlan.form_limit) {
                setDowngradeError(`You can only select ${targetPlan.form_limit} form(s) for your ${targetPlan.name} plan`);
                return;
            }
            
            // Debug log
            console.log('Submitting form selection for upgrade with targetPlanId:', downgradeInfo.targetPlanId);
            console.log('Selected form IDs:', selectedFormIds);
            
            // Set payment form data first with form selection info
            const newPaymentFormData = {
                planId: downgradeInfo.targetPlanId,
                billingPeriod: paymentFormData.billingPeriod,
                paymentMethod: "genie_card",
                paymentProof: null,
                // Store form selection for processing after payment
                formSelection: {
                    selectedFormIds: selectedFormIds,
                    isUpgrade: true,
                    targetPlanId: downgradeInfo.targetPlanId
                }
            };
            console.log('Setting payment form data to:', newPaymentFormData);
            setPaymentFormData(newPaymentFormData);
            
            // Close dialog and proceed directly to payment
            setIsDowngradeDialogOpen(false);
            
            // Proceed directly to payment
            await handleDirectPayment(newPaymentFormData);
        } catch (err) {
            console.error('Error handling form selection for upgrade:', err);
            const errorMessage = err.response?.data?.error || 'Failed to save form selection';
            setDowngradeError(errorMessage);
            console.log('Form selection saved successfully');
        } finally {
            setIsSubmittingDowngrade(false);
        }
    };

    // New function to handle direct payment without modal
    const handleDirectPayment = async (formData, retryCount = 0) => {
        try {
            console.log('Submitting Genie payment request with formData:', formData);
            
            // Validate that we have a planId
            if (!formData.planId) {
                console.error('Plan selection is required.');
                return;
            }
            
            const requestData = new FormData();
            requestData.append('planId', formData.planId);
            requestData.append('billingPeriod', formData.billingPeriod);
            
            // Add form selection data if it exists
            if (formData.formSelection) {
                requestData.append('formSelection', JSON.stringify(formData.formSelection));
            }
            
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/genie/payment-request`,
                requestData,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data.success) {
                // If we have a payment URL, redirect the user to complete the payment
                if (response.data.data.paymentUrl) {
                    window.location.href = response.data.data.paymentUrl;
                } else {
                    console.log(response.data.message);
                    resetPaymentForm();
                    fetchBillingData();
                }
            }
        } catch (err) {
            console.error('Error submitting Genie payment request:', err);
            const errorMessage = err.response?.data?.error || 'Failed to submit payment request';
            console.error(errorMessage);
            
            // If it's a plan not found error, only retry once to avoid infinite loop
            if (errorMessage.includes('Plan not found') && retryCount < 1) {
                // Refresh available plans and try again
                try {
                    const plansRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/available-plans`, { withCredentials: true });
                    setAvailablePlans(plansRes.data.data);
                    // Retry the payment request with the refreshed data
                    setTimeout(() => handleDirectPayment(formData, retryCount + 1), 100);
                } catch (refreshError) {
                    console.error('Error refreshing plans:', refreshError);
                    // If we can't refresh plans, show error to user
                    toast({
                        title: "Error",
                        description: 'Failed to process payment. Please try again.',
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        }
    };

    // Function to handle "Pay for next month" directly
    const handlePayForNextMonth = async (planId) => {
        const paymentData = {
            planId: planId,
            billingPeriod: paymentFormData.billingPeriod, // Use the currently selected billing period
            paymentMethod: "genie_card",
            paymentProof: null
        };
        
        await handleDirectPayment(paymentData);
    };

    // Check if user has no active subscription
    const hasNoSubscription = !subscriptionDetails || 
        !subscriptionDetails.subscription || 
        subscriptionDetails.subscription.status !== 'active';

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <CustomerLayoutPage>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your subscription and payment history
                    </p>
                </div>

                {/* Subscription Status Banner - Shown at the top */}
                <SubscriptionStatusBanner 
                    subscriptionDetails={subscriptionDetails} 
                    formatDate={formatDate} 
                />

                <Tabs value={hasNoSubscription ? "plans" : activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview" disabled={hasNoSubscription} className="col-span-1">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="plans" className="col-span-1">Plans</TabsTrigger>
                        <TabsTrigger value="history" disabled={hasNoSubscription} className="col-span-1">
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <SubscriptionOverview 
                            subscriptionDetails={subscriptionDetails}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                            getStatusBadge={getStatusBadge}
                            setActiveTab={setActiveTab}
                        />
                    </TabsContent>

                    {/* Plans Tab */}
                    <TabsContent value="plans" className="space-y-6">
                        <SubscriptionPlans 
                            subscriptionDetails={subscriptionDetails}
                            availablePlans={availablePlans}
                            setPaymentFormData={setPaymentFormData}
                            handlePayForNextMonth={handlePayForNextMonth}
                            checkDowngradeImpact={checkDowngradeImpact}
                            checkUpgradeImpact={checkUpgradeImpact}
                            isCheckingDowngrade={isCheckingDowngrade}
                            formatCurrency={formatCurrency}
                        />
                        
                        {/* Downgrade Dialog */}
                        <DowngradeDialog 
                            isDowngradeDialogOpen={isDowngradeDialogOpen}
                            setIsDowngradeDialogOpen={setIsDowngradeDialogOpen}
                            downgradeInfo={downgradeInfo}
                            selectedFormIds={selectedFormIds}
                            handleFormToggle={handleFormToggle}
                            handleAutoSelect={handleAutoSelect}
                            handleDowngradeSubmit={handleDowngradeSubmit}
                            handleUpgradeSubmit={handleUpgradeSubmit}
                            isSubmittingDowngrade={isSubmittingDowngrade}
                            downgradeError={downgradeError}
                            formatDate={formatDate}
                        />
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-6">
                        <PaymentHistory 
                            paymentHistory={paymentHistory}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </CustomerLayoutPage>
    );
}

export default BillingPage;