import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/db';
import type { Product } from '../types';
import MenuCard from '../components/MenuCard';
import { Flame, BadgeCheck, UtensilsCrossed, Percent, Search, ArrowRight } from 'lucide-react';
import { isMockMode } from '../services/firebase';
import { useCart } from '../context/CartContext';

const Home: React.FC = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Pizzas', 'Burgers', 'Sides', 'Beverages'];

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Filter conditions
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Recomended Strips
  const trendingItems = products.filter(p => p.isPopular && p.inStock);
  const pocketFriendlyItems = products.filter(p => p.price <= 150 && p.inStock);
  
  // Custom paired items for "Frequently Ordered Together"
  // Pairing p1 (Paneer Burger) with p3 (Double Chocolate Shake)
  // Pairing p4 (Chicken Pizza) with p6 (Garlic Bread)
  const frequentlyOrderedTogether = products.filter(p => ['p1', 'p3', 'p4', 'p6'].includes(p.id) && p.inStock);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800/80 py-16 px-6 md:px-12 text-center md:text-left">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8 relative z-10">
          <div className="max-w-lg space-y-4">
            {isMockMode && (
              <span className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] uppercase font-extrabold px-3 py-1 rounded-full tracking-wider animate-pulse">
                Sandbox Demo Active
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Delivering Premium{' '}
              <span className="bg-gradient-to-r from-orange-400 to-amber-500 text-transparent bg-clip-text">
                Culinary Crafts
              </span>{' '}
              Straight to Your Door
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Order signature paneer burgers, classic margheritas, and thick milkshakes. Safe delivery with real-time GPS tracking.
            </p>
          </div>
          <div className="relative w-full max-w-sm flex items-center">
            <Search className="absolute left-4 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. paneer, pizza, fries)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-medium">Baking the digital menu...</p>
          </div>
        ) : (
          <>
            {/* 1. Trending Now Strip */}
            {trendingItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-900">
                  <Flame className="text-orange-500 animate-bounce" size={20} />
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Trending Now</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {trendingItems.slice(0, 3).map(product => (
                    <MenuCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Frequently Ordered Together Pairings */}
            {frequentlyOrderedTogether.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-900">
                  <BadgeCheck className="text-blue-400" size={20} />
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Frequently Ordered Together</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pair 1: Burger (p1) + Shake (p3) */}
                  <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-orange-500/20 transition group">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-4">
                        <img className="w-12 h-12 rounded-full border-2 border-slate-950 object-cover" src={products.find(p => p.id === 'p1')?.imageUrl} alt="Paneer Burger" />
                        <img className="w-12 h-12 rounded-full border-2 border-slate-950 object-cover" src={products.find(p => p.id === 'p3')?.imageUrl} alt="Shake" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Truffle Paneer Burger + Thick Shake combo</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">₹338 • Ultimate comfort food pairing</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const p1 = products.find(p => p.id === 'p1');
                        const p3 = products.find(p => p.id === 'p3');
                        if (p1) addToCart(p1);
                        if (p3) addToCart(p3);
                      }}
                      className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded-lg text-xs font-bold border border-orange-500/30 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Get Pair</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Pair 2: Pizza (p4) + Garlic Bread (p6) */}
                  <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-orange-500/20 transition group">
                    <div className="flex items-center space-x-4">
                      <div className="flex -space-x-4">
                        <img className="w-12 h-12 rounded-full border-2 border-slate-950 object-cover" src={products.find(p => p.id === 'p4')?.imageUrl} alt="Kebab Pizza" />
                        <img className="w-12 h-12 rounded-full border-2 border-slate-950 object-cover" src={products.find(p => p.id === 'p6')?.imageUrl} alt="Garlic Bread" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Spicy Kebab Pizza + Cheese Stuffed Garlic Bread</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">₹478 • Italian night special</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const p4 = products.find(p => p.id === 'p4');
                        const p6 = products.find(p => p.id === 'p6');
                        if (p4) addToCart(p4);
                        if (p6) addToCart(p6);
                      }}
                      className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded-lg text-xs font-bold border border-orange-500/30 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Get Pair</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Pocket-Friendly Deals Strip */}
            {pocketFriendlyItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-900">
                  <Percent className="text-emerald-400" size={20} />
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Pocket-Friendly Deals</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {pocketFriendlyItems.slice(0, 3).map(product => (
                    <MenuCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Main digital menu with categories */}
            <div className="space-y-6 pt-6 border-t border-slate-900">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <UtensilsCrossed className="text-orange-500" size={20} />
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Explore Full Menu</h2>
                </div>

                {/* Categories filter */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid List */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <MenuCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm">No dishes match your filters.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
