import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const SubscriptionPlans = ({
    subscriptionDetails,
    availablePlans,
    setPaymentFormData,
    handlePayForNextMonth,
    checkDowngradeImpact,
    checkUpgradeImpact,
    isCheckingDowngrade,
    formatCurrency
}) => {
    // Filter plans by interval - for manual plans, show all plans since they have both monthly and yearly prices
    const monthlyPlans = availablePlans;
    const yearlyPlans = availablePlans;

    // State for billing period toggle
    const [isYearlyBilling, setIsYearlyBilling] = useState(false);

    // State to track which plan button is being processed
    const [processingPlanId, setProcessingPlanId] = useState(null);

    // Handler for plan action (downgrade/upgrade)
    const handlePlanAction = async (planId, isDowngrade) => {
        setProcessingPlanId(planId);
        try {
            // Set billing period based on toggle
            setPaymentFormData(prev => ({
                ...prev,
                billingPeriod: isYearlyBilling ? "yearly" : "monthly"
            }));

            // Check if this is a downgrade or upgrade
            if (isDowngrade) {
                // This is a downgrade, check if form selection is needed
                await checkDowngradeImpact(planId);
            } else {
                // This is an upgrade, check if there are locked forms to unlock
                await checkUpgradeImpact(planId);
            }
        } finally {
            // We don't reset processingPlanId here because the downgrade/upgrade flow
            // might open a dialog, and we want to keep the button disabled until
            // the user completes or cancels that flow
        }
    };

    // Handler for pay for next (based on billing period)
    const handlePayForNextClick = async (planId) => {
        setProcessingPlanId(planId);
        try {
            // Set billing period based on toggle
            setPaymentFormData(prev => ({
                ...prev,
                billingPeriod: isYearlyBilling ? "yearly" : "monthly"
            }));
            await handlePayForNextMonth(planId);
        } finally {
            setProcessingPlanId(null);
        }
    };

    // Get plans based on billing period
    const plans = isYearlyBilling ? yearlyPlans : monthlyPlans;

    // Toggle billing period
    const toggleBillingPeriod = () => {
        setIsYearlyBilling(!isYearlyBilling);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Subscription Plans</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Choose a plan that fits your needs
                    </p>
                </div>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center space-x-2 p-4 rounded-lg">
                <span className={isYearlyBilling ? "text-white" : "font-medium text-[#16bf4c]"}>
                    Billing Monthly
                </span>

                <Switch
                    checked={isYearlyBilling}
                    onCheckedChange={toggleBillingPeriod}
                    className={`
    ${isYearlyBilling
                            ? "data-[state=checked]:bg-lime-500 data-[state=unchecked]:bg-gray-600"
                            : "data-[state=checked]:bg-[#16bf4c] data-[state=unchecked]:bg-[#16bf4c]"
                        }
  `}
                />


                <span className={isYearlyBilling ? "font-medium text-lime-500" : "text-white"}>
                    Billing Annually
                </span>
            </div>

            {availablePlans.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                        {plans.map((plan) => {
                            // For manual plans, we compare plan names since we don't have plan_id
                            const isCurrentPlan = subscriptionDetails?.subscription?.plan_name === plan.name;
                            const currentFormLimit = subscriptionDetails?.plan?.formLimit || 0;
                            const isDowngrade = plan.form_limit < currentFormLimit;
                            const actionText = isCurrentPlan
                                ? "Current Plan"
                                : isDowngrade
                                    ? "Downgrade Plan"
                                    : "Upgrade Plan";

                            const isProcessing = processingPlanId === plan.id;
                            // Disable all buttons when any plan is being processed
                            const isAnyProcessing = processingPlanId !== null || isCheckingDowngrade;

                            return (
                                <Card
                                    key={plan.id}
                                    className={`flex flex-col ${isCurrentPlan ? 'border-2 border-[#16bf4c] bg-[16bf4c]' : ''}`}
                                >
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                        {isCurrentPlan && (
                                            <Badge className="w-fit bg-[#16bf4c] hover:bg-lime-500">
                                                Current Plan
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="space-y-4">
                                            <div className="text-3xl font-bold">
                                                {isYearlyBilling ? formatCurrency(plan.price_yearly) : formatCurrency(plan.price_monthly)}
                                                <span className="text-lg font-normal text-gray-500">
                                                    {isYearlyBilling ? "/yr" : "/mo"}
                                                </span>
                                            </div>
                                            {isYearlyBilling && (
                                                <div className="text-sm text-gray-500">
                                                    Equivalent to {formatCurrency(plan.price_yearly / 12)}/month
                                                </div>
                                            )}

                                            <ul className="space-y-2">
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    {plan.form_limit} forms
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                    {plan.submission_limit} submissions/month
                                                </li>
                                                {plan.features && plan.features.length > 0 ? (
                                                    plan.features.map((feature, index) => (
                                                        <li key={index} className="flex items-center">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                            {feature}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="flex items-center">
                                                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                        Basic features
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </CardContent>
                                    <div className="p-6 pt-0">
                                        {isCurrentPlan ? (
                                            <Button
                                                className="w-full rounded-md font-semibold text-black border
                                                  border-lime-500
                                                    bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                    transition-all duration-700 ease-in-out 
                                                    hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
                                                    focus:outline-none focus:ring-2 focus:ring-lime-400"
                                                onClick={() => handlePayForNextClick(plan.id)}
                                                disabled={isAnyProcessing}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    isYearlyBilling ? "Pay for Next Year" : "Pay for Next Month"
                                                )}
                                            </Button>
                                        ) : (
                                            <Button
                                                className={`w-full
                                                    rounded-md
                                                    font-semibold
                                                    text-black
                                                    border
                                                    ${isDowngrade ? 'border-lime-700 bg-gradient-to-r from-[#1f6334] to-lime-700 hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] focus:ring-lime-700'
                                                : 'border-lime-500 bg-gradient-to-r from-[#16bf4c] to-lime-500 hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] focus:ring-lime-400'}
                                                    transition-all
                                                    duration-700
                                                    ease-in-out
                                                    focus:outline-none
                                                    `}
                                                onClick={() => handlePlanAction(plan.id, isDowngrade)}
                                                disabled={isAnyProcessing}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    actionText
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-gray-500">No subscription plans available</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SubscriptionPlans;