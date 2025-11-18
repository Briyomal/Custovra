
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../components/Input";
import { Lock } from "lucide-react";
//import toast from "react-hot-toast";
import FloatingBackground from "../components/FloatingBackground";
import toast from "react-hot-toast";
import logo from "../assets/Logo.png";
import logoWhite from "../assets/logo-white.png";
import { useTheme } from "@/components/theme-provider";

const ResetPasswordPage = () => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const { resetPassword, error, isLoading, message } = useAuthStore();

	const { token } = useParams();
	const navigate = useNavigate();
	const { theme } = useTheme();


	const handleSubmit = async (e) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}
		try {
			await resetPassword(token, password);

			toast.success("Password reset successfully, redirecting to login page...");


			setTimeout(() => {
				navigate("/login");
			}, 2000);
		} catch (error) {
			console.error(error);
			toast.error(error.message || "Error resetting password");
		}
	};

	return (
		<FloatingBackground>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className='m-4 md:m-0 max-w-md w-full bg-gray-50 bg-opacity-20 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
			>
				<div className='p-8'>
					<a href="/" className="flex items-center justify-center mb-4">
						<img src={theme === "dark" ? logoWhite : logo} className="h-10 mr-3" alt="Custovra" />
					</a>	
					<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#16bf4c] to-lime-500 text-transparent bg-clip-text
					dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#16bf4c] dark:to-lime-500'>
						Reset Password
					</h2>
					{error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
					{message && <p className='text-green-500 text-sm mb-4'>{message}</p>}

					<form onSubmit={handleSubmit}>
						<Input
							icon={Lock}
							type='password'
							placeholder='New Password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>

						<Input
							icon={Lock}
							type='password'
							placeholder='Confirm New Password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
						/>

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='w-full py-3 px-4 rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400'
							type='submit'
							disabled={isLoading}
						>
							{isLoading ? "Resetting..." : "Set New Password"}
						</motion.button>
					</form>
				</div>
			</motion.div>
		</FloatingBackground>
	);
};
export default ResetPasswordPage;
