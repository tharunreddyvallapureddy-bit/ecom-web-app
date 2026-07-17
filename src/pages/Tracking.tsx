import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { streamActiveOrder, streamRiderCoordinates, getUserProfile } from '../services/db';
import type { Order, UserProfile } from '../types';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { Check, ShieldAlert, ArrowLeft, Bike, ShoppingBag, Store, Phone } from 'lucide-react';

const Tracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [rider, setRider] = useState<UserProfile | null>(null);
  const [riderCoords, setRiderCoords] = useState<UserProfile['currentCoordinates'] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Constants
  const restaurantCoords = { latitude: 12.9716, longitude: 77.5946 };

  useEffect(() => {
    if (!orderId) return;

    // Listen to active order changes
    const unsubscribeOrder = streamActiveOrder(orderId, async (activeOrder) => {
      if (!activeOrder) {
        setLoading(false);
        return;
      }

      setOrder(activeOrder);

      // If a delivery partner is assigned, fetch profile and stream coordinates
      if (activeOrder.assignedPartnerId) {
        const partnerProfile = await getUserProfile(activeOrder.assignedPartnerId);
        setRider(partnerProfile);
      } else {
        setRider(null);
        setRiderCoords(undefined);
      }
      setLoading(false);
    });

    return () => unsubscribeOrder();
  }, [orderId]);

  // Separate effect to stream rider coordinates when assignedPartnerId changes
  useEffect(() => {
    if (!order?.assignedPartnerId || order.orderStatus !== 'PICKED_UP') {
      setRiderCoords(undefined);
      return;
    }

    const unsubscribeRiderCoords = streamRiderCoordinates(
      order.assignedPartnerId,
      (coords) => {
        setRiderCoords(coords);
      }
    );

    return () => unsubscribeRiderCoords();
  }, [order?.assignedPartnerId, order?.orderStatus]);

  const getStepStatus = (step: 'PLACED' | 'PREPARING' | 'PICKED_UP' | 'DELIVERED') => {
    if (!order) return 'upcoming';
    const statusMap = { PLACED: 1, PREPARING: 2, PICKED_UP: 3, DELIVERED: 4 };
    const currentWeight = statusMap[order.orderStatus];
    const stepWeight = statusMap[step];

    if (currentWeight >= stepWeight) return 'completed';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm">Locating order trace...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center space-y-4 bg-slate-950 text-slate-100 px-4">
        <ShieldAlert size={48} className="text-red-500" />
        <div className="text-center space-y-1">
          <h3 className="font-bold text-lg text-white">Order Not Found</h3>
          <p className="text-slate-500 text-xs">The tracking link you accessed might be expired or incorrect.</p>
        </div>
        <Link to="/" className="text-orange-500 hover:text-orange-400 text-xs font-bold transition">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-900">
          <button 
            onClick={() => navigate('/orders')} 
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Order Tracking</h1>
            <p className="text-xs text-slate-400 mt-0.5">Order ID: #{order.id}</p>
          </div>
        </div>

        {/* Stepper Status Indicator */}
        <div className="glass p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between relative">
            
            {/* Horizontal Line background */}
            <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-800 -z-10"></div>
            
            {/* Step 1: Placed */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                getStepStatus('PLACED') === 'completed'
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <ShoppingBag size={16} />
              </div>
              <span className={`text-[10px] font-bold ${getStepStatus('PLACED') === 'completed' ? 'text-slate-200' : 'text-slate-600'}`}>Placed</span>
            </div>

            {/* Step 2: Preparing */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                getStepStatus('PREPARING') === 'completed'
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Store size={16} />
              </div>
              <span className={`text-[10px] font-bold ${getStepStatus('PREPARING') === 'completed' ? 'text-slate-200' : 'text-slate-600'}`}>Preparing</span>
            </div>

            {/* Step 3: Picked Up */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                getStepStatus('PICKED_UP') === 'completed'
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Bike size={16} />
              </div>
              <span className={`text-[10px] font-bold ${getStepStatus('PICKED_UP') === 'completed' ? 'text-slate-200' : 'text-slate-600'}`}>Out For Delivery</span>
            </div>

            {/* Step 4: Delivered */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                getStepStatus('DELIVERED') === 'completed'
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Check size={16} />
              </div>
              <span className={`text-[10px] font-bold ${getStepStatus('DELIVERED') === 'completed' ? 'text-slate-200' : 'text-slate-600'}`}>Delivered</span>
            </div>
            
          </div>
        </div>

        {/* Map Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Live Delivery Route Map</h3>
          
          <LiveTrackingMap
            restaurantCoordinates={restaurantCoords}
            deliveryCoordinates={order.deliveryAddress.coordinates}
            riderCoordinates={riderCoords ? { latitude: riderCoords.latitude, longitude: riderCoords.longitude } : undefined}
            riderName={rider?.name}
          />
        </div>

        {/* Delivery Rider Metadata Card */}
        {rider && (
          <div className="glass p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 text-slate-400">
                <Bike size={22} className="text-orange-500 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your Assigned Rider</span>
                <h4 className="font-extrabold text-sm text-white">{rider.name}</h4>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <span>Rider Status:</span>
                  <span className={`font-semibold ${order.orderStatus === 'PICKED_UP' ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {order.orderStatus === 'PICKED_UP' ? 'En Route (Live GPS)' : 'Waiting at Restaurant'}
                  </span>
                </p>
              </div>
            </div>
            
            <a 
              href={`tel:${rider.email}`} 
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Phone size={14} />
              <span className="hidden sm:inline">Contact Rider</span>
            </a>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider">Invoice Summary</h4>
          <div className="space-y-2 border-b border-slate-900 pb-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-300">
                <span>{item.product.name} (x{item.quantity})</span>
                <span>₹{item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center font-bold text-sm pt-1">
            <span className="text-slate-400">Paid via {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI Online'}</span>
            <span className="text-orange-400 text-base font-extrabold">₹{order.totalAmount}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Tracking;
