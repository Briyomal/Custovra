import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    // State for billing period toggle
    const [billingPeriod, setBillingPeriod] = useState("monthly"); // monthly, half_yearly, yearly

    // State to track which plan button is being processed
    const [processingPlanId, setProcessingPlanId] = useState(null);

    // Handler for plan action (downgrade/upgrade)
    const handlePlanAction = async (planId, isDowngrade) => {
        setProcessingPlanId(planId);
        try {
            // Set billing period
            setPaymentFormData(prev => ({
                ...prev,
                billingPeriod: billingPeriod
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
            // Set billing period
            setPaymentFormData(prev => ({
                ...prev,
                billingPeriod: billingPeriod
            }));
            await handlePayForNextMonth(planId);
        } finally {
            setProcessingPlanId(null);
        }
    };

    // Get price based on selected billing period
    const getPriceForPeriod = (plan) => {
        switch (billingPeriod) {
            case "monthly":
                return plan.final_prices?.monthly || plan.price_monthly;
            case "half_yearly":
                return plan.final_prices?.half_yearly || (plan.price_monthly * 6);
            case "yearly":
                return plan.final_prices?.yearly || plan.price_yearly;
            default:
                return plan.price_monthly;
        }
    };

    // Get equivalent monthly rate for longer periods
    const getEquivalentMonthlyRate = (plan) => {
        switch (billingPeriod) {
            case "half_yearly":
                return (plan.final_prices?.half_yearly || (plan.price_monthly * 6)) / 6;
            case "yearly":
                return (plan.final_prices?.yearly || plan.price_yearly) / 12;
            default:
                return null;
        }
    };

    // Get discount percentage for current period
    const getDiscountForPeriod = (plan) => {
        if (!plan.discounts) return 0;
        return plan.discounts[billingPeriod] || 0;
    };

    // Get period label
    const getPeriodLabel = () => {
        switch (billingPeriod) {
            case "monthly":
                return "/mo";
            case "half_yearly":
                return "/6mo";
            case "yearly":
                return "/yr";
            default:
                return "/mo";
        }
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
                <button
                    className={`px-4 py-2 rounded-l-lg ${billingPeriod === "monthly" ? "bg-[#16bf4c] text-white" : "bg-gray-200 dark:bg-gray-700"}`}
                    onClick={() => setBillingPeriod("monthly")}
                >
                    Monthly
                </button>
                <button
                    className={`${billingPeriod === "half_yearly" ? "bg-[#16bf4c] text-white" : "bg-gray-200 dark:bg-gray-700"} px-4 py-2`}
                    onClick={() => setBillingPeriod("half_yearly")}
                >
                    Half-Yearly
                </button>
                <button
                    className={`px-4 py-2 rounded-r-lg ${billingPeriod === "yearly" ? "bg-[#16bf4c] text-white" : "bg-gray-200 dark:bg-gray-700"}`}
                    onClick={() => setBillingPeriod("yearly")}
                >
                    Yearly
                </button>
            </div>

            {availablePlans.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                        {availablePlans.map((plan) => {
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

                            const price = getPriceForPeriod(plan);
                            const equivalentMonthly = getEquivalentMonthlyRate(plan);
                            const discount = getDiscountForPeriod(plan);

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
                                        {discount > 0 && (
                                            <Badge className="w-fit bg-purple-500 hover:bg-purple-600">
                                                {discount}% OFF
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="space-y-4">
                                            <div className="text-3xl font-bold">
                                                {formatCurrency(price)}
                                                <span className="text-lg font-normal text-gray-500">
                                                    {getPeriodLabel()}
                                                </span>
                                            </div>
                                            {equivalentMonthly && (
                                                <div className="text-sm text-gray-500">
                                                    Equivalent to {formatCurrency(equivalentMonthly)}/month
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
                                                {plan.features && (
                                                    <>
                                                        {plan.features.image_upload && (
                                                            <li className="flex items-center">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                Image Upload
                                                            </li>
                                                        )}
                                                        {plan.features.employee_management && (
                                                            <li className="flex items-center">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                Employee Management
                                                            </li>
                                                        )}
                                                        {plan.features.custom_features && plan.features.custom_features.map((feature, index) => (
                                                            <li key={index} className="flex items-center">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                {feature}
                                                            </li>
                                                        ))}
                                                    </>
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
                                                    `Pay for Next ${billingPeriod === "monthly" ? "Month" : billingPeriod === "half_yearly" ? "6 Months" : "Year"}`
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