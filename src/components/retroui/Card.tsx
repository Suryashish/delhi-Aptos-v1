import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  variant?: "default" | "raised" | "outlined";
  className?: string;
  loading?: boolean;
}

export const Card = ({
  children,
  title,
  variant = "default",
  className = "",
  loading = false,
}: CardProps) => {
  const baseStyles = "rounded-xl p-6 bg-white backdrop-blur-sm transition-all duration-300";
  
  const variantStyles = {
    default: "border-2 border-gray-200 shadow-lg hover:shadow-xl",
    raised: "border-2 border-gray-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:border-yellow-300",
    outlined: "border-2 border-gray-300 shadow-md hover:shadow-lg hover:border-yellow-400",
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  if (loading) {
    return (
      <div className={combinedClassName}>
        <div className="animate-pulse">
          {title && <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>}
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={combinedClassName}>
      {title && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;