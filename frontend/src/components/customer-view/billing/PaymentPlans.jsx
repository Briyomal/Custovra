

import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription, Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

const PaymentPlans = () => {
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  //const [existingSubscription, setExistingSubscription] = useState(null);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingPlans(true);
        const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/products`);

        // Accessing the items based on your new raw response structure
        const products = res.data?.products || [];

        // Filter out archived products - only show active plans
        const activeProducts = products.filter((product) => !product.isArchived && !product.is_archived);

        const normalizedPlans = activeProducts.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          prices: product.prices || [],
          recurringInterval: product.recurringInterval,
          recurringIntervalCount: product.recurringIntervalCount, // Used to distinguish monthly vs 6-month
          benefits: product.benefits || [], // Use Polar benefits instead of metadata
        }));

        setAvailablePlans(normalizedPlans);
      } catch (error) {
        console.error("Failed to load Polar plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    
    /*
    // Fetch existing subscription if authenticated
    const fetchExistingSubscription = async () => {
      if (isAuthenticated) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/subscriptions`, {
            withCredentials: true
          });
          
          if (res.data.subscriptions && res.data.subscriptions.length > 0) {
            // Get the most recent active subscription
            const activeSubscription = res.data.subscriptions.find(sub => sub.status === 'active');
            if (activeSubscription) {
              setExistingSubscription(activeSubscription);
            } else {
              // If no active subscription, just set the first one if it exists
              setExistingSubscription(res.data.subscriptions[0]);
            }
          }
        } catch (error) {
          console.error("Failed to load existing subscription:", error);
          // Don't set existingSubscription if there's an error
        }
      }
    };
    */ 
    fetchProducts();
    //fetchExistingSubscription();
  }, [isAuthenticated]);

  const getPriceForPeriod = (plan) => {
    return plan.prices?.[0]?.priceAmount || 0;
  };

  const getPeriodLabel = () => {
    if (billingPeriod === "monthly") return "/month";
    if (billingPeriod === "half_yearly") return "/6 months";
    if (billingPeriod === "yearly") return "/year";
    return "";
  };

  const getEquivalentMonthlyRate = (plan) => {
    if (plan.recurringIntervalCount === 1) return null;
    return Math.round(getPriceForPeriod(plan) / plan.recurringIntervalCount);
  };
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};


  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to continue");
      return;
    }

    if (!user || !user.email || !user._id) {
      toast.error("User information not found. Please try logging in again.");
      return;
    }

    console.log("Subscribing to plan:", plan);
    setSubscribingPlanId(plan.id);

    try {
      // Call the catalog checkout endpoint with just the product ID
      // The backend will create a checkout session with external_customer_id to lock the email
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/polar/create-catalog-checkout`,
        {
          productId: plan.id,
        },
        { withCredentials: true }
      );

      if (response.data.url) {
        if (response.data.isPortalRedirect) {
          toast.success("Redirecting to billing portal to manage your plan...");
        } else {
          toast.success("Redirecting to secure checkout...");
        }
        window.location.href = response.data.url;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to start checkout.";
      const errorDetail = error.response?.data?.details ? JSON.stringify(error.response.data.details) : "";
      toast.error(`${errorMsg} ${errorDetail}`.slice(0, 100));
      console.error("Checkout Error:", error.response?.data || error);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  /*
  const handleSubscriptionChange = async (plan) => {
    if (!isAuthenticated) {
      navigate("/login");
      toast.error("Please login to continue");
      return;
    }
    
    console.log("Changing subscription to plan:", plan);

    try {
      // Redirect to customer portal for subscription changes
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/polar/billing-portal`,
        { withCredentials: true }
      );

      if (response.data.url) {
        toast.success("Redirecting to billing portal to manage your plan...");
        window.location.href = response.data.url;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to access billing portal.";
      toast.error(errorMsg);
      console.error("Subscription change error:", error.response?.data || error);
    }
  };
