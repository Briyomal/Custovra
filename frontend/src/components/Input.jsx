import { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // or your icon library

const Input = ({ icon: Icon, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Determine input type
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative mb-6">
      {/* Left icon */}
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon className="size-5 text-[#16bf4c] dark:text-[#16bf4c]" />
        </div>
      )}

      {/* Input field */}
      <input
        {...props}
        type={inputType}
        className={`w-full pl-10 pr-10 py-3 bg-gray-50 bg-opacity-50 rounded-md border border-gray-400 
        focus:border-lime-500 focus:ring-1 focus:ring-lime-500 focus:outline-none 
        text-gray-800 placeholder-gray-500 transition duration-200
        dark:bg-[#0D0D0D] dark:bg-opacity-50 dark:border-[#313131] dark:placeholder-[#8a8a8a] dark:text-white dark:focus:border-lime-500 dark:focus:ring-lime-500`}
      />

      {/* Right eye icon for password */}
      {type === "password" && (
        <div
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="size-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <Eye className="size-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
};

export default Input;
