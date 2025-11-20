import { useState } from "react";
import AdminLayoutPage from "./LayoutPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PaymentsPage = () => {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <AdminLayoutPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-gray-500">
            Manage subscription plans
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-gray-500">No payment management components available.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutPage>
  );
};

export default PaymentsPage;