import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, LogOut, ShieldCheck, Truck, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Brand */}
      <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white">
        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-transparent bg-clip-text font-black">
          Gourmet
        </span>
        <span className="font-light text-slate-300">Express</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center space-x-4">
        {/* Customer Nav */}
        {(!currentUser || currentUser.role === 'customer') && (
          <>
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-orange-500' : 'text-slate-300 hover:text-white'
              }`}
            >
              Menu
            </Link>
            {currentUser && (
              <Link 
                to="/orders" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/orders') ? 'text-orange-500' : 'text-slate-300 hover:text-white'
                }`}
              >
                My Orders
              </Link>
            )}
          </>
        )}

        {/* Admin Link */}
        {currentUser?.role === 'admin' && (
          <Link 
            to="/admin" 
            className="flex items-center space-x-1 text-sm font-semibold text-orange-400 bg-orange-950/40 border border-orange-900/60 px-3 py-1 rounded-full hover:bg-orange-900/40 transition"
          >
            <ShieldCheck size={16} />
            <span>Admin Console</span>
          </Link>
        )}

        {/* Delivery Partner Link */}
        {currentUser?.role === 'delivery_partner' && (
          <Link 
            to="/delivery" 
            className="flex items-center space-x-1 text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-3 py-1 rounded-full hover:bg-emerald-900/40 transition"
          >
            <Truck size={16} />
            <span>Rider Portal</span>
          </Link>
        )}

        {/* Cart Icon (Customer/Guest only) */}
        {(!currentUser || currentUser.role === 'customer') && (
          <Link to="/cart" className="relative p-2 text-slate-300 hover:text-white transition">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>
        )}

        {/* User Profile / Logout */}
        {currentUser ? (
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-4 ml-2">
            {currentUser.role === 'customer' ? (
              <Link 
                to="/profile" 
                className="flex items-center space-x-2 group cursor-pointer"
                title="View Profile"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-orange-500 border border-slate-750 group-hover:border-orange-500/50 transition">
                  <User size={15} />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition leading-none">My Profile</p>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition max-w-[100px] truncate">{currentUser.name}</p>
                </div>
              </Link>
            ) : (
              <div className="hidden md:block text-right">
                <p className="text-xs text-slate-400">Hello,</p>
                <p className="text-sm font-medium text-white max-w-[120px] truncate">{currentUser.name}</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-slate-800/50 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="text-xs font-semibold uppercase tracking-wider bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
