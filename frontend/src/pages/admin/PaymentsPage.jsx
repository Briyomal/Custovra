import { useState } from "react";
import AdminLayoutPage from "./LayoutPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManualPaymentsTable from "@/components/admin-view/payments/ManualPaymentsTable";
import ManualPlansTable from "@/components/admin-view/payments/ManualPlansTable";
import ManualSubscriptionsTable from "@/components/admin-view/payments/ManualSubscriptionsTable";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("payments");

  return (
    <AdminLayoutPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-gray-500">
            Manage manual payments, subscription plans, and user subscriptions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Payment Requests</TabsTrigger>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="space-y-4">
            <ManualPaymentsTable />
          </TabsContent>
          
          <TabsContent value="plans" className="space-y-4">
            <ManualPlansTable />
          </TabsContent>
          
          <TabsContent value="subscriptions" className="space-y-4">
            <ManualSubscriptionsTable />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutPage>
  );
};

export default PaymentsPage;