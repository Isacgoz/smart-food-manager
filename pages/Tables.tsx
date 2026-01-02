import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, MapPin } from 'lucide-react';

const Tables: React.FC = () => {
  const { tables, addTable, deleteTable } = useStore();
  const [newTable, setNewTable] = useState({ name: '', seats: 4 });

  const handleAdd = () => {
    if(newTable.name) {
      addTable(newTable);
      setNewTable({ name: '', seats: 4 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-slate-900">Configuration Salle</h2>
        <p className="text-sm text-slate-500 mb-4">
            Définissez ici les tables ou zones de consommation. Ces noms apparaitront lors de la prise de commande à titre informatif.
        </p>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nom Table / Zone</label>
            <input type="text" className="w-full p-2 border rounded text-slate-900" placeholder="T1, Terrasse, Bar..." value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} />
          </div>
          <div className="w-32">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Couverts</label>
            <input type="number" className="w-full p-2 border rounded text-slate-900" value={newTable.seats} onChange={e => setNewTable({...newTable, seats: parseInt(e.target.value)})} />
          </div>
          <button onClick={handleAdd} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 flex items-center gap-2">
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {tables.map(t => (
          <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative group hover:border-emerald-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <MapPin className="text-emerald-600" size={20} />
                <button 
                    onClick={() => { if(confirm('Supprimer cette table ?')) deleteTable(t.id); }}
                    className="text-gray-300 hover:text-red-500"
                >
                    <Trash2 size={16} />
                </button>
            </div>
            <h3 className="font-bold text-lg text-slate-900">{t.name}</h3>
            <p className="text-sm text-slate-500">{t.seats} places</p>
          </div>
        ))}
        {tables.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                Aucune table configurée
            </div>
        )}
      </div>
    </div>
  );
};

export default Tables;