import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import React, { useState, useEffect } from 'react';

// import { useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
//   const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = ['Home', 'Features', 'About', 'Contact'];

  return (
    <nav
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${
        isScrolled
          ? 'w-[95%] max-w-6xl'
          : 'w-[90%] max-w-5xl'
      } translate-y-0 opacity-100`}
    >
      <div
        className={`relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl transition-all duration-500 ${
          isScrolled
            ? 'py-3 px-6'
            : 'py-4 px-8'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
          boxShadow: '0 25px 45px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      >
        {/* Enhanced decorative gradient overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-teal-500/10 opacity-60"></div>

        <div className="relative flex items-center justify-between">
          {/* Enhanced Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 group w-10 h-10">
              <span className="text-white font-bold relative z-10 text-lg">{"<>"}</span>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300"></div>
            </div>
            <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent text-xl">
              Zero Move
            </span>
          </div>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 relative">
            {navItems.map((item, index) => (
              <button
                key={index}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative rounded-2xl text-white font-medium transition-all duration-300 group overflow-hidden px-6 py-3"
              >
                <span className="relative z-20 font-semibold tracking-wide text-lg">{item}</span>
                {/* Background layer with smooth transition */}
                <div className={`absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm transition-all duration-300 ${hoveredItem === index ? 'opacity-100' : 'opacity-0'}`}></div>
                {/* Bottom accent line */}
                <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full transition-all duration-300 h-0.5 ${hoveredItem === index ? 'w-1/2 opacity-100' : 'w-0 opacity-0'}`}></div>
              </button>
            ))}
          </div>

          {/* Enhanced CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="scale-100 transition-transform duration-300">
              <WalletSelector />
            </div>
          </div>

          {/* Enhanced Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-300 hover:bg-white/30 hover:border-white/50 group w-10 h-10"
          >
            <div className="space-y-1.5">
              <div className={`bg-gray-700 transition-all duration-300 group-hover:bg-purple-600 w-5 h-0.5 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
              <div className={`bg-gray-700 transition-all duration-300 group-hover:bg-purple-600 w-5 h-0.5 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`bg-gray-700 transition-all duration-300 group-hover:bg-purple-600 w-5 h-0.5 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Enhanced Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}
        >
          <div className="pb-4 space-y-3">
            {navItems.map((item, index) => (
              <button
                key={index}
                className="block w-full text-left rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300 group relative overflow-hidden px-4 py-3"
              >
                <span className="relative z-10 font-semibold tracking-wide text-lg">{item}</span>
                {/* Hover background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Left accent line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full group-hover:h-3/4 transition-all duration-300"></div>
              </button>
            ))}
            <button className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold shadow-lg relative overflow-hidden group mt-4 px-4 py-3">
              <span className="relative z-10 tracking-wide text-base">Get Started</span>
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced floating particles effect */}
      <div className="absolute -top-2 -left-2 rounded-full bg-purple-400/30 animate-pulse w-4 h-4">
        <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping"></div>
      </div>
      <div className="absolute -bottom-2 -right-2 rounded-full bg-blue-400/30 animate-pulse delay-1000 w-3 h-3">
        <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping delay-1000"></div>
      </div>
      <div className="absolute top-1/2 -right-1 rounded-full bg-teal-400/30 animate-pulse delay-500 w-2 h-2">
        <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping delay-500"></div>
      </div>
    </nav>
  );
};

export default Navbar;