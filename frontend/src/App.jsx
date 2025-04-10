import { Navigate, Route, Routes, useLocation  } from "react-router-dom";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import CustomerDashboardPage from "./pages/customer/index";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/front/HomePage";
import AdminDashboardPage from "./pages/admin/index";
import UsersPage from "./pages/admin/UsersPage";
import SubscriptionPage from "./pages/customer/SubscriptionPage";
import FormPage from "./pages/customer/FormPage";

import LoadingSpinner from "./components/LoadingSpinner";

//import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import NotFoundPage from "./pages/NotFoundPage";
import FormCreatePage from "./pages/customer/FormCreatePage";
import { Toaster } from "react-hot-toast";
import FormViewPage from "./pages/front/FormViewPage";
import SubmissionPage from "./pages/customer/SubmissionPage";
import SubmissionListPage from "./pages/customer/SubmissionListPage";
import ReportPage from "./pages/customer/ReportPage";
import ProfilePage from "./pages/customer/ProfilePage";

const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation(); // Get the current location

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user.isVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    // Redirect users based on role if accessing the wrong dashboard
    if (role === "admin" && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }
    if (role === "customer" && user.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

	 // Define routes to ignore for is_active check
	 const skipIsActiveCheckRoutes = ["/subscription", "/profile"];

    // Skip is_active check for the /subscription page to prevent redirect loops
    if (user?.is_active === false && !skipIsActiveCheckRoutes.includes(location.pathname)) {
        return <Navigate to="/subscription" replace />;
    }

    return children;
};

// redirect authenticated users to the Dashboard
const RedirectAuthenticatedUser = ({ children }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (isAuthenticated && user.isVerified) {
		return <Navigate to="/dashboard" replace />;
	}

	return children;
};

function App() {
	const { isCheckingAuth, checkAuth } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	if (isCheckingAuth) return <LoadingSpinner />;

	return (
		<>
			<Routes>
				<Route path="/" element={<HomePage />} />
				{/* Customer Dashboard */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute role="customer">
							<CustomerDashboardPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/subscription"
					element={
						<ProtectedRoute role="customer">
							<SubscriptionPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/forms"
					element={
						<ProtectedRoute role="customer">
							<FormPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/submissions"
					element={
						<ProtectedRoute role="customer">
							<SubmissionPage  />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/submissions/:formId"
					element={
						<ProtectedRoute role="customer">
							<SubmissionListPage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/reports"
					element={
						<ProtectedRoute role="customer">
							<ReportPage  />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/forms/create-form/:formId"
					element={
						<ProtectedRoute role="customer">
							<FormCreatePage />
						</ProtectedRoute>
					}
				/>
				
				<Route
					path="/profile"
					element={
						<ProtectedRoute role="customer">
							<ProfilePage />
						</ProtectedRoute>
					}
				/>
				
				{/* Customer Dashboard End */}
				<Route
					path="/admin"
					element={
						<ProtectedRoute role="admin">
							<AdminDashboardPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/admin/users"
					element={
						<ProtectedRoute role="admin">
							<UsersPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/admin/profile"
					element={
						<ProtectedRoute role="admin">
							<ProfilePage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/signup"
					element={
						<RedirectAuthenticatedUser>
							<SignUpPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route
					path="/login"
					element={
						<RedirectAuthenticatedUser>
							<LoginPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route path="/verify-email" element={<EmailVerificationPage />} />
				<Route
					path="/forgot-password"
					element={
						<RedirectAuthenticatedUser>
							<ForgotPasswordPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route
					path="/reset-password/:token"
					element={
						<RedirectAuthenticatedUser>
							<ResetPasswordPage />
						</RedirectAuthenticatedUser>
					}
				/>
				<Route
					path="/forms/view/:formId"
					element={<FormViewPage />}
				/>
				<Route
				    path="*"
                    element={<NotFoundPage />}
				/>
			</Routes>
			<Toaster
			  position="top-right"
			  reverseOrder={false}
			  toastOptions={{
				className: '',
				style: {
                    borderRadius: "10px",
                    background: "#222",
                    color: "#fff",
                    padding: "10px",
                    textAlign: "center",
                    marginBottom: "10px",
				},
			  }}
			/>
		</>
	);
}

export default App;
