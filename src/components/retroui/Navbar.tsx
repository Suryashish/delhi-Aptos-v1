import React from "react";

interface NavbarProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "investment";
}

export const Navbar = ({ title, children, className = "", variant = "default" }: NavbarProps) => {
  const baseStyles = variant === "investment" 
    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black p-3 shadow-lg border-b-2 border-yellow-600"
    : "bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 shadow-xl";
  
  const combinedClassName = `${baseStyles} ${className}`;
  
  return (
    <nav className={combinedClassName}>
      <div className="container mx-auto flex items-center justify-between">
        <h1 className={`font-bold tracking-tight ${variant === "investment" ? "text-lg" : "text-2xl"}`}>
          {title}
        </h1>
        {children && (
          <div className="flex items-center space-x-4">
            {children}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;