import CustomerLayoutPage from "../customer/LayoutPage";
import { useAuthStore } from "@/store/authStore";

const CustomerDashboardPage = () => {
    // Retrieve user data from useProfileStore
	const { user } = useAuthStore();

    return (
        <CustomerLayoutPage>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Welcome back, <span className="text-slate-800 dark:text-slate-200">
					{user.name}
                    </span>
                </h2>
				<p>Here&apos;s a quick overview of your dashboard. Let&apos;s make today productive!</p>
            </div>
        </CustomerLayoutPage>
    );
};

export default CustomerDashboardPage;
