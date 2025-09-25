import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Input = ({
  label,
  error,
  fullWidth = false,
  loading = false,
  className = "",
  ...props
}: InputProps) => {
  const baseStyles = "px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200 shadow-md hover:shadow-lg";
  const errorStyles = error ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "";
  const widthStyles = fullWidth ? "w-full" : "";
  const loadingStyles = loading ? "bg-gray-100 animate-pulse" : "bg-white";
  
  const combinedClassName = `${baseStyles} ${errorStyles} ${widthStyles} ${loadingStyles} ${className}`;
  
  return (
    <div className={`mb-5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          {label}
          <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
        </label>
      )}
      <input 
        className={combinedClassName} 
        disabled={loading}
        {...props} 
      />
      {error && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;