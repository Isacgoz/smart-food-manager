
import React, { useState } from 'react';
import { useStore } from '../store';
import { User } from '../shared/types';
import { Edit2, Trash2, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToast } from '../shared/hooks/useToast';

const Users: React.FC = () => {
    const { users, currentUser, addUser, updateUser, deleteUser } = useStore();
    const { notify } = useToast();

    // Form State
    const [formData, setFormData] = useState({ name: '', pin: '', role: 'SERVER' as User['role'] });
    const [editingId, setEditingId] = useState<string | null>(null);

    const resetForm = () => {
        setFormData({ name: '', pin: '', role: 'SERVER' });
        setEditingId(null);
    };

    const handleEdit = (user: User) => {
        setFormData({ name: user.name, pin: user.pin, role: user.role });
        setEditingId(user.id);
    };

    const handleSubmit = () => {
        if (!formData.name) {
            notify("Le nom est requis.", "error");
            return;
        }
        if (formData.pin.length < 4 || formData.pin.length > 6) {
            notify("Le Code PIN doit contenir entre 4 et 6 chiffres.", "error");
            return;
        }

        if (editingId) {
            updateUser(editingId, formData);
            notify("Utilisateur modifié avec succès", "success");
        } else {
            addUser(formData);
            notify("Utilisateur ajouté avec succès", "success");
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (id === currentUser?.id) {
            notify("Vous ne pouvez pas supprimer votre propre compte !", "error");
            return;
        }
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            deleteUser(id);
            notify("Utilisateur supprimé", "info");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-10">
            
            {/* --- TEAM MANAGEMENT --- */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600"/> Gestion Équipe
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* FORM */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900">{editingId ? 'Modifier Membre' : 'Ajouter un Membre'}</h3>
                            {editingId && (
                                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nom Complet</label>
                                <input type="text" placeholder="Ex: Jean Dupont" className="w-full p-2 border rounded text-slate-900"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Code PIN (4-6 chiffres)</label>
                                <input type="text" placeholder="Ex: 12345" className="w-full p-2 border rounded text-slate-900 font-mono tracking-widest" maxLength={6}
                                    value={formData.pin} onChange={e => {
                                        if(/^\d*$/.test(e.target.value)) setFormData({...formData, pin: e.target.value})
                                    }} />
                                 <p className="text-xs text-gray-500 mt-1">Utilisé pour la connexion POS</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rôle (Droits d'accès)</label>
                                <select className="w-full p-2 border rounded bg-white text-slate-900"
                                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                                    <option value="OWNER">Gérant (Accès Total + Admin)</option>
                                    <option value="MANAGER">Manager (Stocks + Menu + Caisse)</option>
                                    <option value="SERVER">Serveur (Caisse Uniquement)</option>
                                    <option value="COOK">Cuisinier (Stocks + Menu)</option>
                                </select>
                            </div>

                            <button onClick={handleSubmit} className={`w-full text-white py-3 rounded-lg font-bold transition-colors shadow-md ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                {editingId ? 'Mettre à jour' : 'Créer Utilisateur'}
                            </button>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm text-slate-600">
                            <ShieldAlert size={16} />
                            <span>Les codes PIN sont masqués pour la sécurité. Seul le gérant peut réinitialiser un code.</span>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-gray-100">
                                <tr>
                                    <th className="p-4 font-bold text-slate-700">Nom</th>
                                    <th className="p-4 font-bold text-slate-700">Rôle</th>
                                    <th className="p-4 font-bold text-slate-700">PIN</th>
                                    <th className="p-4 font-bold text-slate-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${editingId === u.id ? 'bg-blue-50' : ''}`}>
                                        <td className="p-4 font-medium text-slate-900">{u.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                                ${u.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 
                                                  u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-slate-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-slate-400">
                                            {Array(u.pin.length).fill('•').join('')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => handleEdit(u)} 
                                                    className="text-blue-500 hover:bg-blue-100 p-2 rounded transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(u.id)} 
                                                    className={`p-2 rounded transition-colors ${u.id === currentUser?.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`}
                                                    disabled={u.id === currentUser?.id}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Users;
