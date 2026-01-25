
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
    Archive, Edit2, Check, X, AlertCircle, 
    Search, ClipboardList, Wallet, Plus, TrendingDown
} from 'lucide-react';
import { Ingredient } from '../types';

const Stocks: React.FC = () => {
  const { 
      ingredients, addIngredient, updateIngredient, 
      adjustStock, movements 
  } = useStore();
  
  const [activeSubTab, setActiveSubTab] = useState<'LIST' | 'MOVEMENTS'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Quick Add
  const [newIng, setNewIng] = useState({ name: '', unit: 'kg', minStock: 0 });

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Ingredient>>({});

  const kpis = useMemo(() => {
      const totalValue = ingredients.reduce((sum, i) => sum + (i.stock * i.averageCost), 0);
      const alerts = ingredients.filter(i => i.stock <= i.minStock).length;
      return { totalValue, alerts };
  }, [ingredients]);

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditValues({ name: ing.name, unit: ing.unit, minStock: ing.minStock });
  };

  const saveEdit = (id: string) => {
      updateIngredient(id, editValues);
      setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-black text-slate-900">Gestion des Stocks</h2>
            <p className="text-slate-500">Suivi des niveaux, inventaire et traçabilité des produits</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
                onClick={() => setActiveSubTab('LIST')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeSubTab === 'LIST' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <Archive size={16} /> Inventaire
            </button>
            <button
                onClick={() => setActiveSubTab('MOVEMENTS')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeSubTab === 'MOVEMENTS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
                <ClipboardList size={16} /> Mouvements
            </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><Wallet size={28}/></div>
              <div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Valeur du Stock Réel</p>
                  <p className="text-2xl font-black text-slate-900">{kpis.totalValue.toFixed(2)} €</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${kpis.alerts > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                  <AlertCircle size={28}/>
              </div>
              <div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Alertes de Rupture</p>
                  <p className={`text-2xl font-black ${kpis.alerts > 0 ? 'text-red-600' : 'text-slate-900'}`}>{kpis.alerts} références</p>
              </div>
          </div>
      </div>

      {activeSubTab === 'LIST' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Rechercher une référence..." 
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-950 font-bold"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Référence</th>
                                <th className="p-4">Quantité en Stock</th>
                                <th className="p-4">Seuil Alerte</th>
                                <th className="p-4">Coût PMP</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredIngredients.map(ing => {
                                const isEditing = editingId === ing.id;
                                const stockPercent = Math.min((ing.stock / (ing.minStock * 2 || 1)) * 100, 100);
                                const isLow = ing.stock <= ing.minStock;

                                return (
                                    <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            {isEditing ? (
                                                <input className="border border-slate-300 rounded-lg p-2 w-full font-bold text-slate-950" value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})}/>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-950">{ing.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight">UNITE: {ing.unit}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex justify-between text-xs font-black">
                                                    <span className={isLow ? 'text-red-600' : 'text-emerald-600'}>{ing.stock.toFixed(2)} {ing.unit}</span>
                                                    <span className="text-slate-400">{(stockPercent).toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                                        style={{ width: `${stockPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {isEditing ? (
                                                <input type="number"
                                                    step="0.001"
                                                    className="border border-slate-300 rounded-lg p-2 w-20 font-bold text-slate-950"
                                                    value={editValues.minStock}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => setEditValues({...editValues, minStock: e.target.value === '' ? 0 : parseFloat(e.target.value)})}/>
                                            ) : (
                                                <span className="text-slate-950 font-black">{ing.minStock} {ing.unit}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-black text-slate-900">
                                            {ing.averageCost.toFixed(2)} €
                                        </td>
                                        <td className="p-4 text-right">
                                            {isEditing ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => saveEdit(ing.id)} className="text-emerald-600 bg-emerald-50 p-2 rounded-lg"><Check size={18}/></button>
                                                    <button onClick={() => setEditingId(null)} className="text-red-500 bg-red-50 p-2 rounded-lg"><X size={18}/></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(ing)} className="text-slate-300 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all">
                                                    <Edit2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-3">
                        <Plus className="text-emerald-500" size={20}/> Nouvel Ingrédient
                    </h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nom de la référence</label>
                            <input 
                                type="text" placeholder="Ex: Farine de Blé T55" className="w-full p-4 border border-slate-200 rounded-2xl text-slate-950 font-bold bg-slate-50 outline-none"
                                value={newIng.name} onChange={e => setNewIng({...newIng, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unité</label>
                                <select 
                                    className="w-full p-4 border border-slate-200 rounded-2xl text-slate-950 font-black bg-slate-50 outline-none"
                                    value={newIng.unit} onChange={e => setNewIng({...newIng, unit: e.target.value as any})}
                                >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="L">Litres</option>
                                    <option value="piece">pièce</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Seuil Alerte</label>
                                <input
                                    type="number" step="0.001" placeholder="0.0" className="w-full p-4 border border-slate-200 rounded-2xl text-slate-950 font-black bg-slate-50 outline-none"
                                    value={newIng.minStock || 0}
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => setNewIng({...newIng, minStock: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => { if(newIng.name) { addIngredient(newIng as any); setNewIng({ name: '', unit: 'kg', minStock: 0 }); } }}
                            className="w-full bg-slate-950 text-white py-4 rounded-2xl hover:bg-black font-black text-lg shadow-xl transition-all active:scale-[0.98] mt-2"
                        >
                            Créer la Fiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-slate-900 flex items-center gap-3">
                    <ClipboardList size={24} className="text-emerald-600"/> Historique des Mouvements
                </h3>
            </div>
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Produit</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Référence</th>
                        <th className="p-4 text-right">Variation</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {movements.slice().reverse().map(m => {
                        const ing = ingredients.find(i => i.id === m.ingredientId);
                        return (
                            <tr key={m.id} className="hover:bg-slate-50">
                                <td className="p-4 text-sm text-slate-500 font-medium">
                                    {new Date(m.date).toLocaleString()}
                                </td>
                                <td className="p-4 font-black text-slate-950">{ing?.name || 'Inconnu'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        m.type === 'SALE' ? 'bg-orange-100 text-orange-700' :
                                        m.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {m.type}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-400 font-black font-mono">
                                    {m.documentRef || '-'}
                                </td>
                                <td className={`p-4 text-right font-black text-lg ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {m.quantity > 0 ? '+' : ''}{m.quantity.toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {movements.length === 0 && (
                <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest opacity-40 italic">Aucun mouvement en base</div>
            )}
        </div>
      )}
    </div>
  );
};

export default Stocks;
