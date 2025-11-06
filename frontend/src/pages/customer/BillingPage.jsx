import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CustomerLayoutPage from "./LayoutPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
    CreditCard, 
    Calendar, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    FileText,
    Lock,
    Unlock
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [availablePlans, setAvailablePlans] = useState([]);
    // const [error, setError] = useState(null);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
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
        paymentMethod: "bank_transfer",
        paymentProof: null
    });
    
    const { isAuthenticated } = useAuthStore();

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
            const [subscriptionRes, historyRes, plansRes, pendingRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/subscription-details`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/payment-history`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/available-plans`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/pending-payments`, { withCredentials: true })
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

            if (pendingRes.status === 'fulfilled') {
                setPendingPayments(pendingRes.value.data.data);
            }

        } catch (err) {
            console.error('Error fetching billing data:', err);
            // setError('Failed to load billing information');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentRequest = async (e) => {
        e.preventDefault();
        console.log('Submitting payment request with paymentFormData:', paymentFormData);
        
        // Validate that we have a planId
        if (!paymentFormData.planId) {
            toast.error('Plan selection is required. Please try the downgrade process again.');
            // Reset and allow user to restart the process
            setIsPaymentDialogOpen(false);
            if (downgradeInfo?.targetPlanId) {
                setTimeout(() => restartDowngradeProcess(downgradeInfo.targetPlanId), 100);
            }
            return;
        }
        
        const formData = new FormData();
        formData.append('planId', paymentFormData.planId);
        formData.append('billingPeriod', paymentFormData.billingPeriod);
        formData.append('paymentMethod', paymentFormData.paymentMethod);
        
        // Add form selection data if it exists
        if (paymentFormData.formSelection) {
            formData.append('formSelection', JSON.stringify(paymentFormData.formSelection));
        }
        
        if (paymentFormData.paymentProof) {
            formData.append('paymentProof', paymentFormData.paymentProof);
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/manual-billing/payment-request`,
                formData,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data.success) {
                toast.success(response.data.message);
                setIsPaymentDialogOpen(false);
                resetPaymentForm();
                fetchBillingData();
            }
        } catch (err) {
            console.error('Error submitting payment request:', err);
            const errorMessage = err.response?.data?.error || 'Failed to submit payment request';
            toast.error(errorMessage);
            
            // If it's a plan not found error, reset and allow user to try again
            if (errorMessage.includes('Plan not found')) {
                setIsPaymentDialogOpen(false);
                if (downgradeInfo?.targetPlanId) {
                    setTimeout(() => restartDowngradeProcess(downgradeInfo.targetPlanId), 100);
                }
            }
        }
    };
    
    // Function to restart the downgrade process
    // This function is used when users need to restart the downgrade process after cancelling or failing payment
    const restartDowngradeProcess = (planId) => {
        // Reset any existing downgrade state
        setDowngradeInfo(null);
        setSelectedFormIds([]);
        // Start the downgrade process again
        checkDowngradeImpact(planId);
    };

    const handleCancelPaymentRequest = async (paymentId) => {
        if (!window.confirm("Are you sure you want to cancel this payment request?")) return;
        
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/manual-billing/payment-request/${paymentId}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                toast.success("Payment request cancelled successfully");
                fetchBillingData();
            }
        } catch (err) {
            console.error('Error cancelling payment request:', err);
            const errorMessage = err.response?.data?.error || 'Failed to cancel payment request';
            toast.error(errorMessage);
        }
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            planId: "",
            billingPeriod: "monthly",
            paymentMethod: "bank_transfer",
            paymentProof: null
        });
        setSelectedPlanId(null); // Also reset the selected plan ID
        // Reset downgrade state as well
        setDowngradeInfo(null);
        setSelectedFormIds([]);
    };

    const formatCurrency = (amount) => {
        return `Rs ${new Intl.NumberFormat('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status, endDate = null) => {
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
                setSelectedPlanId(planId);
                setIsPaymentDialogOpen(true);
            }
        } catch (err) {
            console.error('Error checking downgrade impact:', err);
            const errorMessage = err.response?.data?.error || 'Failed to check downgrade impact';
            setDowngradeError(errorMessage);
            toast.error(errorMessage);
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
                const limit = downgradeInfo?.lockedForms ? downgradeInfo.targetPlanLimit : downgradeInfo?.newPlanLimit;
                if (limit && prev.length >= limit) {
                    toast.error(`You can only select ${limit} form(s)`);
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
            toast.info(`Auto-selected ${preSelectedIds.length} forms`);
        } else {
            // For downgrades, auto-select the most recent forms up to the limit
            const preSelectedIds = downgradeInfo.activeForms
                .slice(0, downgradeInfo.newPlanLimit)
                .map(form => form._id);
            setSelectedFormIds(preSelectedIds);
            toast.info(`Auto-selected ${preSelectedIds.length} most recent forms`);
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
                billingPeriod: "monthly",
                paymentMethod: "bank_transfer",
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
            
            // Close dialog and open payment dialog
            setIsDowngradeDialogOpen(false);
            setSelectedPlanId(downgradeInfo.targetPlanId);
            setIsPaymentDialogOpen(true);
            
            toast.success('Form selection saved successfully');
        } catch (err) {
            console.error('Error handling form selection:', err);
            const errorMessage = err.response?.data?.error || 'Failed to save form selection';
            setDowngradeError(errorMessage);
            toast.error(errorMessage);
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
                setSelectedPlanId(planId);
                setIsPaymentDialogOpen(true);
            }
        } catch (err) {
            console.error('Error checking upgrade impact:', err);
            const errorMessage = err.response?.data?.error || 'Failed to check upgrade impact';
            setDowngradeError(errorMessage);
            toast.error(errorMessage);
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
                billingPeriod: "monthly",
                paymentMethod: "bank_transfer",
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
            
            // Close dialog and open payment dialog
            setIsDowngradeDialogOpen(false);
            setSelectedPlanId(downgradeInfo.targetPlanId);
            setIsPaymentDialogOpen(true);
            
            toast.success('Form selection saved successfully');
        } catch (err) {
            console.error('Error handling form selection for upgrade:', err);
            const errorMessage = err.response?.data?.error || 'Failed to save form selection';
            setDowngradeError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmittingDowngrade(false);
        }
    };

    // Filter plans by interval
    // const monthlyPlans = availablePlans.filter(plan => plan.price_monthly > 0);
    // const yearlyPlans = availablePlans.filter(plan => plan.price_yearly > 0);
    
    // Check if user has no active subscription
    const hasNoSubscription = !subscriptionDetails || 
        !subscriptionDetails.subscription || 
        subscriptionDetails.subscription.status !== 'active';

    // Pre-select current plan when dialog opens
    useEffect(() => {
        if (isPaymentDialogOpen && !downgradeInfo) {
            // Only run this logic for regular payment requests, not downgrade scenarios
            // If a specific plan was selected, use that; otherwise use current plan
            const planIdToSelect = selectedPlanId || (subscriptionDetails?.subscription?.plan_id?._id) || "";
            console.log('Payment dialog opened. Current paymentFormData:', paymentFormData, 'planIdToSelect:', planIdToSelect, 'selectedPlanId:', selectedPlanId);
            // Only update if the planId is not already set properly to avoid overriding values set elsewhere
            if ((!paymentFormData.planId || paymentFormData.planId === "") && planIdToSelect) {
                console.log('Setting paymentFormData.planId to planIdToSelect:', planIdToSelect);
                setPaymentFormData(prev => ({
                    ...prev,
                    planId: planIdToSelect
                }));
            } else if (selectedPlanId && selectedPlanId !== "" && paymentFormData.planId !== selectedPlanId) {
                // If selectedPlanId is explicitly set and different, update to that
                console.log('Setting paymentFormData.planId to selectedPlanId:', selectedPlanId);
                setPaymentFormData(prev => ({
                    ...prev,
                    planId: selectedPlanId
                }));
            }
        } else if (isPaymentDialogOpen && downgradeInfo) {
            console.log('Payment dialog opened during downgrade process. downgradeInfo:', downgradeInfo, 'paymentFormData:', paymentFormData);
        }
    }, [isPaymentDialogOpen, subscriptionDetails, selectedPlanId, downgradeInfo, paymentFormData.planId]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <CustomerLayoutPage>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your subscription and payment history
                    </p>
                </div>

                {/* Subscription Status Banner - Shown at the top */}
                {subscriptionDetails?.subscription && (() => {
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
                })()}

                {/* Pending Payments - Moved to be visible on all tabs */}
                {pendingPayments.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Pending Payment Requests</CardTitle>
                            <CardDescription>
                                These payments are awaiting admin approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingPayments.map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between p-4 border rounded-lg border-yellow-500 dark:bg-slate-900">
                                        <div>
                                            <h4 className="font-medium">{payment.plan_name}</h4>
                                            <p className="text-sm text-gray-500">
                                                {formatCurrency(payment.amount)} ({payment.billing_period})
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Requested on {formatDate(payment.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-yellow-100 text-yellow-800" variant="default">Pending Approval</Badge>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleCancelPaymentRequest(payment._id)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                        {/* Current Subscription */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Current Subscription</CardTitle>
                                    <Button onClick={() => setActiveTab("plans")}>
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


                    </TabsContent>

                    {/* Plans Tab */}
                    <TabsContent value="plans" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Subscription Plans</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Choose a plan that fits your needs
                                </p>
                            </div>
                            
                            <Button onClick={() => {
                                setSelectedPlanId(null); // No specific plan selected
                                setIsPaymentDialogOpen(true);
                            }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Make Payment
                            </Button>
                        </div>
                        
                        {availablePlans.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {availablePlans.map((plan) => {
                                    const isCurrentPlan = subscriptionDetails?.subscription?.plan_id?._id === plan.id;
                                    const currentFormLimit = subscriptionDetails?.subscription?.plan_id?.form_limit || 0;
                                    const isDowngrade = plan.form_limit < currentFormLimit;
                                    const actionText = isCurrentPlan 
                                        ? "Current Plan" 
                                        : isDowngrade 
                                            ? "Downgrade Plan" 
                                            : "Upgrade Plan";
                                    
                                    return (
                                        <Card 
                                            key={plan.id} 
                                            className={`flex flex-col ${isCurrentPlan ? 'border-2 border-blue-500' : ''}`}
                                        >
                                            <CardHeader>
                                                <CardTitle>{plan.name}</CardTitle>
                                                <CardDescription>{plan.description}</CardDescription>
                                                {isCurrentPlan && (
                                                    <Badge className="w-fit bg-blue-500 hover:bg-blue-600">
                                                        Current Plan
                                                    </Badge>
                                                )}
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <div className="space-y-4">
                                                    <div className="text-3xl font-bold">
                                                        {formatCurrency(plan.price_monthly)}
                                                        <span className="text-lg font-normal text-gray-500">/month</span>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(plan.price_yearly)} billed yearly
                                                    </div>
                                                    
                                                    <ul className="space-y-2">
                                                        <li className="flex items-center">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                            {plan.form_limit} forms
                                                        </li>
                                                        {plan.features.map((feature, index) => (
                                                            <li key={index} className="flex items-center">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                {feature}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </CardContent>
                                            <div className="p-6 pt-0">
                                                {isCurrentPlan ? (
                                                    <Button 
                                                        className="w-full"
                                                        onClick={() => {
                                                            setSelectedPlanId(plan.id); // Set the selected plan ID
                                                            setIsPaymentDialogOpen(true);
                                                        }}
                                                    >
                                                        Pay for Next Month
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        className="w-full"
                                                        variant={isDowngrade ? "secondary" : "default"}
                                                        onClick={async () => {
                                                            // Check if this is a downgrade or upgrade
                                                            if (isDowngrade) {
                                                                // This is a downgrade, check if form selection is needed
                                                                await checkDowngradeImpact(plan.id);
                                                            } else {
                                                                // This is an upgrade, check if there are locked forms to unlock
                                                                await checkUpgradeImpact(plan.id);
                                                            }
                                                        }}
                                                        disabled={isCheckingDowngrade}
                                                    >
                                                        {isCheckingDowngrade ? 'Checking...' : actionText}
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-gray-500">No subscription plans available</p>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Payment Dialog */}
                        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
                            setIsPaymentDialogOpen(open);
                            // Reset selected plan ID when dialog closes
                            if (!open) {
                                setSelectedPlanId(null);
                            }
                        }}>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Make Payment</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {/* Add a button to restart downgrade process if needed */}
                                    {downgradeInfo && (
                                        <div className="text-center pb-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    setIsPaymentDialogOpen(false);
                                                    restartDowngradeProcess(downgradeInfo.targetPlanId);
                                                }}
                                            >
                                                Reselect Forms
                                            </Button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="plan" className="text-right">
                                            Plan
                                        </Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={paymentFormData.planId}
                                                onValueChange={(value) => setPaymentFormData({ ...paymentFormData, planId: value })}
                                                disabled={!!paymentFormData.formSelection} // Disable if form selection exists
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePlans.map((plan) => (
                                                        <SelectItem key={plan.id} value={plan.id}>
                                                            {plan.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {paymentFormData.formSelection && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Plan is fixed based on your form selection
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="billingPeriod" className="text-right">
                                            Billing
                                        </Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={paymentFormData.billingPeriod}
                                                onValueChange={(value) => setPaymentFormData({ ...paymentFormData, billingPeriod: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                    <SelectItem value="yearly">Yearly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="paymentMethod" className="text-right">
                                            Method
                                        </Label>
                                        <div className="col-span-3">
                                            <Select
                                                value={paymentFormData.paymentMethod}
                                                onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="paymentProof" className="text-right">
                                            Proof
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                id="paymentProof"
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentProof: e.target.files[0] })}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Upload payment receipt or proof of transfer
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handlePaymentRequest}>
                                            Submit Payment
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        
                        {/* Downgrade Dialog */}
                        <Dialog open={isDowngradeDialogOpen} onOpenChange={(open) => {
                            setIsDowngradeDialogOpen(open);
                            if (!open) {
                                setDowngradeInfo(null);
                                setSelectedFormIds([]);
                                setDowngradeError('');
                            }
                        }}>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                        {downgradeInfo?.isUpgrade ? 'Plan Upgrade - Unlock Forms' : 'Plan Downgrade Confirmation'}
                                    </DialogTitle>
                                </DialogHeader>
                                
                                {downgradeInfo && (
                                    <div className="space-y-6">
                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                                            <p className="text-amber-800">
                                                {downgradeInfo?.isUpgrade 
                                                    ? `You have ${downgradeInfo.totalFormCount} form(s). Please select up to ${downgradeInfo.targetPlanLimit} form(s) to use with your new ${downgradeInfo.targetPlanName} plan.`
                                                    : `Your ${downgradeInfo.currentPlan} plan allows ${downgradeInfo.currentFormCount} active form(s), 
                                                    but the new ${downgradeInfo.targetPlan} plan only allows ${downgradeInfo.newPlanLimit} active form(s). 
                                                    Please select which ${downgradeInfo.newPlanLimit} form(s) will remain active and which ${downgradeInfo.excessFormCount} will be locked.`}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">
                                                {downgradeInfo?.isUpgrade 
                                                    ? `Select forms to use (up to ${Math.min(downgradeInfo.targetPlanLimit, downgradeInfo.totalFormCount)} forms)`
                                                    : `Select ${downgradeInfo.newPlanLimit} form(s) to keep active`}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">
                                                    {selectedFormIds.length} of {downgradeInfo?.isUpgrade ? Math.min(downgradeInfo.targetPlanLimit, downgradeInfo.totalFormCount) : downgradeInfo.newPlanLimit} selected
                                                </span>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={handleAutoSelect}
                                                >
                                                    Auto-select
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                                            {(downgradeInfo?.isUpgrade ? downgradeInfo?.allForms : downgradeInfo?.activeForms)?.map((form) => {
                                                const isSelected = selectedFormIds.includes(form._id);
                                                return (
                                                    <Card 
                                                        key={form._id} 
                                                        className={`cursor-pointer transition-colors ${
                                                            isSelected 
                                                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-slate-900' 
                                                                : 'hover:bg-slate-100 dark:hover:bg-slate-900'
                                                        }`}
                                                        onClick={() => handleFormToggle(form._id)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div 
                                                                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${
                                                                            isSelected 
                                                                                ? 'bg-blue-500 border-blue-500' 
                                                                                : 'border-gray-300'
                                                                        }`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleFormToggle(form._id);
                                                                        }}
                                                                    >
                                                                        {isSelected && (
                                                                            <CheckCircle className="h-4 w-4 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                                        <div>
                                                                            <p className="font-medium">{form.form_name}</p>
                                                                            {form.form_note && (
                                                                                <p className="text-sm text-gray-600 mt-1">{form.form_note}</p>
                                                                            )}
                                                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {form.form_type}
                                                                                </Badge>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Calendar className="h-3 w-3" />
                                                                                    {formatDate(form.created_at || form.lockedAt)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    {downgradeInfo?.isUpgrade ? (
                                                                        isSelected ? (
                                                                            <div className="flex items-center gap-1 text-green-600 text-sm">
                                                                                <Unlock className="h-4 w-4" />
                                                                                <span>Will be unlocked</span>
                                                                            </div>
                                                                        ) : form.is_locked ? (
                                                                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                                                                                <Lock className="h-4 w-4" />
                                                                                <span>Currently locked</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-1 text-blue-600 text-sm">
                                                                                <CheckCircle className="h-4 w-4" />
                                                                                <span>Already unlocked</span>
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        isSelected ? (
                                                                            <div className="flex items-center gap-1 text-green-600 text-sm">
                                                                                <CheckCircle className="h-4 w-4" />
                                                                                <span>Will remain active</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-1 text-red-600 text-sm">
                                                                                <XCircle className="h-4 w-4" />
                                                                                <span>Will be locked</span>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                        
                                        {downgradeError && (
                                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                                <p className="text-red-800 text-sm">{downgradeError}</p>
                                            </div>
                                        )}
                                        
                                        {/* Show message when user hasn't selected enough forms */}
                                        {(!downgradeInfo?.isUpgrade && selectedFormIds.length < (downgradeInfo?.newPlanLimit || 0)) && (
                                            <div className="bg-blue-50 dark:bg-slate-900 border border-orange-500 rounded-md p-3">
                                                <p className="text-orange-500 text-sm">
                                                    Please select {downgradeInfo?.newPlanLimit || 0} form(s) to continue. 
                                                    Currently selected: {selectedFormIds.length}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {((downgradeInfo?.isUpgrade && selectedFormIds.length < Math.min(downgradeInfo.totalFormCount, downgradeInfo.targetPlanLimit || 0))) && (
                                            <div className="bg-blue-50 dark:bg-slate-900 border border-orange-500 rounded-md p-3">
                                                <p className="text-orange-500 text-sm">
                                                    Please select up to {Math.min(downgradeInfo.totalFormCount, downgradeInfo.targetPlanLimit || 0)} form(s) to unlock. 
                                                    Currently selected: {selectedFormIds.length}
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setIsDowngradeDialogOpen(false)}
                                                disabled={isSubmittingDowngrade}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                onClick={downgradeInfo?.isUpgrade ? handleUpgradeSubmit : handleDowngradeSubmit}
                                                disabled={isSubmittingDowngrade || 
                                                    (downgradeInfo?.isUpgrade && selectedFormIds.length < Math.min(downgradeInfo.totalFormCount, downgradeInfo.targetPlanLimit)) ||
                                                    (!downgradeInfo?.isUpgrade && selectedFormIds.length < downgradeInfo.newPlanLimit)}
                                            >
                                                {isSubmittingDowngrade ? 'Saving...' : `Confirm and Continue to Payment`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-6">
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
                    </TabsContent>
                </Tabs>
            </div>
        </CustomerLayoutPage>
    );
}

export default BillingPage;