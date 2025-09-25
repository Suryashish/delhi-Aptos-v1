import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  children,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = "font-medium tracking-wide rounded-lg border-2 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 transform hover:-translate-y-0.5 relative overflow-hidden";
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black border-yellow-600 hover:from-yellow-500 hover:to-yellow-600 shadow-yellow-200",
    secondary: "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 border-gray-400 hover:from-gray-300 hover:to-gray-400 shadow-gray-200",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-700 hover:from-red-600 hover:to-red-700 shadow-red-200",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  
  const widthStyles = fullWidth ? "w-full" : "";
  const disabledStyles = (loading || props.disabled) ? "opacity-70 cursor-not-allowed transform-none hover:translate-y-0 hover:shadow-lg" : "";
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className}`;
  
  return (
    <button 
      className={combinedClassName} 
      disabled={loading || props.disabled}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
        )}
        <span className={loading ? "opacity-80" : ""}>{children}</span>
      </div>
    </button>
  );
};

export default Button;