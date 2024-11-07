import FloatingShape from "./FloatingShape";

const FloatingBackground = ({children}) => {
	return (
			<div
				className="min-h-screen bg-gradient-to-br
            from-gray-50 via-violet-200 to-violet-100 flex items-center justify-center relative overflow-hidden"
			>
				<FloatingShape color="bg-sky-600" size="w-64 h-64" top="-5%" left="10%" delay={0} />
				<FloatingShape color="bg-amber-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
				<FloatingShape color="bg-rose-500" size="w-32 h-32" top="40%" left="10%" delay={2} />
                {children}
			</div>
	);
};

export default FloatingBackground;
