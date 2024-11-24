import CustomerLayoutPage from "../customer/LayoutPage"
import { Home, Settings, Users } from "lucide-react";
import { useEffect } from "react";

const customerMenuItems = [
  { title: 'Home', url: '/customer/home', icon: Home },
  { title: 'Orders', url: '/customer/orders', icon: Users },
  { title: 'Profile', url: '/customer/profile', icon: Settings },
];
const CustomerDashboardPage = () => {
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (sessionId) {
        console.log(`Payment successful. Session ID: ${sessionId}`);
        // You can now fetch details from Stripe or your own backend
    }
}, []);

  return (
    <CustomerLayoutPage sidebarMenuItems={customerMenuItems}>
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  </CustomerLayoutPage>
  )
}

export default CustomerDashboardPage
