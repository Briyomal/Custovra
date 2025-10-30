import AdminLayoutPage from "../admin/LayoutPage";
import AdminDashboard from "@/components/admin-view/dashboard";

function AdminDashboardPage() {
    return (
		<AdminLayoutPage>
      		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<div className="flex items-center space-x-2">
						{/* We can add date range filters here if needed */}
					</div>
				</div>
				<AdminDashboard />
      		</div>
		</AdminLayoutPage>
    );
}

export default AdminDashboardPage;