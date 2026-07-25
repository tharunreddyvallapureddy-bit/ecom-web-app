import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  updateUserProfile, 
  getCoupons, 
  getProducts, 
  streamCustomerOrders 
} from '../services/db';
import type { Coupon, Product, Order } from '../types';
import { 
  MapPin, 
  CreditCard, 
  Undo2, 
  Wallet, 
  ChevronRight, 
  User, 
  Mail, 
  FileText, 
  Heart, 
  Smartphone, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Plus, 
  X, 
  Sparkles,
  ShoppingBag,
  Tag
} from 'lucide-react';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [saveLoading, setSaveLoading] = useState(false);

  // Address Management
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Voucher / Coupon state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showVouchersModal, setShowVouchersModal] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Favourites state (we'll fetch popular products as mock favorites)
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [showFavsModal, setShowFavsModal] = useState(false);

  // Payment Modes / Wallet states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [walletAddAmount, setWalletAddAmount] = useState('');
  const [paymentCards, setPaymentCards] = useState([
    { id: '1', type: 'VISA', last4: '4321', bank: 'HDFC Bank', expiry: '12/29' },
    { id: '2', type: 'MASTERCARD', last4: '8899', bank: 'ICICI Bank', expiry: '06/28' }
  ]);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardBank, setNewCardBank] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');

  // Contact Toggle state
  const [allowContact, setAllowContact] = useState(true);

  // Refunds State (mock data)
  const [showRefundsModal, setShowRefundsModal] = useState(false);
  const refundsList = [
    { id: 'REF99828', amount: 189, date: '22 Jul 2026', status: 'REFUNDED', orderId: 'ORD0928' },
    { id: 'REF88716', amount: 99, date: '15 Jul 2026', status: 'PROCESSING', orderId: 'ORD0812' }
  ];

  // Statements State (download past orders statement)
  const [orders, setOrders] = useState<Order[]>([]);

  // Fetch Coupons, Products, and Orders
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch system coupons
    getCoupons().then(setCoupons);
    
    // Fetch products and select popular ones for Favourites
    getProducts().then(prods => {
      setFavProducts(prods.slice(0, 3));
    });

    // Stream past orders for statement downloading
    const unsubscribe = streamCustomerOrders(currentUser.uid, (userOrders) => {
      setOrders(userOrders);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync state with currentUser when it loads/changes
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <User size={48} className="text-slate-600 animate-bounce" />
        <p className="text-slate-400 text-sm">Please log in to view your profile.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Handle Edit Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await updateUserProfile(currentUser.uid, {
        name: editName,
        phone: editPhone
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Error saving profile details");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Adding Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;

    try {
      const currentAddresses = currentUser.addresses || [];
      const updated = [...currentAddresses, newAddress.trim()];
      await updateUserProfile(currentUser.uid, { addresses: updated });
      setNewAddress('');
    } catch (err) {
      console.error("Failed to add address:", err);
    }
  };

  // Handle Deleting Address
  const handleDeleteAddress = async (addrToDelete: string) => {
    try {
      const currentAddresses = currentUser.addresses || [];
      const updated = currentAddresses.filter(a => a !== addrToDelete);
      await updateUserProfile(currentUser.uid, { addresses: updated });
    } catch (err) {
      console.error("Failed to delete address:", err);
    }
  };

  // Detect GPS Location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
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
          console.error("GPS address translation error:", err);
          setNewAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error("GPS access error:", error);
        alert("Failed to grab location. Check permission settings.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Add Money to Wallet
  const handleAddWalletMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(walletAddAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      const currentBal = currentUser.walletBalance || 0;
      await updateUserProfile(currentUser.uid, {
        walletBalance: currentBal + amt
      });
      setWalletAddAmount('');
      alert(`₹${amt} successfully added to Gourmet Money!`);
    } catch (err) {
      console.error("Wallet update failed:", err);
    }
  };

  // Add Payment Card
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || !newCardBank || !newCardExpiry) return;
    const newCard = {
      id: Date.now().toString(),
      type: newCardNumber.startsWith('4') ? 'VISA' : 'MASTERCARD',
      last4: newCardNumber.slice(-4),
      bank: newCardBank,
      expiry: newCardExpiry
    };
    setPaymentCards(prev => [...prev, newCard]);
    setNewCardNumber('');
    setNewCardBank('');
    setNewCardExpiry('');
  };

  // Copy Coupon Code helper
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // Account Statement Downloader (generates custom HTML / print window)
  const downloadStatement = () => {
    if (orders.length === 0) {
      alert("No past orders found to generate a statement.");
      return;
    }
    
    const statementWindow = window.open('', '_blank');
    if (!statementWindow) return;

    const rows = orders.map((order, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(order.createdAt).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${order.paymentMethod}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${order.totalAmount}</td>
      </tr>
    `).join('');

    statementWindow.document.write(`
      <html>
        <head>
          <title>Gourmet Express - Account Statement</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; padding: 40px; }
            h1 { color: #f97316; margin-bottom: 5px; }
            p { margin: 0 0 20px 0; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Gourmet Express Account Statement</h1>
          <p>Account Holder: ${currentUser.name} | Email: ${currentUser.email}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Order ID</th>
                <th>Items Ordered</th>
                <th>Payment Mode</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    statementWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 pt-8 text-slate-100">
      <div className="max-w-md mx-auto px-4 space-y-6">
        
        {/* PROFILE HEADER CARD WITH GRADIENT */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-amber-700 p-6 shadow-xl border border-orange-500/20">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white border-2 border-white/20 shadow-md">
                <span className="text-xl font-black">{currentUser.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-white tracking-tight">{currentUser.name}</h2>
                <div className="flex items-center space-x-1.5 text-xs text-orange-100 font-medium">
                  <Smartphone size={12} />
                  <span>{currentUser.phone || 'Add Phone Number'}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-orange-100/90">
                  <Mail size={12} />
                  <span>{currentUser.email}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white text-[10px] font-extrabold rounded-full transition cursor-pointer"
            >
              {isEditing ? 'Close' : 'Edit'}
            </button>
          </div>

          {/* Edit Form Dropdown */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-orange-200">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-950/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-orange-200/50 focus:outline-none focus:border-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-orange-200">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+91 - 9988776655"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-orange-200/50 focus:outline-none focus:border-white"
                />
              </div>
              <button 
                type="submit" 
                disabled={saveLoading}
                className="w-full py-2 bg-white text-orange-700 hover:bg-orange-50 text-xs font-black rounded-lg transition shadow-md cursor-pointer"
              >
                {saveLoading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          )}
        </div>

        {/* GOURMET ONE PREMIUM MEMBERSHIP BANNER */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-orange-500 font-black tracking-wider text-xs">GOURMET</span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                ONE ACTIVE
              </span>
            </div>
            <p className="text-xs font-bold text-slate-200">₹240 saved this month</p>
            <p className="text-[10px] text-slate-400">Unlimited free deliveries above ₹199</p>
          </div>
          <Sparkles className="text-orange-400 animate-pulse" size={24} />
        </div>

        {/* QUICK GRID ACTIONS (4 Column) */}
        <div className="grid grid-cols-4 gap-2.5">
          <button 
            onClick={() => setShowAddressModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/80 transition cursor-pointer text-center space-y-1.5"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <MapPin size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Saved Address</span>
          </button>
          
          <button 
            onClick={() => setShowPaymentsModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/80 transition cursor-pointer text-center space-y-1.5"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <CreditCard size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Payment Modes</span>
          </button>
          
          <button 
            onClick={() => setShowRefundsModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/80 transition cursor-pointer text-center space-y-1.5"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Undo2 size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">My Refunds</span>
          </button>
          
          <button 
            onClick={() => setShowWalletModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/80 transition cursor-pointer text-center space-y-1.5"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Wallet size={16} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Gourmet Money</span>
          </button>
        </div>

        {/* OPTIONS LIST */}
        <div className="rounded-2xl border border-slate-850 bg-slate-900/20 overflow-hidden divide-y divide-slate-850/80">
          
          {/* Gourmet HDFC Credit Card Co-Brand Card */}
          <div className="p-4 hover:bg-slate-900/30 transition flex items-center justify-between cursor-pointer group">
            <div className="flex items-center space-x-3.5">
              <div className="text-orange-500">
                <CreditCard size={16} />
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white transition">Gourmet HDFC Bank Credit Card</p>
                <p className="text-[10px] text-slate-400">Get 5% cashback on every meal order</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition" />
          </div>

          {/* Vouchers Modal Trigger */}
          <div 
            onClick={() => setShowVouchersModal(true)}
            className="p-4 hover:bg-slate-900/30 transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="text-orange-500">
                <Tag size={16} />
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white transition">My Vouchers & Offers</p>
                <p className="text-[10px] text-slate-400">View available coupons and codes</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition" />
          </div>

          {/* Account Statements print trigger */}
          <div 
            onClick={downloadStatement}
            className="p-4 hover:bg-slate-900/30 transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="text-orange-500">
                <FileText size={16} />
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white transition">Account Statements</p>
                <p className="text-[10px] text-slate-400">Print or view complete order statements</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition" />
          </div>

          {/* Favourites list */}
          <div 
            onClick={() => setShowFavsModal(true)}
            className="p-4 hover:bg-slate-900/30 transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="text-orange-500">
                <Heart size={16} />
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white transition">Favourites</p>
                <p className="text-[10px] text-slate-400">Quick list of your highly rated dishes</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition" />
          </div>

          {/* Contact toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="text-orange-500">
                <Smartphone size={16} />
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-bold text-slate-200">Allow restaurants to contact you</p>
                <p className="text-[10px] text-slate-400">Secure calls for delivery assistance</p>
              </div>
            </div>
            <button 
              onClick={() => setAllowContact(!allowContact)} 
              className="text-orange-500 hover:text-orange-400 transition cursor-pointer"
            >
              {allowContact ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-slate-600" />}
            </button>
          </div>

        </div>

        {/* BROWSE PAST ORDERS SHORTCUT */}
        <button 
          onClick={() => navigate('/orders')}
          className="w-full py-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 transition rounded-xl text-xs font-black tracking-wider uppercase text-orange-400 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
        >
          <ShoppingBag size={14} />
          <span>Browse Past Orders</span>
        </button>

      </div>

      {/* ========================================================
          MODAL OVERLAYS (Responsive, Bottom-sheet styling)
          ======================================================== */}
      
      {/* 1. SAVED ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <MapPin size={16} className="text-orange-500" />
                <span>Saved Addresses</span>
              </h3>
              <button onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {currentUser.addresses && currentUser.addresses.length > 0 ? (
                <div className="space-y-3">
                  {currentUser.addresses.map((address, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-x-2">
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-300">Address Location {idx + 1}</p>
                        <p className="text-slate-400 leading-relaxed">{address}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAddress(address)}
                        className="text-slate-500 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No saved addresses found.</p>
              )}

              {/* Add address subform */}
              <form onSubmit={handleAddAddress} className="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300">Add New Address</h4>
                  <button 
                    type="button" 
                    onClick={handleDetectGPS}
                    disabled={gpsLoading}
                    className="text-[10px] font-black text-orange-400 hover:text-orange-300 transition"
                  >
                    {gpsLoading ? 'Locating...' : 'Use Current GPS'}
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    required
                    placeholder="E.g., Flat 2B, Sunshine Residency"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAYMENT MODES MODAL */}
      {showPaymentsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <CreditCard size={16} className="text-orange-500" />
                <span>Saved Payment Modes</span>
              </h3>
              <button onClick={() => setShowPaymentsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {paymentCards.map(card => (
                <div key={card.id} className="flex justify-between items-center p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-7 bg-slate-900 rounded border border-slate-800 flex items-center justify-center font-black text-[9px] text-slate-400">
                      {card.type}
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-200">{card.bank} •••• {card.last4}</p>
                      <p className="text-[10px] text-slate-400">Expires {card.expiry}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPaymentCards(prev => prev.filter(c => c.id !== card.id))}
                    className="text-slate-500 hover:text-red-500 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddCard} className="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-slate-300">Add New Card</h4>
                <input 
                  type="text" 
                  maxLength={16}
                  required
                  placeholder="Card Number"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="Bank Name"
                    value={newCardBank}
                    onChange={(e) => setNewCardBank(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <input 
                    type="text" 
                    maxLength={5}
                    required
                    placeholder="MM/YY"
                    value={newCardExpiry}
                    onChange={(e) => setNewCardExpiry(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Link Card
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. MY REFUNDS MODAL */}
      {showRefundsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <Undo2 size={16} className="text-orange-500" />
                <span>My Refunds Logs</span>
              </h3>
              <button onClick={() => setShowRefundsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {refundsList.map(refund => (
                <div key={refund.id} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-slate-200">{refund.id}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      refund.status === 'REFUNDED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {refund.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <p>Order ID: {refund.orderId} • {refund.date}</p>
                    <p className="font-extrabold text-slate-200">₹{refund.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. GOURMET MONEY / WALLET MODAL */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <Wallet size={16} className="text-orange-500" />
                <span>Gourmet Money Wallet</span>
              </h3>
              <button onClick={() => setShowWalletModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Wallet Card Design */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 border border-slate-800 shadow-inner text-center space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Available Wallet Balance</p>
                <h2 className="text-3xl font-black text-white">₹{currentUser.walletBalance || 0}</h2>
                <p className="text-[10px] text-emerald-400">Safe, secure, instant 1-click checkout</p>
              </div>

              {/* Add money form */}
              <form onSubmit={handleAddWalletMoney} className="space-y-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-slate-300">Add Balance to Wallet</h4>
                <div className="flex space-x-2">
                  <div className="relative flex-grow">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                    <input 
                      type="number" 
                      required
                      placeholder="Enter amount (e.g. 500)"
                      value={walletAddAmount}
                      onChange={(e) => setWalletAddAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Add Money
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. VOUCHERS MODAL */}
      {showVouchersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <Tag size={16} className="text-orange-500" />
                <span>My Active Vouchers & Coupons</span>
              </h3>
              <button onClick={() => setShowVouchersModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="p-4 bg-slate-950 border border-slate-805/80 rounded-xl flex justify-between items-center">
                  <div className="space-y-1.5 text-left">
                    <span className="bg-orange-500/10 text-orange-400 font-extrabold text-[10px] px-2 py-0.5 rounded border border-orange-500/20">
                      {coupon.code}
                    </span>
                    <p className="text-xs font-bold text-slate-200 mt-1">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </p>
                    <p className="text-[9px] text-slate-500">Min. order subtotal: ₹{coupon.minSubtotal}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(coupon.code)}
                    className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-black rounded-lg transition cursor-pointer text-orange-400 hover:text-orange-300"
                  >
                    {copiedCoupon === coupon.code ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. FAVOURITES MODAL */}
      {showFavsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-800 p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                <Heart size={16} className="text-orange-500" />
                <span>My Favourites Dishes</span>
              </h3>
              <button onClick={() => setShowFavsModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {favProducts.map(product => (
                <div key={product.id} className="flex space-x-3 p-3 bg-slate-950 border border-slate-800 rounded-xl items-center">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                  />
                  <div className="flex-grow text-left space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">{product.name}</p>
                    <p className="text-[10px] text-orange-400 font-extrabold">₹{product.price}</p>
                  </div>
                  <button 
                    onClick={() => {
                      addToCart(product);
                      alert(`${product.name} added to cart!`);
                    }}
                    className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-[10px] text-white font-extrabold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus size={10} />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
