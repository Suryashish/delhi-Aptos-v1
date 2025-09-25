import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error" | "default";
  className?: string;
}

export const Badge = ({ children, variant = "default", className = "" }: BadgeProps) => {
  const baseStyles = "inline-block px-2 py-1 rounded-md text-xs font-medium";
  
  const variantStyles = {
    default: "bg-gray-200 text-gray-800",
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  return (
    <span className={combinedClassName}>
      {children}
    </span>
  );
};

export default Badge;