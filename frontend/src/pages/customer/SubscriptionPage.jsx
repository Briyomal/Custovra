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

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";


import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";


const customerMenuItems = [
  { title: 'Home', url: '/customer/home', icon: Home },
  { title: 'Orders', url: '/customer/orders', icon: Users },
  { title: 'Profile', url: '/customer/profile', icon: Settings },
];
const SubscriptionPage = () => {

  //const [plans, setPlans] = useState([]);
  const [monthlyPlans, setMonthlyPlans] = useState([]);
const [yearlyPlans, setYearlyPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingPlanId, setLoadingPlanId] = useState(null);

useEffect(() => {
  async function fetchPlans() {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/subscriptions/`);
      const allPlans = response.data;

      const monthly = allPlans.filter(plan => plan.interval === "month");
      const yearly = allPlans.filter(plan => plan.interval === "year");

      setMonthlyPlans(monthly);
      setYearlyPlans(yearly);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
    } finally {
      setLoading(false);
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
    } finally {
      setLoadingPlanId(null); // Reset loading state after action completes
    }
  };

  return (
      <CustomerLayoutPage sidebarMenuItems={customerMenuItems}>
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h1 className="text-2xl font-bold">Choose Your Subscription Plan</h1>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="yearly" className="w-full pt-2">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto rounded-lg bg-gray-100 dark:bg-slate-800">
            <TabsTrigger className="text-md py-2 rounded-lg" value="monthly">Pay monthly</TabsTrigger>
            <TabsTrigger className="text-md py-2 rounded-lg" value="yearly">Pay yearly (Save 16.67%)*</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              {monthlyPlans.map(plan => (
                <Card key={plan.id} className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md">
                  <CardHeader className="text-center">
                    <CardTitle>{plan.product.name}</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="mt-4 text-3xl font-bold text-blue-500">
                      {plan.currency.toUpperCase()} {(plan.unit_amount / 100).toFixed(2)}
                      <span className="text-base font-medium text-gray-400">/month</span>
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button
                      onClick={() => handleSubscribe(plan.id, plan.product.name)}
                      disabled={loadingPlanId === plan.id}
                      className="inline-block w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200"
                    >
                      {loadingPlanId === plan.id ? (
                        <Loader className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                        "Choose Plan"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yearly">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              {yearlyPlans.map(plan => (
                <Card key={plan.id} className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md">
                  <CardHeader className="text-center">
                    <CardTitle>{plan.product.name}</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="mt-4 text-3xl font-bold text-blue-500">
                      {plan.currency.toUpperCase()} {(plan.unit_amount / 100).toFixed(2)}
                      <span className="text-base font-medium text-gray-400">/year</span>
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button
                      onClick={() => handleSubscribe(plan.id, plan.product.name)}
                      disabled={loadingPlanId === plan.id}
                      className="inline-block w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200"
                    >
                      {loadingPlanId === plan.id ? (
                        <Loader className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                        "Choose Plan"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  </CustomerLayoutPage>
  )
}

export default SubscriptionPage
