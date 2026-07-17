import React, { useEffect, useState } from 'react';
import { getDeliveryPartners, settleRiderCash } from '../../services/db';
import { UserProfile } from '../../types';
import { CircleDollarSign, CheckSquare, ShieldCheck, HelpCircle } from 'lucide-react';

const CashSettlementMonitor: React.FC = () => {
  const [riders, setRiders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchRiders = async () => {
    try {
      const data = await getDeliveryPartners();
      setRiders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleSettleCash = async (riderId: string) => {
    if (!window.confirm("Confirm that this rider has returned to the restaurant and handed over all collected cash?")) return;
    
    setSettlingId(riderId);
    try {
      await settleRiderCash(riderId);
      await fetchRiders();
    } catch (err) {
      console.error("Failed to settle cash:", err);
    } finally {
      setSettlingId(null);
    }
  };

  const totalHeldCash = riders.reduce((sum, rider) => sum + (rider.cashCollected || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <div>
          <h2 className="text-base font-extrabold text-white">COD Cash Settlement Monitor</h2>
          <p className="text-[10px] text-slate-500">Tracks Cash on Delivery balances collected by delivery partners en route.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs flex items-center space-x-2">
          <CircleDollarSign size={16} className="text-orange-500" />
          <span className="text-slate-400">Total Outstanding Cash:</span>
          <span className="font-extrabold text-white">₹{totalHeldCash}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : riders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Delivery Partner</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">COD Cash Collected (Held)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {riders.map(rider => {
                const heldAmount = rider.cashCollected || 0;
                return (
                  <tr key={rider.uid} className="hover:bg-slate-900/20 transition">
                    <td className="py-4 px-4 font-bold text-slate-200">{rider.name}</td>
                    <td className="py-4 px-4 text-slate-400 font-mono">{rider.email}</td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        rider.partnerStatus === 'delivering' ? 'text-purple-400' : 'text-slate-500'
                      }`}>
                        {rider.partnerStatus || 'idle'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-extrabold text-sm ${heldAmount > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                        ₹{heldAmount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {heldAmount > 0 ? (
                        <button
                          onClick={() => handleSettleCash(rider.uid)}
                          disabled={settlingId === rider.uid}
                          className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 rounded font-bold text-[10px] transition flex items-center space-x-1 cursor-pointer ml-auto"
                        >
                          <CheckSquare size={12} />
                          <span>{settlingId === rider.uid ? 'Settling...' : 'Confirm Handover'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-600 flex items-center justify-end space-x-1 pr-4">
                          <ShieldCheck size={12} className="text-slate-600" />
                          <span>Balanced</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No delivery partners registered in database.
        </div>
      )}
    </div>
  );
};

export default CashSettlementMonitor;
