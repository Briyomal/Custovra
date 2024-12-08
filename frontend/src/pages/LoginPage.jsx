import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import FloatingBackground from "../components/FloatingBackground";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate(); // Initialize navigate for redirection

	const { login, isLoading, error } = useAuthStore();
	const handleLogin = async (e) => {
		e.preventDefault();
	
		// Call the login function and get the response
		const response = await login(email, password);
	
		if (response?.isVerified === false) {
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
	return (
		<FloatingBackground>
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full bg-white bg-opacity-60 backdrop-filter backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden
				dark:bg-slate-800 dark:bg-opacity-40 dark:backdrop-filter dark:backdrop-blur-xl
			'
		>
			<div className='p-8'>
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
					{error && <p className='text-red-500 font-semibold mb-2'>{error}</p>}

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
		</FloatingBackground>
	);


};
export default LoginPage;