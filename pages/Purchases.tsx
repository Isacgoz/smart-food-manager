
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
    Plus, PackageCheck, ShoppingBag, AlertCircle
} from 'lucide-react';
import { SupplierOrder } from '../types';

const Purchases: React.FC = () => {
  const { 
      ingredients, partners, 
      supplierOrders, createSupplierOrder, receiveSupplierOrder 
  } = useStore();
  
  const suppliers = partners.filter(p => p.type === 'SUPPLIER');

  // Form States
  const [newOrder, setNewOrder] = useState<{supplierId: string, items: {ingredientId: string, qty: number, cost: number}[]}>({ supplierId: '', items: [] });
  const [tempOrderItem, setTempOrderItem] = useState({ ingredientId: '', qty: 0, cost: 0 });

  const handleCreateOrder = () => {
      if(newOrder.supplierId && newOrder.items.length > 0) {
          const totalCost = newOrder.items.reduce((acc, item) => acc + item.cost, 0);
          createSupplierOrder({
              supplierId: newOrder.supplierId,
              items: newOrder.items.map(i => ({ ingredientId: i.ingredientId, quantity: i.qty, cost: i.cost })),
              totalCost,
              date: new Date().toISOString()
          });
          setNewOrder({ supplierId: '', items: [] });
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header>
        <h2 className="text-3xl font-black text-slate-900">Achats & Réceptions</h2>
        <p className="text-slate-500">Gérez vos commandes fournisseurs et validez vos bons de réception (BR)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Passer une commande */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                <Plus className="text-blue-500" /> Nouvelle Commande (BC)
            </h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fournisseur</label>
                    <select 
                        className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-950 font-black outline-none"
                        value={newOrder.supplierId} onChange={e => setNewOrder({...newOrder, supplierId: e.target.value})}
                    >
                        <option value="">-- Sélectionner --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {suppliers.length === 0 && <p className="text-[10px] text-orange-600 mt-2 font-black uppercase flex items-center gap-2"><AlertCircle size={14}/> Créez d'abord un fournisseur dans "Partenaires"</p>}
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Lignes de commande</h4>
                    <div className="space-y-2 mb-6 max-h-48 overflow-y-auto no-scrollbar">
                        {newOrder.items.map((item, idx) => {
                            const ing = ingredients.find(i => i.id === item.ingredientId);
                            return (
                                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-2">
                                    <span className="font-black text-sm text-slate-900">{ing?.name}</span>
                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-tight">{item.qty} {ing?.unit} • {item.cost}€</span>
                                </div>
                            )
                        })}
                        {newOrder.items.length === 0 && <p className="text-center text-slate-300 font-bold text-xs py-4">Aucun article ajouté</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                         <div className="md:col-span-5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ingrédient</label>
                            <select
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white font-black text-slate-950"
                                value={tempOrderItem.ingredientId} onChange={e => setTempOrderItem({...tempOrderItem, ingredientId: e.target.value})}
                            >
                                <option value="">-- Sélectionner --</option>
                                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quantité</label>
                            <input type="text" inputMode="decimal" placeholder="0"
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white font-black text-slate-950"
                                value={typeof tempOrderItem.qty === 'number' ? tempOrderItem.qty : tempOrderItem.qty || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={e => {
                                    const val = e.target.value.replace(',', '.');
                                    if (val === '' || val.endsWith('.') || val.endsWith(',')) {
                                        setTempOrderItem({...tempOrderItem, qty: val as any});
                                    } else {
                                        const num = parseFloat(val);
                                        if (!isNaN(num)) setTempOrderItem({...tempOrderItem, qty: num});
                                    }
                                }}
                                onBlur={e => {
                                    const val = e.target.value.replace(',', '.');
                                    const num = val === '' ? 0 : parseFloat(val);
                                    if (!isNaN(num)) setTempOrderItem({...tempOrderItem, qty: num});
                                }} />
                         </div>
                         <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Prix Total HT</label>
                            <input type="text" inputMode="decimal" placeholder="0.00"
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white font-black text-slate-950"
                                value={typeof tempOrderItem.cost === 'number' ? tempOrderItem.cost : tempOrderItem.cost || ''}
                                onFocus={(e) => e.target.select()}
                                onChange={e => {
                                    const val = e.target.value.replace(',', '.');
                                    if (val === '' || val.endsWith('.') || val.endsWith(',')) {
                                        setTempOrderItem({...tempOrderItem, cost: val as any});
                                    } else {
                                        const num = parseFloat(val);
                                        if (!isNaN(num)) setTempOrderItem({...tempOrderItem, cost: num});
                                    }
                                }}
                                onBlur={e => {
                                    const val = e.target.value.replace(',', '.');
                                    const num = val === '' ? 0 : parseFloat(val);
                                    if (!isNaN(num)) setTempOrderItem({...tempOrderItem, cost: num});
                                }} />
                         </div>
                         <div className="md:col-span-2">
                            <button
                                onClick={() => { if(tempOrderItem.ingredientId && tempOrderItem.qty > 0) { setNewOrder({ ...newOrder, items: [...newOrder.items, tempOrderItem] }); setTempOrderItem({ ingredientId: '', qty: 0, cost: 0 }); } }}
                                className="w-full bg-slate-950 text-white p-3 rounded-xl hover:bg-black transition-all shadow-lg active:scale-90 flex items-center justify-center"
                                title="Ajouter à la commande"
                            ><Plus size={24}/></button>
                         </div>
                    </div>
                </div>

                <button 
                    onClick={handleCreateOrder}
                    disabled={newOrder.items.length === 0 || !newOrder.supplierId}
                    className="w-full bg-slate-950 text-white py-5 rounded-3xl hover:bg-black font-black text-xl disabled:opacity-30 transition-all shadow-2xl active:scale-[0.98]"
                >
                    Générer le Bon de Commande
                </button>
            </div>
        </div>

        {/* Historique et BR */}
        <div className="space-y-6">
            <h3 className="font-black text-2xl text-slate-900">Suivi des Livraisons (BR)</h3>
            <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2 no-scrollbar">
                {supplierOrders.slice().reverse().map(order => {
                    const sup = suppliers.find(s => s.id === order.supplierId);
                    const isPending = order.status === 'PENDING';
                    return (
                        <div key={order.id} className={`bg-white rounded-[32px] p-8 border transition-all ${isPending ? 'border-orange-300 shadow-xl ring-8 ring-orange-50/50 animate-in zoom-in-95' : 'border-slate-100 opacity-60 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="font-black text-slate-950 text-xl tracking-tight">{sup?.name || 'Inconnu'}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">ID: {order.id.substring(0,8)} • {new Date(order.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isPending ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {isPending ? 'En Attente Livr.' : 'Réceptionné'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Montant HT</p>
                                    <p className="font-black text-slate-950 text-xl">{order.totalCost.toFixed(2)} €</p>
                                </div>
                                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Articles</p>
                                    <p className="font-black text-slate-950 text-xl">{order.items.length} lignes</p>
                                </div>
                            </div>
                            {isPending && (
                                <button 
                                    onClick={() => { if(confirm('Valider la réception de tous les articles et mettre à jour le stock ?')) receiveSupplierOrder(order.id); }}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 font-black text-lg shadow-2xl shadow-emerald-100 transition-all active:scale-[0.98]"
                                >
                                    <PackageCheck size={24} /> Valider la Réception (BR)
                                </button>
                            )}
                        </div>
                    );
                })}
                {supplierOrders.length === 0 && (
                     <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-20 rounded-[40px] text-center">
                        <ShoppingBag size={64} className="mx-auto text-slate-200 mb-4 opacity-30" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Aucun flux d'achat détecté.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
