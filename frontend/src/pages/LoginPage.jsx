import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import FloatingBackground from "../components/FloatingBackground";
import TwoFactorAuthDialog from "../components/TwoFactorAuthDialog";
import logo from "../assets/Logo.png";
import logoWhite from "../assets/logo-white.png";
import { useTheme } from "@/components/theme-provider";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [show2FADialog, setShow2FADialog] = useState(false);
	const [userId, setUserId] = useState(null);
	const navigate = useNavigate();
	const { login, isLoading, error, isAuthenticated, checkAuth } = useAuthStore();
	const { theme } = useTheme();
	
	// Check if user is authenticated and redirect to dashboard
	useEffect(() => {
		if (isAuthenticated) {
			navigate("/dashboard");
		}
	}, [isAuthenticated, navigate]);

	const handleLogin = async (e) => {
		e.preventDefault();
	
		// Call the login function and get the response
		const response = await login(email, password);
	
		if (response?.twoFactorRequired) {
			// 2FA is required, show the 2FA dialog
			setUserId(response.userId);
			setShow2FADialog(true);
		} else if (response?.isVerified === false) {
			// Show the message to the user
			console.log("Email not verified. A new verification email has been sent.");
			
			// Redirect to /verify-email
			navigate("/verify-email");
		} else if (response?.success) {
			// Redirect to the desired route on successful login
			navigate("/dashboard");
		} else {
			// Handle other errors (e.g., invalid credentials)
			console.log(response?.message || "Login failed");
		}
	};

	const handle2FAClose = async () => {
		setShow2FADialog(false);
		setUserId(null);
		// After successful 2FA, check auth state and redirect to dashboard if authenticated
		await checkAuth();
	};

	return (
		<FloatingBackground>
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='m-4 md:m-0 max-w-md w-full border bg-white bg-opacity-60 backdrop-filter backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden
				dark:bg-[#0D0D0D] dark:bg-opacity-40 dark:backdrop-filter dark:backdrop-blur-lg
			'
		>

			<div className='px-4 py-8 md:p-8'>
							
					<a href="/" className="flex items-center justify-center mb-4">
						<img src={theme === "dark" ? logoWhite : logo} className="h-10 mr-3" alt="Custovra" />
					</a>
				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#16bf4c] to-lime-500 text-transparent bg-clip-text
					dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#16bf4c] dark:to-lime-500	
				'>
					Welcome Back
				</h2>

				<form onSubmit={handleLogin}>
					<Input
						icon={Mail}
						type='email'
						placeholder='Email Address'
						value={email}
						onChange={(e) => setEmail(e.target.value)} />

					<Input
						icon={Lock}
						type='password'
						placeholder='Password'
						value={password}
						onChange={(e) => setPassword(e.target.value)} />

					<div className='flex items-center mb-6'>
						<Link to='/forgot-password' className='text-sm text-lime-500 hover:underline'>
							Forgot password?
						</Link>
					</div>
					{error && !show2FADialog && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

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
						{isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Login"}
					</motion.button>
				</form>
			</div>
			<div className='px-8 py-4 bg-[#11963b] opacity-100 dark:bg-[#16bf4c] dark:bg-opacity-50 flex justify-center'>
				<p className='text-sm text-white'>
					Don&apos;t have an account?{" "}
					<Link to='/signup' className='text-lime-300 hover:underline'>
						Sign up
					</Link>
				</p>
			</div>
		</motion.div>
		
		<TwoFactorAuthDialog 
			isOpen={show2FADialog} 
			onClose={handle2FAClose} 
			userId={userId} 
		/>
		</FloatingBackground>
	);
};
export default LoginPage;