import { Navigate, Route, Routes } from "react-router-dom";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import CustomerDashboardPage from "./pages/front/CustomerDashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/front/HomePage";
import AdminDashboardPage from "./pages/back/AdminDashboardPage";

import LoadingSpinner from "./components/LoadingSpinner";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

// protect routes that require authentication
const ProtectedRoute = ({ children, role }) => {
	const { isAuthenticated, user } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (!user.isVerified) {
		return <Navigate to="/verify-email" replace />;
	}
	// Check the user's role and redirect to the appropriate dashboard
	// Redirect users based on role if accessing the wrong dashboard
	if (role === "admin" && user.role !== "admin") {
		return <Navigate to="/dashboard" replace />;
	}
	if (role === "customer" && user.role === "admin") {
		return <Navigate to="/admin-dashboard" replace />;
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
			</Routes>

			<Routes>
				{/* Customer Dashboard */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute role="customer">
							<CustomerDashboardPage />
						</ProtectedRoute>
					}
				/>

				{/* Admin Dashboard */}
				<Route
					path="/admin-dashboard"
					element={
						<ProtectedRoute role="admin">
							<AdminDashboardPage />
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
			</Routes>
			<Toaster />
		</>
	);
}

export default App;
