import { motion } from "framer-motion";
import Input from "../components/Input";
import { Loader, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import FloatingBackground from "../components/FloatingBackground";
import { Turnstile } from "@marsidev/react-turnstile";
import logo from "../assets/Logo.png";
import logoWhite from "../assets/logo-white.png";
import { useTheme } from "@/components/theme-provider";

const SignUpPage = () => {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [captchaToken, setCaptchaToken] = useState(null);
    const navigate = useNavigate();
	const { theme } = useTheme();

    const { signup, error, isLoading } = useAuthStore();

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            alert("Please complete the captcha.");
            return;
        }

        try {
            await signup(email, password, name, captchaToken);
            navigate("/verify-email");
        } catch (error) {
            console.log(error);
        }
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
                        Create Account
                    </h2>

                    <form onSubmit={handleSignUp}>
                        <Input
                            icon={User}
                            type='text'
                            placeholder='Full Name'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            icon={Mail}
                            type='email'
                            placeholder='Email Address'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            icon={Lock}
                            type='password'
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && <p className='text-red-500 font-semibold mt-2'>{error}</p>}
                        <PasswordStrengthMeter password={password} />

                        {/* Cloudflare Turnstile Captcha */}
                        <div className="mt-4">
                            <Turnstile
                                siteKey={`${import.meta.env.VITE_TURNSTILE_SITE_KEY}`}
                                onSuccess={(token) => setCaptchaToken(token)}
                                onExpire={() => setCaptchaToken(null)}
                                onError={() => setCaptchaToken(null)}
                            />
                        </div>

                        <motion.button
                            className='mt-5 w-full py-3 px-4 rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type='submit'
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className=' animate-spin mx-auto' size={24} /> : "Sign Up"}
                        </motion.button>
                    </form>
                </div>
                <div className='px-8 py-4 bg-[#11963b] opacity-100 dark:bg-[#16bf4c] dark:bg-opacity-50 flex justify-center'>
                    <p className='text-sm text-white'>
                        Already have an account?{" "}
                        <Link to={"/login"} className='text-lime-300 hover:underline transition-all duration-200 ease-in-out'>
                            Login
                        </Link>
                    </p>
                </div>
            </motion.div>
        </FloatingBackground>
    )
}

export default SignUpPage
