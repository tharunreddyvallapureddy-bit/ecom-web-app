import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MenuManager from './MenuManager';
import CouponManager from './CouponManager';
import DeliveryTeamControl from './DeliveryTeamControl';
import LiveLogisticsKanban from './LiveLogisticsKanban';
import CashSettlementMonitor from './CashSettlementMonitor';
import { getProducts, streamOrders, getDeliveryPartners, seedLiveDatabase } from '../../services/db';
import { Order, UserProfile } from '../../types';
import { LayoutDashboard, Utensils, Tag, Users, Kanban, CircleDollarSign, LogOut, ShieldAlert } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'logistics' | 'menu' | 'coupons' | 'team' | 'cash'>('logistics');

  // Dashboard Stats
  const [orderCount, setOrderCount] = useState(0);
  const [activeRidersCount, setActiveRidersCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isMenuEmpty, setIsMenuEmpty] = useState(false);


  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }

    // Stream stats in real-time
    const unsubscribeOrders = streamOrders((orders) => {
      setOrderCount(orders.length);
      const activeCount = orders.filter(o => o.orderStatus !== 'DELIVERED').length;
      
      const revenue = orders
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      setTotalRevenue(revenue);
    });

    getDeliveryPartners().then(riders => {
      setActiveRidersCount(riders.length);
    });

    getProducts().then(prods => {
      setIsMenuEmpty(prods.length === 0);
    });

    return () => unsubscribeOrders();
  }, [currentUser]);

  const handleSeed = async () => {
    try {
      await seedLiveDatabase();
      setIsMenuEmpty(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to seed:", err);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 pb-20 pt-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Admin Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-orange-500/10 text-orange-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-orange-500/20">
                Security Node Enabled
              </span>
            </div>
            <h1 className="text-2xl font-black mt-2 text-white">Gourmet Control Room</h1>
            <p className="text-xs text-slate-400">Manage kitchen pipelines, logistics queues, menus, and riders</p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-850">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">Logged in: Chef Admin</span>
          </div>
        </div>

        {isMenuEmpty && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-amber-400">Empty Database Detected</h4>
              <p className="text-xs text-slate-400">Initialize Gourmet Express default menu items and discount coupons on your live Firestore.</p>
            </div>
            <button
              onClick={handleSeed}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex-shrink-0"
            >
              Seed Database
            </button>
          </div>
        )}

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Kitchen Volume</span>
            <h3 className="text-2xl font-extrabold text-white">{orderCount} <span className="text-xs text-slate-500 font-normal">total orders</span></h3>
          </div>
          <div className="glass p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Authenticated Riders</span>
            <h3 className="text-2xl font-extrabold text-white">{activeRidersCount} <span className="text-xs text-slate-500 font-normal">active partners</span></h3>
          </div>
          <div className="glass p-5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Settled Net Earnings</span>
            <h3 className="text-2xl font-extrabold text-orange-400">₹{totalRevenue}</h3>
          </div>
        </div>

        {/* Dashboard Tabs switcher */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-900">
          <button
            onClick={() => setActiveTab('logistics')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'logistics'
                ? 'border-orange-500 text-orange-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Kanban size={14} />
            <span>Kitchen & Dispatch</span>
          </button>
          
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'menu'
                ? 'border-orange-500 text-orange-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Utensils size={14} />
            <span>Menu Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'coupons'
                ? 'border-orange-500 text-orange-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Tag size={14} />
            <span>Coupon codes</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'team'
                ? 'border-orange-500 text-orange-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Provision Riders</span>
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'cash'
                ? 'border-orange-500 text-orange-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CircleDollarSign size={14} />
            <span>COD Settlements</span>
          </button>
        </div>

        {/* Tab panels */}
        <div className="glass p-6 rounded-2xl border border-slate-800">
          {activeTab === 'logistics' && <LiveLogisticsKanban />}
          {activeTab === 'menu' && <MenuManager />}
          {activeTab === 'coupons' && <CouponManager />}
          {activeTab === 'team' && <DeliveryTeamControl />}
          {activeTab === 'cash' && <CashSettlementMonitor />}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
