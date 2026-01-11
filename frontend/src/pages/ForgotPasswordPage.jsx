import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import Input from "../components/Input";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingBackground from "../components/FloatingBackground";
import logo from "../assets/Logo.png";
import logoWhite from "../assets/logo-white.png";
import { useTheme } from "@/components/theme-provider";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

	const { isLoading, forgotPassword } = useAuthStore();
	const { theme } = useTheme();

	const handleSubmit = async (e) => {
		e.preventDefault();
		await forgotPassword(email);
		setIsSubmitted(true);
	};

	return (
		<FloatingBackground>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className='m-4 md:m-0 max-w-md w-full border bg-white bg-opacity-60 backdrop-filter backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden
				dark:bg-[#0D0D0D] dark:bg-opacity-40 dark:backdrop-filter dark:backdrop-blur-xl'
			>
				<div className='px-4 py-8 md:p-8'>
					
					<a href="/" className="flex items-center justify-center mb-4">
						<img src={theme === "dark" ? logoWhite : logo} className="h-10 mr-3" alt="Custovra" />
					</a>
					<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#16bf4c] to-lime-500 text-transparent bg-clip-text
					dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#16bf4c] dark:to-lime-500'>
						Forgot Password
					</h2>
		
					{!isSubmitted ? (
						<form onSubmit={handleSubmit}>
							<p className='text-gray-600 mb-6 text-center dark:text-gray-400'>
								Enter your email address and we&apos;ll send you a link to reset your password.
							</p>
							<Input
								icon={Mail}
								type='email'
								placeholder='Email Address'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
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
							>
								{isLoading ? <Loader className='size-6 animate-spin mx-auto' /> : "Send Reset Link"}
							</motion.button>
						</form>
					) : (
						<div className='text-center'>
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
								className='w-16 h-16 bg-[#16bf4c] rounded-full flex items-center justify-center mx-auto mb-4'
							>
								<Mail className='h-8 w-8 text-white' />
							</motion.div>
							<p className='text-gray-600 dark:text-gray-300 mb-6'>
								If an account exists for {email}, you will receive a password reset link shortly.
							</p>
						</div>
					)}
				</div>
				
				<div className='px-8 py-4 bg-[#11963b] opacity-100 dark:bg-[#16bf4c] dark:bg-opacity-50 flex justify-center'>
					<Link to={"/login"} className='text-sm text-lime-300 hover:underline flex items-center'>
						<ArrowLeft className='h-4 w-4 mr-2' /> Back to Login
					</Link>
				</div>
			</motion.div>
		</FloatingBackground>
	);
};
export default ForgotPasswordPage;