*/
/*
const handleSubscriptionChange = async (plan) => {
  if (!isAuthenticated) {
    navigate("/login");
    toast.error("Please login to continue");
    return;
  }

  try {
    setLoadingPlans(true);

    const response = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/api/polar/change-subscription`,
      {
        productId: plan.id,
        prorationBehavior: "invoice", // or "prorate"
      },
      { withCredentials: true }
    );

    toast.success("Subscription change initiated. Updating your plan...");
        window.location.href = response.data.url;
  } catch (error) {
    const msg =
      error.response?.data?.message || "Failed to change subscription";
    toast.error(msg);
    console.error(error);
  } finally {
    setLoadingPlans(false);
  }
};
*/
  return (
    <div className="max-w-6xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">
        Pricing
      </h2>

      <p className="mt-4 text-md md:text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
        Flexible pricing plans designed to scale with your business.
      </p>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-2 p-4 rounded-lg mt-8">
        <button
          className={`px-4 py-2 rounded-l-lg transition-colors ${billingPeriod === "monthly"
            ? "bg-[#16bf4c] text-white font-medium"
            : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          onClick={() => setBillingPeriod("monthly")}
        >
          Monthly
        </button>

        <button
          className={`px-4 py-2 rounded-none transition-colors ${billingPeriod === "half_yearly"
            ? "bg-[#16bf4c] text-white font-medium"
            : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          onClick={() => setBillingPeriod("half_yearly")}
        >
          Half-Yearly
        </button>
        <button
          className={`px-4 py-2 rounded-r-lg transition-colors ${billingPeriod === "yearly"
            ? "bg-[#16bf4c] text-white font-medium"
            : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          onClick={() => setBillingPeriod("yearly")}
        >
          Yearly
        </button>
      </div>

      {/* Plans Grid */}
      {loadingPlans ? (
        <div className="mt-12">
          <p className="text-themebglight dark:text-white">Loading plans...</p>
        </div>
      ) : availablePlans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-12">
          {availablePlans
            .filter((plan) => {
              // Filter based on recurring interval from Polar
              if (billingPeriod === "monthly") return plan.recurringIntervalCount === 1 && plan.recurringInterval === "month";
              if (billingPeriod === "half_yearly") return plan.recurringIntervalCount === 6 && plan.recurringInterval === "month";
              if (billingPeriod === "yearly") return plan.recurringIntervalCount === 1 && plan.recurringInterval === "year";
              return true;
            })
  .sort((a, b) => {
    const priceA = getPriceForPeriod(a);
    const priceB = getPriceForPeriod(b);
    return priceA - priceB; // 🔽 DESCENDING
  })
            .map((plan) => {
              const price = getPriceForPeriod(plan);
              const equivalentMonthly = getEquivalentMonthlyRate(plan);

              return (
                <Card key={plan.id} className="flex flex-col items-center relative text-center border-gray-200 dark:border-gray-800">

                  <CardHeader className="pt-12">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="min-h-[40px]">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-6">
                      <div className="font-bold">
                        <span className="text-4xl">{formatCurrency(price)}</span>
                        <span className="text-lg font-normal text-gray-500 ml-1">
                          {getPeriodLabel()}
                        </span>
                      </div>

                      {equivalentMonthly && (
                        <div className="text-sm py-1 px-3 bg-gray-100 dark:bg-gray-900 rounded-full inline-block text-gray-500">
                          Equivalent to {formatCurrency(equivalentMonthly)}/month
                        </div>
                      )}

                      <ul className="space-y-3 text-left">
                        {plan.benefits && plan.benefits.length > 0 ? (
                          plan.benefits.map((benefit, index) => (
                            <li key={benefit.id || index} className="flex items-center text-gray-600 dark:text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {benefit.description || benefit.name || benefit}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400 text-sm">No features listed</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>

                  <div className="p-6 pt-0 w-full">
                    {/*
                    {availablePlans.length > 0 && existingSubscription ? (
                      <Button
                        className="w-full rounded-md font-semibold text-black border
                                                    border-lime-500
                                                      bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                      transition-all duration-700 ease-in-out 
                                                      hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
                                                      focus:outline-none focus:ring-2 focus:ring-lime-400"
                        onClick={() => handleSubscriptionChange(plan)}
                      >
                        {plan.prices?.[0]?.priceAmount > existingSubscription.amount 
                          ? "Upgrade Plan" 
                          : "Downgrade Plan"}
                      </Button>
                    ) : (
                      */}
                      <Button
                        className="w-full rounded-md font-semibold text-black border
                                                    border-lime-500
                                                      bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                      transition-all duration-700 ease-in-out
                                                      hover:shadow-[0_0_15px_rgba(22,191,76,0.4)]
                                                      focus:outline-none focus:ring-2 focus:ring-lime-400
                                                      disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSubscribe(plan)}
                        disabled={subscribingPlanId !== null}
                      >
                        {subscribingPlanId === plan.id ? "Redirecting..." : "Subscribe Now"}
                      </Button>
                    {/* ) */}
                  </div>
                </Card>
              );
            })}
        </div>
      ) : (
        <div className="mt-12 text-gray-500">
          No subscription plans available at the moment.
        </div>
      )}
    </div>
  )
}
export default PaymentPlans