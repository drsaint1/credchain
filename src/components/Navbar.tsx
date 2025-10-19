import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FileCheck, Award, Home, LayoutDashboard, Briefcase, ShieldCheck, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-card fixed top-0 left-0 right-0 z-50 mx-4 mt-4">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              CredChain
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 transition-colors ${
                isActive('/') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              to="/contracts"
              className={`flex items-center space-x-2 transition-colors ${
                isActive('/contracts') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              <FileCheck className="w-5 h-5" />
              <span>Contracts</span>
            </Link>
            <Link
              to="/credentials"
              className={`flex items-center space-x-2 transition-colors ${
                isActive('/credentials') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>Credentials</span>
            </Link>
            <Link
              to="/jobs"
              className={`flex items-center space-x-2 transition-colors ${
                isActive('/jobs') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Jobs</span>
            </Link>
            <Link
              to="/verify"
              className={`flex items-center space-x-2 transition-colors ${
                isActive('/verify') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Verify</span>
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 transition-colors ${
                isActive('/dashboard') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-primary-600 !to-primary-700 hover:!from-primary-500 hover:!to-primary-600" />

            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/contracts"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/contracts') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <FileCheck className="w-5 h-5" />
                <span>Contracts</span>
              </Link>
              <Link
                to="/credentials"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/credentials') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Award className="w-5 h-5" />
                <span>Credentials</span>
              </Link>
              <Link
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/jobs') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Jobs</span>
              </Link>
              <Link
                to="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/verify') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Verify</span>
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/dashboard') ? 'text-primary-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};