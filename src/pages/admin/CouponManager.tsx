import React, { useEffect, useState } from 'react';
import { getCoupons, addCoupon, updateCoupon, deleteCoupon } from '../../services/db';
import { Coupon } from '../../types';
import { Plus, Trash, ShieldAlert, Check, X, Tag } from 'lucide-react';

const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form variables
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minSubtotal, setMinSubtotal] = useState<number>(100);
  const [error, setError] = useState('');

  const fetchCoupons = async () => {
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');

    try {
      await addCoupon({
        code: code.toUpperCase().trim(),
        discountType,
        discountValue,
        minSubtotal,
        isActive: true
      });
      setCode('');
      setDiscountValue(10);
      setMinSubtotal(100);
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to add coupon.');
    }
  };

  const handleToggleActive = async (couponId: string, currentStatus: boolean) => {
    try {
      await updateCoupon(couponId, { isActive: !currentStatus });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon code?")) return;
    try {
      await deleteCoupon(couponId);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <h2 className="text-base font-extrabold text-white">Coupon Code Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
        >
          <Plus size={14} />
          <span>{showForm ? 'Close Editor' : 'Create Coupon'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddCoupon} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">New Promo Coupon Details</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center space-x-1.5">
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Coupon Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="WELCOME50"
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Discount Value</label>
              <input
                type="number"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Min Subtotal (₹)</label>
              <input
                type="number"
                required
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Create Coupon
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : coupons.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Order Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-slate-900/20 transition">
                  <td className="py-4 px-4 font-mono font-bold text-white flex items-center space-x-1.5">
                    <Tag size={12} className="text-orange-500" />
                    <span>{coupon.code}</span>
                  </td>
                  <td className="py-4 px-4 text-slate-300 font-semibold">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                  </td>
                  <td className="py-4 px-4 text-slate-400">₹{coupon.minSubtotal}</td>
                  
                  {/* Status Toggle */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                      className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        coupon.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      <span>{coupon.isActive ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>

                  {/* Delete Action */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/40 rounded transition cursor-pointer"
                    >
                      <Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No coupons created yet.
        </div>
      )}
    </div>
  );
};

export default CouponManager;
