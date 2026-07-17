import React, { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../services/db';
import { Product } from '../../types';
import { Edit, Trash, Plus, Check, X, ShieldAlert, Eye, EyeOff, Flame } from 'lucide-react';

const MenuManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form variables
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(100);
  const [category, setCategory] = useState('Burgers');
  const [imageUrl, setImageUrl] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Pizzas', 'Burgers', 'Sides', 'Beverages'];

  const fetchMenu = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !price || !imageUrl) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');

    try {
      await addProduct({
        name,
        description,
        price,
        category,
        imageUrl,
        isPopular,
        inStock: true
      });
      
      // Reset form
      setName('');
      setDescription('');
      setPrice(100);
      setImageUrl('');
      setIsPopular(false);
      setShowAddForm(false);
      fetchMenu();
    } catch (err: any) {
      setError(err.message || 'Failed to add dish.');
    }
  };

  const handleToggleStock = async (productId: string, currentStock: boolean) => {
    try {
      await updateProduct(productId, { inStock: !currentStock });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePopular = async (productId: string, currentPopular: boolean) => {
    try {
      await updateProduct(productId, { isPopular: !currentPopular });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this dish from the digital menu?")) return;
    try {
      await deleteProduct(productId);
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <h2 className="text-base font-extrabold text-white">Menu Item Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1 cursor-pointer"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Close Editor' : 'Add New Dish'}</span>
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <form onSubmit={handleAddProduct} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">New Product Details</h3>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center space-x-1.5">
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dish Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Truffle Butter Paneer Burger"
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Price (INR)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Image URL</label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief details about chef special ingredients..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="accent-orange-500"
              />
              <label htmlFor="isPopular" className="text-xs font-bold text-slate-300 cursor-pointer">
                Tag as "Trending Now" / "Popular"
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Add to Menu
          </button>
        </form>
      )}

      {/* Menu Table list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Dish Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock status</th>
                <th className="py-3 px-4">Trending status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-slate-900/20 transition">
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-slate-800" />
                    <div>
                      <h4 className="font-bold text-slate-200">{product.name}</h4>
                      <p className="text-[10px] text-slate-500 max-w-[200px] truncate">{product.description}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-400">{product.category}</td>
                  <td className="py-4 px-4 font-bold text-white">₹{product.price}</td>
                  
                  {/* Stock Status toggle */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleStock(product.id, product.inStock)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                        product.inStock
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {product.inStock ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </button>
                  </td>

                  {/* Trending tag status */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleTogglePopular(product.id, product.isPopular)}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                        product.isPopular
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      <Flame size={12} />
                      <span>{product.isPopular ? 'Trending' : 'Standard'}</span>
                    </button>
                  </td>

                  {/* Delete Action */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleDelete(product.id)}
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
          Digital menu is empty. Add items to get started!
        </div>
      )}
    </div>
  );
};

export default MenuManager;
