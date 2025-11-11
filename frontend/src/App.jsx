import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import CustomerDashboardPage from "./pages/customer/index";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/front/HomePage";
import TermsAndConditionsPage from "./pages/front/TermsAndConditionsPage";
import PrivacyPolicyPage from "./pages/front/PrivacyPolicyPage";
import AdminDashboardPage from "./pages/admin/index";
import UsersPage from "./pages/admin/UsersPage";
import FormsPage from "./pages/admin/FormsPage";
import SubmissionsPage from "./pages/admin/SubmissionsPage";
import AdminReportPage from "./pages/admin/Reportpage";

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
import CustomerProfilePage from "./pages/customer/ProfilePage";
import AdminProfilePage from "./pages/admin/ProfilePage";
import BillingPage from "./pages/customer/BillingPage";
import EmployeePage from "./pages/customer/EmployeePage";
import SupportPage from "./pages/customer/SupportPage";
import AdminSupportPage from "./pages/admin/SupportPage";
import PaymentsPage from "./pages/admin/PaymentsPage";

const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

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
    const skipIsActiveCheckRoutes = ["/billing", "/profile"];

    // Redirect users without active subscription to billing page to choose a plan
    // This relies on the cron job that updates user.is_active daily
    if (user?.is_active === false && !skipIsActiveCheckRoutes.includes(location.pathname)) {
        return <Navigate to="/billing" replace />;
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
                <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                
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
                    element={<Navigate to="/billing" replace />}
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
                            <SubmissionPage />
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
                            <ReportPage />
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
                            <CustomerProfilePage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/billing"
                    element={
                        <ProtectedRoute role="customer">
                            <BillingPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute role="customer">
                            <EmployeePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/support"
                    element={
                        <ProtectedRoute role="customer">
                            <SupportPage />
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
                    path="/admin/forms"
                    element={
                        <ProtectedRoute role="admin">
                            <FormsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/submissions/:formId"
                    element={
                        <ProtectedRoute role="admin">
                            <SubmissionsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/reports"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminReportPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/profile"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/support"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminSupportPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/payments"
                    element={
                        <ProtectedRoute role="admin">
                            <PaymentsPage />
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