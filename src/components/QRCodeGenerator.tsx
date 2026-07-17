import React from 'react';
import { Smartphone, Info } from 'lucide-react';

interface QRCodeGeneratorProps {
  vpa: string;
  name: string;
  amount: number;
  txnId: string;
  onPaymentSimulated: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  vpa,
  name,
  amount,
  txnId,
  onPaymentSimulated,
}) => {
  // Generate standard UPI payload string
  const upiLink = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tr=${txnId}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0f172a&data=${encodeURIComponent(upiLink)}`;

  return (
    <div className="flex flex-col items-center space-y-4 p-5 glass-card rounded-xl border border-slate-700/50">
      <div className="text-center">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">UPI Dynamic Payment QR</h4>
        <p className="text-xs text-slate-400 mt-1">Scan using GPay, PhonePe, Paytm, or any banking app</p>
      </div>

      {/* QR Code Container */}
      <div className="bg-white p-4 rounded-lg shadow-inner relative flex items-center justify-center w-60 h-60">
        <img 
          src={qrCodeUrl} 
          alt="UPI QR Code" 
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Details Box */}
      <div className="w-full bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-500">Payee VPA:</span>
          <span className="font-mono text-white">{vpa}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Amount:</span>
          <span className="font-extrabold text-orange-400">₹{amount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Txn ID:</span>
          <span className="font-mono text-slate-400 truncate max-w-[120px]">{txnId}</span>
        </div>
      </div>

      {/* Mobile deep link action */}
      <div className="w-full">
        <a
          href={upiLink}
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm rounded-lg transition"
        >
          <Smartphone size={16} />
          <span>Pay via Native Banking App</span>
        </a>
      </div>

      {/* Info notice */}
      <div className="flex items-start space-x-2 text-[10px] text-slate-400 bg-slate-800/40 p-2.5 rounded border border-slate-800/60">
        <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <span>For local web browser verification, you can simulate a successful UPI transfer payment by clicking the button below:</span>
      </div>

      {/* Simulation Button */}
      <button
        onClick={onPaymentSimulated}
        className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs rounded-lg transition"
      >
        Simulate UPI Payment Success
      </button>
    </div>
  );
};

export default QRCodeGenerator;
