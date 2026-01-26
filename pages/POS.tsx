
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Product, OrderItem, Order, Partner } from '../shared/types';
import { ShoppingCart, Trash2, ImageOff, ShoppingBag, MessageSquare, Utensils, Printer, AlertTriangle, User, Search, Star, X } from 'lucide-react';
import { printOrder } from '../shared/services/printer';

const POS: React.FC = () => {
  const { products, createOrder, partners, ingredients, restaurant, orders } = useStore();
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tableName, setTableName] = useState<string>('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<Partner | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [custSearch, setCustSearch] = useState('');

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNoteItemIndex, setCurrentNoteItemIndex] = useState<number | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const filteredProducts = products.filter(p => selectedCategory === 'All' || p.category === selectedCategory);
  
  const filteredCustomers = useMemo(() => {
    const search = custSearch.toLowerCase().trim();
    if (!search) return []; 
    return (partners || []).filter(p => 
        p.type === 'CLIENT' && (
            p.name.toLowerCase().includes(search) || 
            (p.phone && p.phone.includes(search)) || 
            (p.email && p.email.toLowerCase().includes(search))
        )
    );
  }, [partners, custSearch]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getProductStockStatus = (product: Product) => {
      if (!product.recipe || product.recipe.length === 0) return 'OK';
      let status: 'OK' | 'LOW' | 'OUT' = 'OK';
      for (const item of product.recipe) {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          if (!ing) continue;
          if (ing.stock <= 0) return 'OUT';
          if (ing.stock < ing.minStock) status = 'LOW';
      }
      return status;
  };

  const addToCart = (product: Product) => {
      const status = getProductStockStatus(product);
      if (status === 'OUT') {
          if(!confirm("Produit en rupture. Ajouter quand même ?")) return;
      }
      setCart(prev => {
          const existingIndex = prev.findIndex(i => i.productId === product.id && !i.note);
          if (existingIndex > -1) {
              const newCart = [...prev];
              newCart[existingIndex].quantity += 1;
              return newCart;
          }
          return [...prev, { productId: product.id, name: product.name, price: product.price, vatRate: product.vatRate, quantity: 1 }];
      });
  };

  const removeFromCart = (index: number) => {
      setCart(prev => prev.filter((_, i) => i !== index));
  };

  const saveNote = () => {
      if (currentNoteItemIndex !== null) {
          setCart(prev => prev.map((item, i) => i === currentNoteItemIndex ? { ...item, note: currentNoteText } : item));
      }
      setNoteModalOpen(false);
  }

  const handleSendOrder = async () => {
      if (cart.length > 0) {
          const finalTableName = tableName || "Comptoir";
          const orderId = await createOrder(cart, finalTableName, selectedCustomer?.id);

          // Impression automatique ticket cuisine
          if (orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
              printOrder(order, restaurant.name, 'kitchen').catch(err =>
                console.error('[POS] Print failed:', err)
              );
            }
          }

          setCart([]);
          setTableName('');
          setSelectedCustomer(null);
      }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
        <div className="p-4 border-b flex flex-col gap-4 bg-slate-50/30">
            <div className="flex justify-between items-center">
                <div className="w-1/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Comptoir / Table</label>
                    <div className="flex items-center gap-2">
                        <Utensils className="text-emerald-600" size={20}/>
                        <input
                            type="text"
                            placeholder="N° Table ou Emporter..."
                            className="w-full p-2 border-b border-slate-200 outline-none font-black text-slate-900 bg-transparent"
                            value={tableName} onChange={e => setTableName(e.target.value)}
                        />
                    </div>
                </div>

                {/* Customer Selector */}
                <div className="flex-1 max-w-sm ml-4 relative">
                    {selectedCustomer ? (
                        <div className="bg-emerald-600 text-white p-2 rounded-xl flex justify-between items-center animate-in zoom-in-95">
                            <div className="flex items-center gap-2">
                                <Star size={16} className="fill-white"/>
                                <div>
                                    <p className="text-xs font-black leading-none">{selectedCustomer.name}</p>
                                    <p className="text-[10px] font-bold opacity-80">{selectedCustomer.loyaltyPoints} pts</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-white/20 rounded transition-colors"><X size={14}/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                            className="w-full flex items-center justify-between gap-2 p-2 border rounded-xl bg-white text-slate-500 text-sm hover:border-emerald-500 transition-all font-bold"
                        >
                            <span className="flex items-center gap-2"><User size={16}/> Lier un Client</span>
                            <Search size={14}/>
                        </button>
                    )}

                    {showCustomerSearch && !selectedCustomer && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl z-50 p-4 animate-in slide-in-from-top-2">
                            <div className="mb-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rechercher Client</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                    <input
                                        type="text" placeholder="Nom, Tel ou Email..." className="w-full pl-9 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-950 font-black"
                                        value={custSearch} onChange={e => setCustSearch(e.target.value)} autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                                {filteredCustomers.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustSearch(''); }}
                                        className="w-full text-left p-3 hover:bg-emerald-50 rounded-xl flex justify-between items-center border border-transparent hover:border-emerald-100 transition-all"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm text-slate-900">{c.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{c.phone || c.email}</span>
                                        </div>
                                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">{c.loyaltyPoints} pts</span>
                                    </button>
                                ))}
                                {custSearch.length > 0 && filteredCustomers.length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Aucun client trouvé</p>}
                                {custSearch.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4 font-black uppercase tracking-widest">Saisissez un critère...</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-950 text-white shadow-xl scale-105' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 no-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => {
                    const stockStatus = getProductStockStatus(p);
                    return (
                        <button key={p.id} onClick={() => addToCart(p)}
                            className={`bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-44 group relative transition-all active:scale-95 hover:shadow-xl hover:border-emerald-200 ${stockStatus === 'OUT' ? 'opacity-60' : ''}`}>
                            <div className="h-28 w-full bg-slate-100 relative">
                                 {p.image ? <img src={p.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageOff size={24} /></div>}
                                 <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-xs font-black px-2.5 py-1.5 rounded-xl shadow-lg border border-emerald-500/50">{p.price.toFixed(2)} €</span>
                                 {stockStatus === 'LOW' && <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg"><AlertTriangle size={8}/> STOCK BAS</span>}
                            </div>
                            <div className="p-3 flex items-center justify-center flex-1">
                                 <span className="font-black text-slate-900 text-[11px] text-center line-clamp-2 uppercase tracking-tight">{p.name}</span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
            <h3 className="font-black text-lg flex items-center gap-2 uppercase tracking-tighter"><ShoppingBag size={20}/> Panier de vente</h3>
            {selectedCustomer && <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full">+ {Math.floor(totalAmount)} PTS</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart size={40} className="text-slate-400"/>
                    </div>
                    <p className="font-black uppercase text-xs tracking-[0.2em]">Sélectionnez des articles</p>
                </div>
            )}
            {cart.map((item, idx) => (
                <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-start">
                        <div className="cursor-pointer flex-1" onClick={() => { setCurrentNoteItemIndex(idx); setCurrentNoteText(item.note || ''); setNoteModalOpen(true); }}>
                            <p className="font-black text-slate-950 text-sm leading-tight">{item.quantity}x {item.name}</p>
                            {item.note && <p className="text-[10px] text-orange-600 font-black flex items-center gap-1 mt-1 uppercase"><MessageSquare size={10} /> {item.note}</p>}
                        </div>
                        <div className="flex items-center gap-3 ml-2">
                            <span className="font-black text-slate-950 text-sm">{(item.quantity * item.price).toFixed(2)}€</span>
                            <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-6 bg-slate-50 border-t space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Montant Total</span>
                <span className="text-3xl font-black text-slate-950 tracking-tighter">{totalAmount.toFixed(2)} €</span>
            </div>
            <button onClick={handleSendOrder} disabled={cart.length === 0}
                className="w-full bg-emerald-600 text-white py-5 rounded-[20px] font-black text-lg hover:bg-emerald-500 disabled:opacity-20 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 active:scale-95">
                <Printer size={20} /> ENVOYER EN CUISINE
            </button>
        </div>
      </div>

      {noteModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
              <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-[0_30px_60px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
                  <h3 className="font-black text-xl mb-4 text-slate-900 uppercase tracking-tight">Note de préparation</h3>
                  <textarea 
                    className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 text-slate-900 font-bold mb-6 h-32 resize-none outline-none focus:border-emerald-500 transition-all"
                    placeholder="Ex: Sans oignons, sauce à part..." 
                    value={currentNoteText} 
                    onChange={e => setCurrentNoteText(e.target.value)} 
                    autoFocus 
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setNoteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs tracking-widest">Annuler</button>
                      <button onClick={saveNote} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">Valider</button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @media print {
            @page { size: 80mm auto; margin: 0; }
            body * { visibility: hidden; }
            .print-ticket, .print-ticket * { visibility: visible; }
            .print-ticket { position: absolute; left: 0; top: 0; width: 80mm; font-family: monospace; }
        }
      `}</style>
    </div>
  );
};

export default POS;
