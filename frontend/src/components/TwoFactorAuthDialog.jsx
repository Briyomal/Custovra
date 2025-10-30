import { useState } from "react";
import { motion } from "framer-motion";
import { Loader, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Input from "./Input";
import { useAuthStore } from "../store/authStore";
import axios from "axios";

const TwoFactorAuthDialog = ({ isOpen, onClose, userId }) => {
	const [token, setToken] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const { login, checkAuth } = useAuthStore();

	const API_URL = import.meta.env.MODE === "development" ? 
		`${import.meta.env.VITE_SERVER_URL}/api/auth` : 
		`${import.meta.env.VITE_SERVER_URL}/api/auth`;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		if (!token) {
			setError("Please enter your 2FA code");
			setIsLoading(false);
			return;
		}

		try {
			// Call the 2FA verification endpoint
			const response = await axios.post(`${API_URL}/verify-2fa`, { userId, token });
			
			if (response.data.success) {
				// After successful 2FA verification, we need to update the auth state
				// Call checkAuth to refresh the user data and set isAuthenticated to true
				await checkAuth();
				onClose();
			} else {
				setError(response.data.message || "Invalid 2FA code");
			}
		} catch (err) {
			setError(err.response?.data?.message || "Error verifying 2FA code");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mb-4">
						<Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
					</div>
					<DialogTitle className="text-center">Two-Factor Authentication</DialogTitle>
					<DialogDescription className="text-center">
						Enter the 6-digit code from your authenticator app
					</DialogDescription>
				</DialogHeader>
				
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						icon={Shield}
						type="text"
						placeholder="Enter 6-digit code"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						maxLength={6}
					/>
					
					{error && (
						<div className="text-red-500 text-sm text-center py-2">
							{error}
						</div>
					)}
					
					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-200 transition duration-200"
						type="submit"
						disabled={isLoading}
					>
						{isLoading ? (
							<div className="flex items-center justify-center">
								<Loader className="w-5 h-5 animate-spin mr-2" />
								Verifying...
							</div>
						) : (
							"Verify"
						)}
					</motion.button>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default TwoFactorAuthDialog;