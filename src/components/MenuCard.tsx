import React, { useState } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Flame, EyeOff } from 'lucide-react';

interface MenuCardProps {
  product: Product;
}

const MenuCard: React.FC<MenuCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-lg group hover:border-orange-500/30 transition-all duration-300 flex flex-col h-full relative">
      {/* Popular/Trending Badge */}
      {product.isPopular && (
        <span className="absolute top-3 left-3 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-md">
          <Flame size={12} className="animate-pulse" />
          <span>Trending Now</span>
        </span>
      )}

      {/* Out of Stock overlay */}
      {!product.inStock && (
        <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center space-y-1 text-slate-400">
          <EyeOff size={24} />
          <span className="font-bold text-sm uppercase tracking-wider">Sold Out</span>
        </div>
      )}

      {/* Image Container */}
      <div className="h-44 overflow-hidden relative bg-slate-800">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-base text-white group-hover:text-orange-400 transition-colors">
              {product.name}
            </h3>
          </div>
          <span className="inline-block bg-slate-800 text-slate-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-1">
            {product.category}
          </span>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
          <div>
            <span className="text-xs text-slate-500">Price</span>
            <p className="font-extrabold text-lg text-white">₹{product.price}</p>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              added 
                ? 'bg-emerald-500 text-white scale-95' 
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10'
            }`}
          >
            <ShoppingCart size={14} />
            <span>{added ? 'Added!' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
