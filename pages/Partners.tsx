
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
    Users, Mail, Phone, Search, Star, Truck, Briefcase, 
    Heart, ChevronRight, UserPlus, X, Filter, Trash2
} from 'lucide-react';
import { Partner, PartnerType } from '../types';

const Partners: React.FC = () => {
    const { partners, addPartner, deletePartner } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<PartnerType | 'ALL'>('ALL');

    // Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPartner, setNewPartner] = useState<Omit<Partner, 'id'>>({ 
        name: '', type: 'CLIENT', email: '', phone: '', address: '', notes: '', loyaltyPoints: 0, totalSpent: 0 
    });

    const handleAdd = () => {
        if(newPartner.name) {
            addPartner(newPartner);
            setNewPartner({ name: '', type: 'CLIENT', email: '', phone: '', address: '', notes: '', loyaltyPoints: 0, totalSpent: 0 });
            setShowAddForm(false);
        }
    };

    const filteredPartners = useMemo(() => {
        const search = searchTerm.toLowerCase().trim();
        return (partners || []).filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search) || (p.phone && p.phone.includes(search)) || (p.email && p.email.toLowerCase().includes(search));
            const matchesFilter = filterType === 'ALL' || p.type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [partners, searchTerm, filterType]);

    const stats = useMemo(() => ({
        clients: (partners || []).filter(p => p.type === 'CLIENT').length,
        pros: (partners || []).filter(p => p.type !== 'CLIENT').length,
    }), [partners]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-950 tracking-tighter">Annuaire Partenaires</h2>
                    <p className="text-slate-600 font-bold mt-1 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-emerald-600"/> {stats.clients} Clients • {stats.pros} Professionnels
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all shadow-2xl active:scale-95"
                >
                    <UserPlus size={20} /> AJOUTER UN CONTACT
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Search & Filters */}
                <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-950 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="RECHERCHER : NOM, MOBILE OU EMAIL..." 
                            className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[24px] shadow-sm outline-none focus:border-slate-900 transition-all text-slate-950 font-black uppercase text-sm tracking-tight placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={e => setSearchTerm(setSearchTerm(e.target.value))}
                        />
                    </div>
                    <div className="flex gap-2 p-1.5 bg-white rounded-[24px] border-2 border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                        {[
                            { id: 'ALL', label: 'Tous', icon: Filter },
                            { id: 'CLIENT', label: 'Clients', icon: Heart, color: 'text-pink-500' },
                            { id: 'SUPPLIER', label: 'Fournisseurs', icon: Truck, color: 'text-blue-500' },
                            { id: 'MAINTENANCE', label: 'Maintenance', icon: Briefcase, color: 'text-orange-500' },
                            { id: 'OTHER', label: 'Autres', icon: Users, color: 'text-slate-500' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                    filterType === type.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <type.icon size={14} className={filterType === type.id ? 'text-white' : type.color} />
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Directory List */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPartners.map(p => (
                        <div key={p.id} className="bg-white p-8 rounded-[40px] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:border-slate-200 transition-all group relative animate-in zoom-in-95">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white font-black text-2xl shadow-lg ${
                                    p.type === 'CLIENT' ? 'bg-pink-600 shadow-pink-100' :
                                    p.type === 'SUPPLIER' ? 'bg-blue-600 shadow-blue-100' :
                                    p.type === 'MAINTENANCE' ? 'bg-orange-600 shadow-orange-100' : 'bg-slate-800'
                                }`}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Activité</span>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-700 tracking-tighter border border-slate-200">
                                        {p.type}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-slate-950 tracking-tighter leading-none">{p.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.address || 'Adresse non renseignée'}</p>
                            </div>

                            <div className="mt-8 space-y-3">
                                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">{p.email || 'Pas d\'email'}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">{p.phone || 'Pas de numéro'}</span>
                                </div>
                            </div>

                            {p.type === 'CLIENT' && (
                                <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Points</span>
                                        <span className="text-lg font-black text-pink-600">{p.loyaltyPoints || 0} PTS</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dépenses</span>
                                        <span className="text-lg font-black text-slate-900">{(p.totalSpent || 0).toFixed(2)} €</span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity pt-4 border-t border-slate-50">
                                <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-950 flex items-center gap-1 transition-colors">
                                    Voir historique <ChevronRight size={14}/>
                                </button>
                                <button onClick={() => deletePartner(p.id)} className="text-slate-200 hover:text-red-600 transition-colors">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de création */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-10 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Nouveau Contact</h3>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-300 hover:text-red-500"><X size={32}/></button>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type de profil</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setNewPartner({...newPartner, type: 'CLIENT'})} className={`py-4 rounded-2xl font-black uppercase text-xs tracking-widest border-2 transition-all ${newPartner.type === 'CLIENT' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>Particulier</button>
                                    <button onClick={() => setNewPartner({...newPartner, type: 'SUPPLIER'})} className={`py-4 rounded-2xl font-black uppercase text-xs tracking-widest border-2 transition-all ${newPartner.type === 'SUPPLIER' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>Professionnel</button>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nom / Société</label>
                                    <input type="text" placeholder="Ex: Jean Dupont ou SARL Martin" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[20px] font-black text-slate-950 outline-none focus:border-slate-900 transition-all" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} />
                                </div>
                                {newPartner.type !== 'CLIENT' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type de Professionnel</label>
                                        <select className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[20px] font-black text-slate-950 outline-none focus:border-slate-900 transition-all" value={newPartner.type} onChange={e => setNewPartner({...newPartner, type: e.target.value as any})}>
                                            <option value="SUPPLIER">Fournisseur Marchandise</option>
                                            <option value="MAINTENANCE">Maintenance / Réparation</option>
                                            <option value="DELIVERY">Livraison</option>
                                            <option value="MARKETING">Marketing</option>
                                            <option value="OTHER">Autre</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                                    <input type="email" placeholder="exemple@restaurant.fr" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[20px] font-black text-slate-950 outline-none focus:border-slate-900 transition-all" value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Téléphone</label>
                                    <input type="tel" placeholder="06 12 34 56 78" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[20px] font-black text-slate-950 outline-none focus:border-slate-900 transition-all" value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} />
                                </div>
                            </div>

                            <button onClick={handleAdd} className="w-full bg-emerald-600 text-white py-6 rounded-[24px] font-black text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-all mt-4 uppercase tracking-tighter">
                                Enregistrer le contact
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Partners;
