import FloatingShape from "./FloatingShape";
import ThemeSwitch from "./ThemeSwitch";

const FloatingBackground = ({children}) => {
	return (
		<>
			<ThemeSwitch />
			<div
				className="min-h-screen bg-gray-100 dark:bg-[#0D0D0D] flex items-center justify-center relative overflow-hidden"
			>
				<FloatingShape color="bg-green-600" size="w-96 h-96" top="-5%" left="10%" delay={0} />
				<FloatingShape color="bg-yellow-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
				<FloatingShape color="bg-lime-500" size="w-60 h-60" top="40%" left="10%" delay={2} />
				
                {children}
			</div>
			</>
	);
};

export default FloatingBackground;
