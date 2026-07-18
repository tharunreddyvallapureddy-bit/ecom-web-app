import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, updateUserProfile } from '../services/db';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { Trash2, Plus, Minus, Tag, MapPin, CreditCard, ChevronRight, X, AlertTriangle, BadgeDollarSign } from 'lucide-react';

const Cart: React.FC = () => {
  const { items, updateCartQuantity, removeFromCart, subtotal, discountApplied, totalAmount, appliedCoupon, applyCouponCode, removeCoupon, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Address variables
  const [selectedAddress, setSelectedAddress] = useState<string>(
    currentUser?.addresses && currentUser.addresses.length > 0 ? currentUser.addresses[0] : ''
  );
  const [newAddress, setNewAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Coupon variables
  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Payment variables
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [activeTxnId, setActiveTxnId] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Geolocation state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setDetectedCoords({ latitude, longitude });
        
        try {
          // Free Nominatim OpenStreetMap Reverse Geocoding API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              setNewAddress(data.display_name);
            } else {
              setNewAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
            }
          } else {
            setNewAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          setNewAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to access your location. Please check your browser location permissions.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponFeedback(null);
    const res = await applyCouponCode(couponCode);
    setCouponFeedback(res);
    if (res.success) {
      setCouponCode('');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !currentUser) return;

    try {
      const currentAddresses = currentUser.addresses || [];
      const addressStr = newAddress.trim();
      const updatedAddresses = [...currentAddresses, addressStr];
      await updateUserProfile(currentUser.uid, { addresses: updatedAddresses });
      
      // Save coordinates mapping
      const savedCoords = JSON.parse(localStorage.getItem('ecom_address_coords') || '{}');
      savedCoords[addressStr] = detectedCoords || {
        latitude: 14.6626 + (Math.random() - 0.5) * 0.03,
        longitude: 78.3915 + (Math.random() - 0.5) * 0.03,
      };
      localStorage.setItem('ecom_address_coords', JSON.stringify(savedCoords));

      setSelectedAddress(addressStr);
      setNewAddress('');
      setDetectedCoords(null);
      setShowAddAddress(false);
    } catch (err) {
      console.error('Failed to save address:', err);
    }
  };

  const handlePlaceOrder = async (isUPIPaid = false) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!selectedAddress) {
      setOrderError('Please select or add a delivery address.');
      return;
    }

    setOrderError('');
    setIsSubmitting(true);

    // Dynamic restaurant transaction details
    const txnId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);

    if (paymentMethod === 'UPI' && !isUPIPaid) {
      // Trigger UPI QR payment modal
      setActiveTxnId(txnId);
      setShowUPIModal(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const savedCoords = JSON.parse(localStorage.getItem('ecom_address_coords') || '{}');
      const coordinates = savedCoords[selectedAddress] || {
        latitude: 14.6626 + (Math.random() - 0.5) * 0.03,
        longitude: 78.3915 + (Math.random() - 0.5) * 0.03,
      };

      const orderPayload = {
        customerId: currentUser.uid,
        assignedPartnerId: null,
        items,
        subtotal,
        discountApplied,
        totalAmount,
        paymentMethod,
        paymentStatus: isUPIPaid ? 'PAID' as const : 'UNPAID_COD' as const,
        orderStatus: 'PLACED' as const,
        deliveryAddress: {
          street: selectedAddress,
          coordinates: coordinates
        }
      };

      const created = await createOrder(orderPayload);
      clearCart();
      setShowUPIModal(false);
      navigate(`/tracking/${created.id}`);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center space-y-4 bg-slate-950 text-slate-100">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <Trash2 size={24} />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-bold text-lg text-white">Your Cart is Empty</h3>
          <p className="text-slate-500 text-xs">Browse our signature menu and add dishes to satisfy your cravings.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20 pt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-extrabold text-white pb-3 border-b border-slate-800">Your Basket</h2>
            
            <div className="divide-y divide-slate-800/80">
              {items.map(item => (
                <div key={item.product.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 flex-grow mr-4">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                    />
                    <div className="space-y-0.5 max-w-[240px]">
                      <h4 className="font-bold text-sm text-white truncate">{item.product.name}</h4>
                      <p className="text-xs text-orange-400 font-semibold">₹{item.product.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Quantity selectors */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-2">
                      <button 
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-slate-600 hover:text-red-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Management */}
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <MapPin size={18} className="text-orange-500" />
                <span>Delivery Address</span>
              </h2>
              {!showAddAddress && (
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-400 transition cursor-pointer"
                >
                  + Add New Address
                </button>
              )}
            </div>

            {/* Address List */}
            {currentUser?.addresses && currentUser.addresses.length > 0 ? (
              <div className="space-y-3">
                {currentUser.addresses.map((address, idx) => (
                  <label 
                    key={idx} 
                    className={`flex items-start space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedAddress === address 
                        ? 'bg-orange-500/5 border-orange-500/40' 
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="address" 
                      value={address}
                      checked={selectedAddress === address}
                      onChange={() => setSelectedAddress(address)}
                      className="mt-1 accent-orange-500"
                    />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-slate-200">Address Option {idx + 1}</p>
                      <p className="text-slate-400">{address}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-900/30 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-500">No saved addresses. Please add your delivery address below.</p>
              </div>
            )}

            {/* Add Address Form */}
            {(showAddAddress || !currentUser?.addresses || currentUser.addresses.length === 0) && (
              <form onSubmit={handleAddAddress} className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800 animate-fade-in">
                <div className="flex justify-between items-center pb-1">
                  <h4 className="text-xs font-bold text-slate-300">Add New Destination</h4>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={gpsLoading}
                    className="text-[10px] font-extrabold text-orange-400 hover:text-orange-300 flex items-center space-x-1 transition cursor-pointer"
                  >
                    <span>{gpsLoading ? 'Detecting Location...' : 'Use Current GPS'}</span>
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Enter flat number, street name, block..."
                    className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                {currentUser?.addresses && currentUser.addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-400"
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Checkout Summary panel */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-6">
            <h2 className="text-lg font-extrabold text-white">Order Summary</h2>

            {/* Promo coupons */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Apply Promo Code</label>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-2 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <Tag size={14} />
                    <span className="font-bold">{appliedCoupon.code}</span>
                    <span className="text-[10px] opacity-80">(Saved ₹{discountApplied})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-400 hover:text-emerald-300">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="WELCOME50, POCKETSAVER"
                    className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-slate-600"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition border border-slate-700 cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[10px] font-bold ${couponFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Ledger breakdown */}
            <div className="space-y-3.5 border-t border-slate-800/80 pt-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              
              {discountApplied > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{discountApplied}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Delivery Charge</span>
                <span className="text-emerald-400 font-semibold uppercase text-[10px]">Free</span>
              </div>

              <div className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-orange-400 text-base font-extrabold">₹{totalAmount}</span>
              </div>
            </div>

            {/* Zero cost payment methods selection */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Payment Method</label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* 1. COD (Prioritized) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 cursor-pointer transition ${
                    paymentMethod === 'COD'
                      ? 'bg-orange-500/5 border-orange-500/70 text-orange-400 shadow-md shadow-orange-500/5'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <BadgeDollarSign size={20} />
                  <span className="text-[11px] font-bold">Cash on Delivery</span>
                </button>

                {/* 2. UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 cursor-pointer transition ${
                    paymentMethod === 'UPI'
                      ? 'bg-orange-500/5 border-orange-500/70 text-orange-400 shadow-md shadow-orange-500/5'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard size={20} />
                  <span className="text-[11px] font-bold">UPI QR/Deep Link</span>
                </button>
              </div>

              {/* Informative notification */}
              {paymentMethod === 'COD' ? (
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  COD orders immediately bypass external checks and land directly on our kitchen pipeline. Collect cash on delivery.
                </div>
              ) : (
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  Dynamic QR codes direct payments straight to the restaurant merchant virtual address (VPA) with 0% processing fees.
                </div>
              )}
            </div>

            {orderError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-start space-x-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Place Order CTA Button */}
            <button
              onClick={() => handlePlaceOrder(false)}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-orange-500/10 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Processing Order...' : (paymentMethod === 'COD' ? 'Place COD Order' : 'Proceed to UPI Payment')}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal overlay */}
      {showUPIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-zoom-in relative">
            <button 
              onClick={() => setShowUPIModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900"
            >
              <X size={18} />
            </button>
            <div className="p-6">
              <QRCodeGenerator
                vpa="restaurant@upi"
                name="Gourmet Express Kitchen"
                amount={totalAmount}
                txnId={activeTxnId}
                onPaymentSimulated={() => handlePlaceOrder(true)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
