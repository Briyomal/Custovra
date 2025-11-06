import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import FloatingBackground from "../components/FloatingBackground";
import TwoFactorAuthDialog from "../components/TwoFactorAuthDialog";
import logo from "../assets/Logo.png";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [show2FADialog, setShow2FADialog] = useState(false);
	const [userId, setUserId] = useState(null);
	const navigate = useNavigate();
	const { login, isLoading, error, isAuthenticated, checkAuth } = useAuthStore();
	
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
			className='m-4 md:m-0 max-w-md w-full bg-white bg-opacity-60 backdrop-filter backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden
				dark:bg-slate-800 dark:bg-opacity-40 dark:backdrop-filter dark:backdrop-blur-xl
			'
		>

			<div className='p-8'>
							
					<a href="/" className="flex items-center justify-center mb-4">
						<img src={logo} className="h-10 mr-3" alt="Custovra" />
					</a>
				<h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text
					dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-500 dark:to-indigo-400	
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
						<Link to='/forgot-password' className='text-sm text-blue-500 hover:underline'>
							Forgot password?
						</Link>
					</div>
					{error && !show2FADialog && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className='w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-200 transition duration-200'
						type='submit'
						disabled={isLoading}
					>
						{isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Login"}
					</motion.button>
				</form>
			</div>
			<div className='px-8 py-4 bg-blue-800 opacity-80 dark:bg-slate-700 dark:bg-opacity-90 flex justify-center'>
				<p className='text-sm text-gray-50'>
					Don&apos;t have an account?{" "}
					<Link to='/signup' className='text-blue-200 hover:underline'>
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