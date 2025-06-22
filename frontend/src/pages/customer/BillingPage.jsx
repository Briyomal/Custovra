import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore"; // Adjust path if necessary
import axios from "axios"; // Make sure axios is installed: npm install axios or yarn add axios
import { Button } from "@/components/ui/button";
import CustomerLayoutPage from "./LayoutPage";
import LoadingSpinner from "@/components/LoadingSpinner";

function BillingPage() {
    const [customerPortalUrl, setCustomerPortalUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get authentication state from your store
    const { isAuthenticated } = useAuthStore(); 

    useEffect(() => {
        const fetchPortalUrl = async () => {
            // Only attempt to fetch if the user is authenticated
            if (!isAuthenticated) {
                setLoading(false);
                setError("User is not authenticated. Please log in.");
                return;
            }

            try {
                // Axios automatically sends cookies by default if the request is to the same origin,
                // or if 'withCredentials: true' is set for cross-origin requests.
                // Assuming your backend is on the same origin or CORS is configured with credentials.
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/billing/create-customer-portal-session`,
                    {}, // Empty body, as your backend doesn't expect data in the body for this endpoint
                    {
                        withCredentials: true // IMPORTANT for sending HTTP-only cookies cross-origin
                    }
                );

                // With Axios, if response.status is not 2xx, it will throw an error automatically,
                // so the if (!response.ok) check is not needed here.
                // The parsed JSON data is directly in response.data
                const data = response.data; 
                setCustomerPortalUrl(data.url);

            } catch (err) {
                console.error("Error fetching customer portal URL:", err); 
                // Axios errors often have a 'response' property with more details
                if (axios.isAxiosError(err) && err.response) {
                    setError(err.response.data.message || `Error: ${err.response.status} ${err.response.statusText}`);
                } else {
                    setError(err.message || "An unexpected error occurred.");
                }
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if isAuthenticated is true.
        if (isAuthenticated) {
            fetchPortalUrl();
        } else {
            setLoading(false); // If not authenticated, stop loading right away
        }
    }, [isAuthenticated]); // Dependency on isAuthenticated

    if (loading) {
		return <LoadingSpinner />;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <CustomerLayoutPage>

        <div className="pt-4 md:p-4">
        <h1 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
            Billing Information
        </h1>
            {isAuthenticated ? ( // Conditionally render the link if authenticated
                customerPortalUrl ? (
                    <Button asChild>
  <a
    href={customerPortalUrl}
    target="_blank"
    rel="noopener noreferrer"
    className={(
      "w-full sm:w-fit mt-4 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800 px-4 py-2 rounded text-center"
    )}
  >
    Manage Your Subscription
  </a>
  </Button>
                ) : (
                    <p>No customer portal link available. Please contact support.</p>
                )
            ) : (
                <p>Please log in to manage your subscription.</p>
            )}
        </div>
        </CustomerLayoutPage>
    );
}

export default BillingPage;