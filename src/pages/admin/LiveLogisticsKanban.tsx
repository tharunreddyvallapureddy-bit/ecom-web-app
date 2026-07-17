import React, { useEffect, useState, useRef } from 'react';
import { streamOrders, updateOrderStatus, assignRiderToOrder, getDeliveryPartners, updateRiderLocation, updateOrderPaymentStatus } from '../../services/db';
import { Order, UserProfile } from '../../types';
import { Check, ClipboardList, ChefHat, Truck, CheckCircle2, ChevronRight, Navigation, RefreshCw, BadgeInfo } from 'lucide-react';

const LiveLogisticsKanban: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep track of active simulations
  const [activeSimulations, setActiveSimulations] = useState<{ [orderId: string]: boolean }>({});
  const simIntervalsRef = useRef<{ [orderId: string]: any }>({});

  useEffect(() => {
    // Stream orders
    const unsubscribeOrders = streamOrders((data) => {
      // Exclude delivered to show active workflow only
      setOrders(data.filter(o => o.orderStatus !== 'DELIVERED'));
      setLoading(false);
    });

    // Fetch riders
    const fetchRiders = () => {
      getDeliveryPartners().then(setRiders);
    };
    fetchRiders();

    // Poll riders list every 10 seconds to detect newly provisioned riders
    const riderPoll = setInterval(fetchRiders, 10000);

    return () => {
      unsubscribeOrders();
      clearInterval(riderPoll);
      // Clean up any remaining simulation loops
      Object.keys(simIntervalsRef.current).forEach(id => {
        clearInterval(simIntervalsRef.current[id]);
      });
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, currentStatus: Order['orderStatus']) => {
    try {
      if (currentStatus === 'PLACED') {
        await updateOrderStatus(orderId, 'PREPARING');
      } else if (currentStatus === 'PREPARING') {
        await updateOrderStatus(orderId, 'PICKED_UP');
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      await assignRiderToOrder(orderId, riderId || null);
    } catch (err) {
      console.error('Failed to assign rider:', err);
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      await updateOrderPaymentStatus(orderId, 'PAID');
    } catch (err) {
      console.error('Failed to settle payment:', err);
    }
  };

  const toggleGPSSimulator = (order: Order) => {
    const orderId = order.id;

    if (activeSimulations[orderId]) {
      // Stop Simulation
      clearInterval(simIntervalsRef.current[orderId]);
      delete simIntervalsRef.current[orderId];
      setActiveSimulations(prev => ({ ...prev, [orderId]: false }));
      return;
    }

    if (!order.assignedPartnerId) {
      alert("Please assign a delivery partner first before simulating GPS.");
      return;
    }

    // Start Simulation: increments coordinates en route from restaurant to customer destination
    setActiveSimulations(prev => ({ ...prev, [orderId]: true }));

    const startLat = 12.9716; // Restaurant center
    const startLng = 77.5946;
    const destLat = order.deliveryAddress.coordinates.latitude;
    const destLng = order.deliveryAddress.coordinates.longitude;

    let step = 0;
    const totalSteps = 20;

    const interval = setInterval(async () => {
      if (step > totalSteps) {
        // Simulation reached destination
        clearInterval(simIntervalsRef.current[orderId]);
        delete simIntervalsRef.current[orderId];
        setActiveSimulations(prev => ({ ...prev, [orderId]: false }));
        
        // Auto-deliver at the end of the simulation
        await updateOrderStatus(orderId, 'DELIVERED');
        return;
      }

      // Calculate interpolation fraction
      const fraction = step / totalSteps;
      const currentLat = startLat + (destLat - startLat) * fraction;
      const currentLng = startLng + (destLng - startLng) * fraction;

      try {
        await updateRiderLocation(order.assignedPartnerId!, {
          latitude: currentLat,
          longitude: currentLng
        });
      } catch (err) {
        console.error("GPS Sim update failed:", err);
      }

      step++;
    }, 2000); // Update every 2 seconds

    simIntervalsRef.current[orderId] = interval;
  };

  const getOrderStatusIcon = (status: Order['orderStatus']) => {
    switch (status) {
      case 'PLACED':
        return <ClipboardList className="text-blue-400" size={18} />;
      case 'PREPARING':
        return <ChefHat className="text-amber-400" size={18} />;
      case 'PICKED_UP':
        return <Truck className="text-purple-400" size={18} />;
      default:
        return <CheckCircle2 className="text-emerald-400" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-extrabold text-white">Live Logistics Kanban</h2>
        <span className="text-xs text-slate-500 flex items-center space-x-1">
          <BadgeInfo size={14} className="text-blue-400" />
          <span>Riders update location automatically, or use the Simulator button to test maps.</span>
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Order ID & Status</th>
                <th className="py-3 px-4">Customer Info</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Finances</th>
                <th className="py-3 px-4">Dispatch & Rider assignment</th>
                <th className="py-3 px-4">Testing tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-900/20 transition">
                  {/* ID & Status */}
                  <td className="py-4 px-4 space-y-1.5">
                    <div className="font-mono font-bold text-white">#{order.id}</div>
                    <div className="flex items-center space-x-1 text-slate-400">
                      {getOrderStatusIcon(order.orderStatus)}
                      <span className="text-[10px] font-semibold uppercase">{order.orderStatus}</span>
                    </div>
                  </td>

                  {/* Customer Info */}
                  <td className="py-4 px-4 max-w-[180px]">
                    <p className="font-bold text-slate-200 truncate">{order.deliveryAddress.street}</p>
                  </td>

                  {/* Items */}
                  <td className="py-4 px-4 max-w-[200px]">
                    <div className="space-y-0.5 max-h-[60px] overflow-y-auto pr-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-slate-400">
                          {item.product.name} <span className="text-slate-600 font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Finances */}
                  <td className="py-4 px-4 space-y-1">
                    <p className="font-extrabold text-orange-400 text-sm">₹{order.totalAmount}</p>
                    <div className="flex flex-col space-y-0.5 text-[9px] font-bold">
                      <span className="text-slate-400">Method: {order.paymentMethod}</span>
                      <span className={order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-500'}>
                        {order.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID COD'}
                      </span>
                    </div>
                  </td>

                  {/* Dispatch Assign */}
                  <td className="py-4 px-4 space-y-2.5">
                    {/* Rider Assign Dropdown */}
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold text-slate-500">Assign Partner:</label>
                      <select
                        value={order.assignedPartnerId || ''}
                        onChange={(e) => handleAssignRider(order.id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="">-- No Rider Assigned --</option>
                        {riders.map(rider => (
                          <option key={rider.uid} value={rider.uid}>
                            {rider.name} ({rider.partnerStatus || 'idle'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Toggles */}
                    <div>
                      {order.orderStatus === 'PLACED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, order.orderStatus)}
                          className="flex items-center space-x-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 rounded font-bold transition text-[10px] cursor-pointer"
                        >
                          <span>Accept & Prep</span>
                          <ChevronRight size={10} />
                        </button>
                      )}
                      {order.orderStatus === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, order.orderStatus)}
                          disabled={!order.assignedPartnerId}
                          className={`flex items-center space-x-1 px-3 py-1 border rounded font-bold transition text-[10px] cursor-pointer ${
                            order.assignedPartnerId
                              ? 'bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border-purple-500/30'
                              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                          }`}
                          title={!order.assignedPartnerId ? 'Assign a rider first' : ''}
                        >
                          <span>Dispatch Order</span>
                          <ChevronRight size={10} />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Simulator / Tests */}
                  <td className="py-4 px-4 space-y-1.5">
                    {order.orderStatus === 'PICKED_UP' && (
                      <button
                        onClick={() => toggleGPSSimulator(order)}
                        className={`w-full py-1.5 px-2.5 rounded font-bold text-[10px] transition flex items-center justify-center space-x-1 cursor-pointer ${
                          activeSimulations[order.id]
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        <RefreshCw size={10} className={activeSimulations[order.id] ? 'animate-spin' : ''} />
                        <span>{activeSimulations[order.id] ? 'Stop GPS Sim' : 'Simulate Rider GPS'}</span>
                      </button>
                    )}
                    
                    {order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID_COD' && (
                      <button
                        onClick={() => handleMarkPaid(order.id)}
                        className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 rounded font-bold text-[10px] text-slate-300 transition cursor-pointer"
                      >
                        Settle Paid on Delivery
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No active orders in the kitchen pipeline.
        </div>
      )}
    </div>
  );
};

export default LiveLogisticsKanban;
