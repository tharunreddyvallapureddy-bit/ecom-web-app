import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';
import { streamOrders } from '../services/db';
import { Clock, Navigation, ArrowRight, DollarSign, Wallet } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Stream orders in real-time so that status updates immediately propagate to this page!
    const unsubscribe = streamOrders((allOrders) => {
      // Filter for current customer's orders
      const customerOrders = allOrders.filter(o => o.customerId === currentUser.uid);
      setOrders(customerOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'PLACED':
        return <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Ordered</span>;
      case 'PREPARING':
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Preparing</span>;
      case 'PICKED_UP':
        return <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Out For Delivery</span>;
      case 'DELIVERED':
        return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Delivered</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-900">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Your Order History</h1>
            <p className="text-xs text-slate-400 mt-0.5">Track your active deliveries and view invoice receipts</p>
          </div>
          <Link to="/" className="text-xs font-bold text-orange-500 hover:text-orange-400 transition flex items-center space-x-1">
            <span>Back to Menu</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700/80 transition duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-slate-400">Order ID: #{order.id}</span>
                    <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock size={12} />
                      <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(order.orderStatus)}
                    {order.orderStatus !== 'DELIVERED' && (
                      <Link
                        to={`/tracking/${order.id}`}
                        className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition"
                      >
                        <Navigation size={12} />
                        <span>Track Live</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Items Summary list */}
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {item.product.name} <span className="text-slate-500 font-bold">x {item.quantity}</span>
                      </span>
                      <span className="text-slate-400">₹{item.product.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Payment summary & totals */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span className="flex items-center space-x-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-semibold text-slate-300">
                      {order.paymentMethod === 'COD' ? <DollarSign size={10} /> : <Wallet size={10} />}
                      <span>{order.paymentMethod === 'COD' ? 'COD' : 'UPI Payment'}</span>
                    </span>
                    <span className={`text-[10px] font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {order.paymentStatus === 'PAID' ? 'Paid' : 'Cash Pending'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 mr-2">Total Paid:</span>
                    <span className="font-extrabold text-orange-400 text-sm">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800 text-slate-400">
            <p className="text-sm">No orders found.</p>
            <Link to="/" className="text-orange-500 hover:text-orange-400 text-xs font-bold mt-2 inline-block">
              Place your first order
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
