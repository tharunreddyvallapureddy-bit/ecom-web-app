import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDeliveryPartners } from '../../services/db';
import type { UserProfile } from '../../types';
import { Plus, UserCheck, ShieldAlert, Bike, Lock, Mail, User } from 'lucide-react';

const DeliveryTeamControl: React.FC = () => {
  const { provisionDeliveryPartner } = useAuth();
  const [riders, setRiders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form variables
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRegisterRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await provisionDeliveryPartner(email.trim(), password, name.trim());
      setSuccess(`Delivery partner "${name}" registered successfully!`);
      setName('');
      setEmail('');
      setPassword('');
      setShowForm(false);
      fetchRiders();
    } catch (err: any) {
      setError(err.message || 'Failed to create rider account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <div>
          <h2 className="text-base font-extrabold text-white">Delivery Partner Administration</h2>
          <p className="text-[10px] text-slate-500">Security Rule: Delivery Partners cannot sign up publicly. Provision login credentials here.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
        >
          <Plus size={14} />
          <span>{showForm ? 'Close Provisioner' : 'Provision Rider'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegisterRider} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Provision Rider Credentials</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center space-x-1.5">
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Rider Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2 text-slate-600" size={14} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rider"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2 text-slate-600" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rider@delivery.com"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2 text-slate-600" size={14} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            {isSubmitting ? 'Registering...' : 'Provision Login Account'}
          </button>
        </form>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg flex items-center space-x-1.5">
          <UserCheck size={14} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : riders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {riders.map(rider => (
            <div key={rider.uid} className="glass p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700/80 transition duration-200">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-orange-500">
                  <Bike size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-200">{rider.name}</h4>
                  <span className="inline-block bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded mt-0.5 font-mono">
                    {rider.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-3 text-slate-500">
                <span>Rider Status:</span>
                <span className={`font-semibold uppercase text-[10px] ${
                  rider.partnerStatus === 'delivering' ? 'text-purple-400 animate-pulse' : 'text-slate-400'
                }`}>
                  {rider.partnerStatus || 'idle'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No delivery partners provisioned yet.
        </div>
      )}
    </div>
  );
};

export default DeliveryTeamControl;
