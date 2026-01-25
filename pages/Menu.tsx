
import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Product, RecipeItem } from '../types';
import { Trash2, Plus, Calculator, Image as ImageIcon, Edit, X, Save, Upload } from 'lucide-react';

const Menu: React.FC = () => {
  const { products, ingredients, addProduct, updateProduct, deleteProduct } = useStore();
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [editMode, setEditMode] = useState(false);
  const [customVat, setCustomVat] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: 'Plats', price: 0, vatRate: 10, recipe: [], image: ''
  });
  
  // Helper for recipe builder
  const [tempRecipeItem, setTempRecipeItem] = useState({ ingredientId: '', quantity: 0 });

  const calculateCost = (recipe: RecipeItem[]) => {
    if (!recipe || recipe.length === 0) {
      return 0;
    }
    return recipe.reduce((total, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        return total + (ing ? ing.averageCost * item.quantity : 0);
    }, 0);
  };

  const currentCost = calculateCost(formData.recipe || []);
  const margin = (formData.price || 0) / (1 + (formData.vatRate||0)/100) - currentCost;

  const handleEdit = (product: Product) => {
      setFormData(product);
      setEditMode(true);
      setCustomVat(![5.5, 10, 20].includes(product.vatRate));
      setView('FORM');
  };

  const handleSave = () => {
      if(formData.name && formData.price !== undefined) {
          if (editMode && formData.id) {
              updateProduct(formData as Product);
          } else {
              addProduct({
                  ...formData,
                  recipe: formData.recipe || []
              } as Product);
          }
          resetForm();
      }
  };

  const resetForm = () => {
      setView('LIST');
      setEditMode(false);
      setCustomVat(false);
      setFormData({ name: '', category: 'Plats', price: 0, vatRate: 10, recipe: [], image: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Produits & Recettes</h2>
        <button 
            onClick={() => { resetForm(); setView('FORM'); }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
        >
            + Nouveau Produit
        </button>
      </div>

      {view === 'LIST' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="p-4 font-bold text-slate-700">Produit</th>
                        <th className="p-4 font-bold text-slate-700">Catégorie</th>
                        <th className="p-4 font-bold text-slate-700">Prix TTC</th>
                        <th className="p-4 font-bold text-slate-700">Coût Matière</th>
                        <th className="p-4 font-bold text-slate-700">Marge Est.</th>
                        <th className="p-4 font-bold text-slate-700 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products.map(p => {
                        const cost = calculateCost(p.recipe);
                        const pMargin = (p.price / (1 + p.vatRate/100)) - cost;
                        return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center text-gray-400">
                                            {p.image ? (
                                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={18} />
                                            )}
                                        </div>
                                        <span className="font-medium text-slate-900">{p.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600 text-sm">{p.category}</td>
                                <td className="p-4 font-bold text-slate-900">{p.price.toFixed(2)} €</td>
                                <td className="p-4 text-slate-500">{cost.toFixed(2)} €</td>
                                <td className={`p-4 font-bold ${pMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {pMargin.toFixed(2)} €
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => { if(confirm('Supprimer ?')) deleteProduct(p.id); }} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {products.length === 0 && <div className="p-12 text-center text-slate-400 italic">Aucun produit au menu. Commencez par en ajouter un !</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Left: Basic Info */}
            <div className="space-y-6 bg-white p-8 rounded-3xl border border-gray-200 shadow-xl text-slate-900">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-2xl text-slate-900">{editMode ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
                    <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={28} />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nom du produit</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none bg-slate-50 font-bold text-slate-950 placeholder:text-slate-300" 
                            type="text" value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="Ex: Burger Gourmet Double" />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image du produit</label>
                        <div className="flex gap-4 items-center">
                            <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group hover:border-emerald-500 transition-colors">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={32} className="text-slate-300"/>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-black hover:bg-black transition-all shadow-lg"
                                >
                                    <Upload size={18}/> Sélectionner une photo
                                </button>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Format supportés : JPG, PNG (Max 5Mo)</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catégorie</label>
                            <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-950 outline-none" 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option>Plats</option>
                                <option>Boissons</option>
                                <option>Desserts</option>
                                <option>Menus</option>
                                <option>Entrées</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TVA (%)</label>
                            <div className="flex gap-2">
                                {!customVat ? (
                                    <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-950 outline-none" 
                                        value={formData.vatRate} 
                                        onChange={e => {
                                            if(e.target.value === 'custom') setCustomVat(true);
                                            else setFormData({...formData, vatRate: Number(e.target.value)});
                                        }}>
                                        <option value="5.5">5.5% (Alim)</option>
                                        <option value="10">10% (Sur place)</option>
                                        <option value="20">20% (Alcool)</option>
                                        <option value="custom">Perso...</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-950 outline-none"
                                            value={formData.vatRate}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setFormData({...formData, vatRate: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                                            placeholder="%"
                                        />
                                        <button onClick={() => setCustomVat(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prix de vente TTC (€)</label>
                        <input className="w-full p-4 border border-slate-200 rounded-2xl text-2xl font-black text-slate-950 bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-500/10"
                            type="number" step="0.01"
                            value={formData.price}
                            onFocus={(e) => e.target.select()}
                            onChange={e => setFormData({...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} />
                    </div>
                </div>

                <div className="pt-6 border-t mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Coût Matière estimé:</span>
                        <span className="font-black text-slate-900 text-lg">{currentCost.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                        <span className="text-emerald-700 font-black uppercase text-[10px] tracking-widest">Marge Brute:</span>
                        <span className={`font-black text-2xl ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{margin.toFixed(2)} €</span>
                    </div>
                </div>

                 <button onClick={handleSave} className="w-full bg-slate-950 text-white py-5 rounded-3xl hover:bg-black font-black text-xl mt-6 transition-all flex justify-center gap-3 items-center shadow-2xl shadow-slate-300 active:scale-[0.98]">
                    <Save size={24} />
                    {editMode ? 'Mettre à jour le produit' : 'Valider le Produit'}
                </button>
            </div>

            {/* Right: Recipe Builder */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl flex flex-col h-full text-slate-900">
                <h3 className="font-black text-2xl text-slate-900 mb-6 flex items-center gap-3">
                    <Calculator size={32} className="text-blue-500"/> Fiche Technique
                </h3>
                
                {/* Ingredients List in Recipe */}
                <div className="flex-1 overflow-y-auto mb-6 bg-slate-50 rounded-[32px] p-6 border border-slate-100 min-h-[400px]">
                    {formData.recipe?.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                                <Calculator size={64} className="opacity-20"/>
                            </div>
                            <p className="font-black text-sm uppercase tracking-widest text-center opacity-40">Aucun ingrédient<br/>dans la recette.</p>
                        </div>
                    )}
                    {formData.recipe?.map((item, idx) => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        return (
                            <div key={idx} className="flex justify-between items-center p-4 bg-white mb-3 rounded-2xl shadow-sm border border-slate-100 group animate-in slide-in-from-right-4">
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-900">{ing?.name}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.quantity} {ing?.unit} ({(ing?.averageCost || 0) * item.quantity}€)</span>
                                </div>
                                <button 
                                    onClick={() => setFormData({...formData, recipe: formData.recipe?.filter((_, i) => i !== idx)})}
                                    className="text-slate-200 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Add Ingredient to Recipe */}
                <div className="border-t pt-6 space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ajouter un ingrédient au stock</label>
                    <div className="flex flex-col gap-3">
                        <select
                            className="w-full p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 text-slate-950 font-black outline-none"
                            value={tempRecipeItem.ingredientId}
                            onChange={e => setTempRecipeItem({...tempRecipeItem, ingredientId: e.target.value})}
                        >
                            <option value="">Sélectionner un ingrédient...</option>
                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                        </select>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quantité (Unité)</label>
                                <input
                                    type="number" step="0.001" className="w-full p-4 border border-slate-200 rounded-2xl text-sm text-slate-950 bg-slate-50 font-black outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="0"
                                    value={tempRecipeItem.quantity || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => setTempRecipeItem({...tempRecipeItem, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                                />
                            </div>
                             <button 
                                onClick={() => {
                                    if(tempRecipeItem.ingredientId && tempRecipeItem.quantity > 0) {
                                        setFormData({
                                            ...formData, 
                                            recipe: [...(formData.recipe || []), tempRecipeItem]
                                        });
                                        setTempRecipeItem({ ingredientId: '', quantity: 0 });
                                    }
                                }}
                                className="bg-blue-600 text-white px-8 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.95]"
                            >
                                <Plus size={32}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
