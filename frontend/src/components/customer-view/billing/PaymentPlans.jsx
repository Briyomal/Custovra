
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle, CardDescription, Card} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const PaymentPlans = () => {
    const [availablePlans, setAvailablePlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [billingPeriod, setBillingPeriod] = useState("monthly");
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoadingPlans(true);
                const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/polar/products`);

                // Accessing the items based on your new raw response structure
                const products = res.data?.products || [];

                const normalizedPlans = products.map((product) => ({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    prices: product.prices || [],
                    discounts: product.discounts || [], // Capture the live discountsrecurringInterval: product.recurringInterval, 
                    recurringInterval: product.recurringInterval,
                    recurringIntervalCount: product.recurringIntervalCount, // Used to distinguish monthly vs 6-month
                    formLimit: product.metadata?.formLimit || 0,
                    submissionLimit: product.metadata?.submissionLimit || 0,
                }));

                setAvailablePlans(normalizedPlans);
            } catch (error) {
                console.error("Failed to load Polar plans:", error);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchProducts();
    }, []);

    const getPriceForPeriod = (plan) => {
        const original = plan.prices?.[0]?.priceAmount || 0;
        const discountObj = plan.discounts?.[0];

        if (discountObj && discountObj.type === "percentage") {
            return Math.round(original * (1 - (discountObj.basisPoints / 10000)));
        }
        return original;
    };

    const getDiscountPercentage = (plan) => {
        const discountObj = plan.discounts?.[0];
        // Return 0 if no discount exists to avoid layout issues
        return discountObj ? discountObj.basisPoints / 100 : 0;
    };

    const getPeriodLabel = () => {
        if (billingPeriod === "monthly") return "/month";
        if (billingPeriod === "half_yearly") return "/6 months";
        if (billingPeriod === "yearly") return "/year";
        return "";
    };
    const getOriginalPriceForPeriod = (plan) => {
        return plan.prices?.[0]?.priceAmount || 0;
    };

    const getSavingsForPeriod = (plan) => {
        return getOriginalPriceForPeriod(plan) - getPriceForPeriod(plan);
    };

    const getEquivalentMonthlyRate = (plan) => {
        if (plan.recurringIntervalCount === 1) return null;
        return Math.round(getPriceForPeriod(plan) / plan.recurringIntervalCount);
    };
    const formatCurrency = (amount) => {

        return new Intl.NumberFormat("en-US", {

            style: "currency",

            currency: "USD",

        }).format(amount / 100);

    };

    const handleSubscribe = async (plan) => {
        if (!isAuthenticated) {
            navigate("/login");
            toast.error("Please login to continue");
            return;
        }
        console.log("Subscribing to plan:", plan);

        // Use the Product ID for Ad-hoc pricing, or Price ID for Catalog pricing
        // Match this to whatever your controller's "if (!...)" check is looking for
        const productId = plan.id;
        const amount = plan.prices?.[0]?.priceAmount;

        const discountId = plan.discounts?.[0]?.id;
        const formLimit = plan.formLimit || 0;
        const submissionLimit = plan.submissionLimit || 0;
        const imageUpload = plan.imageUpload || 0;
        const employeeManagement = plan.employeeManagement || 0;

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/polar/create-checkout`,
                {
                    productId: productId, // Change key name if controller expects priceId
                    amount: amount,
                    discountId: discountId,
                    formLimit: formLimit,
                    submissionLimit: submissionLimit,
                    imageUpload: imageUpload,
                    employeeManagement: employeeManagement,
                },
                { withCredentials: true } // Required to send cookies for verifyToken to work
            );

            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            toast.error("Failed to start checkout.");
            console.error("Checkout Error:", error.response?.data || error);
        }
    };

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
        className={`px-4 py-2 rounded-l-lg transition-colors ${
          billingPeriod === "monthly"
            ? "bg-[#16bf4c] text-white font-medium"
            : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        }`}
        onClick={() => setBillingPeriod("monthly")}
      >
        Monthly
      </button>

      <button
        className={`px-4 py-2 rounded-none transition-colors ${
          billingPeriod === "half_yearly"
            ? "bg-[#16bf4c] text-white font-medium"
            : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        }`}
        onClick={() => setBillingPeriod("half_yearly")}
      >
        Half-Yearly
      </button>
      <button
        className={`px-4 py-2 rounded-r-lg transition-colors ${
          billingPeriod === "yearly"
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {availablePlans
          .filter((plan) => {
            // Filter based on recurring interval from Polar
            if (billingPeriod === "monthly") return plan.recurringIntervalCount === 1 && plan.recurringInterval === "month";
            if (billingPeriod === "half_yearly") return plan.recurringIntervalCount === 6 && plan.recurringInterval === "month";
            if (billingPeriod === "yearly") return plan.recurringIntervalCount === 1 && plan.recurringInterval === "year";
            return true;
          })
          .map((plan) => {
            const price = getPriceForPeriod(plan);
            const originalPrice = getOriginalPriceForPeriod(plan);
            const discountPercent = getDiscountPercentage(plan);
            const savings = getSavingsForPeriod(plan);
            const equivalentMonthly = getEquivalentMonthlyRate(plan);
            const hasDiscount = discountPercent > 0;

            return (
              <Card key={plan.id} className="flex flex-col items-center relative text-center border-gray-200 dark:border-gray-800">
                {/* Dynamic Badge using Polar Basis Points */}
                {hasDiscount && (
                  <div className="absolute -top-5 z-10">
                    <Badge className="bg-gradient-to-r from-[#16bf4c] to-lime-500 text-themebg px-4 py-2 text-lg font-bold shadow-lg">
                      {discountPercent}% OFF
                      {savings > 0 && (
                        <span className="block text-xs font-normal ml-1">
                          Save {formatCurrency(savings)}
                        </span>
                      )}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-12">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-6">
                    <div className="font-bold">
                      {hasDiscount ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xl text-gray-500 line-through">
                            {formatCurrency(originalPrice)}
                          </span>
                          <span className="text-4xl text-lime-500">
                            {formatCurrency(price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-4xl">{formatCurrency(price)}</span>
                      )}
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
                      <li className="flex items-center text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        {plan.formLimit} {plan.formLimit === "1" ? "Form" : "Forms"}
                      </li>
                      <li className="flex items-center text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        {plan.submissionLimit} Submissions
                      </li>
                    </ul>
                  </div>
                </CardContent>

                <div className="p-6 pt-0">
<div className="p-6 pt-0">
  <Button
    className="w-full h-12 rounded-md font-bold text-white bg-gradient-to-r from-[#16bf4c] to-lime-500"
    onClick={() => handleSubscribe(plan)} // Pass the whole plan object here
  >
    Subscribe Now
  </Button>
</div>
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