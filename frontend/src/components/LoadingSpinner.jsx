//import { motion } from "framer-motion";
import { Loader } from "lucide-react";

const LoadingSpinner = () => {
	return (
		<div className='min-h-screen 
			bg-gradient-to-br from-gray-50 via-violet-200 to-violet-100 
			dark:bg-gradient-to-br dark:from-[#0D0D0D] dark:via-[#292929] dark:to-[#0D0D0D]	
			flex items-center justify-center relative overflow-hidden'
			>
			{/* Simple Loading Spinner */}
			<Loader className="w-8 h-8 md:w-16 md:h-16 animate-spin text-[#16bf4c]" />
		</div>
	);
};

export default LoadingSpinner;