import CustomerLayoutPage from "../customer/LayoutPage"
import { Home, Loader, Settings, Users } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";


const customerMenuItems = [
  { title: 'Home', url: '/customer/home', icon: Home },
  { title: 'Orders', url: '/customer/orders', icon: Users },
  { title: 'Profile', url: '/customer/profile', icon: Settings },
];
const SubscriptionPage = () => {

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPlanId, setLoadingPlanId] = useState(null);

    useEffect(() => {
        async function fetchPlans() {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/subscriptions/`);
                setPlans(response.data);
            } catch (error) {
                console.error("Error fetching subscription plans:", error);
            }finally {
              setLoading(false); // Ensure loading is set to false after fetch
          }
        }
        fetchPlans();
    }, []);
 
        // Handle subscription button click
        const handleSubscribe = async (priceId, planName) => {
            try {
              setLoadingPlanId(priceId);
                // Send request to the backend to create a Stripe Checkout session
                const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/subscriptions/checkout-session`, { priceId, planName });
                // Redirect the user to the Stripe Checkout page
                window.location.href = response.data.url;
            } catch (error) {
                console.error("Error creating checkout session:", error);
            }finally {
              setLoadingPlanId(null); // Reset loading state after action completes
          }
        };

  return (
    <CustomerLayoutPage sidebarMenuItems={customerMenuItems}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1>Choose Your Subscription Plan</h1>
        {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader className="h-10 w-10 animate-spin" /> {/* Replace with your loader component */}
                    </div>
                ) : (
        <div className="mt-4 grid auto-rows-min gap-4 md:grid-cols-3">
          {Array.isArray(plans) && plans.map((plan) => (
            <Card key={plan.id} className="text-center rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
                <CardHeader>
                  <CardTitle>{plan.product.name}</CardTitle>
                  <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{(plan.unit_amount / 100).toFixed(2)} {plan.currency.toUpperCase()} / {plan.interval}</p>
                </CardContent>
                <CardFooter>
                  <Button
                      onClick={() => handleSubscribe(plan.id, plan.product.name)}
                      className="w-full inline-block rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200"
                      disabled={loadingPlanId === plan.id} // Disable only the clicked button
                  >
                      {loadingPlanId === plan.id ? (
                          <Loader className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                          "Subscribe Now"
                      )}
                  </Button>
                </CardFooter>
            </Card>
          ))}
        </div>

        )}
      </div>
    </CustomerLayoutPage>
  )
}

export default SubscriptionPage
