//import { motion } from "framer-motion";
import { Loader } from "lucide-react";

const LoadingSpinner = () => {
	return (
		<div className='min-h-screen 
			bg-gradient-to-br from-gray-50 via-violet-200 to-violet-100 
			dark:bg-gradient-to-br dark:from-gray-950 dark:via-slate-900 dark:to-gray-950	
			flex items-center justify-center relative overflow-hidden'
			>
			{/* Simple Loading Spinner */}
			<Loader className="w-16 h-16 animate-spin" />
		</div>
	);
};

export default LoadingSpinner;