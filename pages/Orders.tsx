
import React, { useState } from 'react';
import { useStore } from '../store';
import { Clock, Search, FileText, Printer, CreditCard, Banknote, CheckCircle, Utensils, AlertCircle, ShoppingBag, CookingPot } from 'lucide-react';
import { Order, KitchenStatus } from '../types';

const Orders: React.FC = () => {
    const { orders, tables, payOrder, cancelOrder, users } = useStore();
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [filter, setFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const getTableName = (tableId?: string) => {
        if (!tableId) return 'COMPTOIR / EMPORTER';
        const table = tables.find(t => t.id === tableId);
        return table ? table.name.toUpperCase() : tableId.toUpperCase(); 
    };

    const getKitchenStatusBadge = (status: KitchenStatus) => {
        switch (status) {
            case 'QUEUED': return <span className="flex items-center gap-1 text-[8px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200 uppercase tracking-widest"><Clock size={10}/> Attente</span>;
            case 'PREPARING': return <span className="flex items-center gap-1 text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-widest"><CookingPot size={10}/> En Cuisine</span>;
            case 'READY': return <span className="flex items-center gap-1 text-[8px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-lg shadow-emerald-100 uppercase tracking-widest animate-bounce"><CheckCircle size={10}/> PRÊT !</span>;
            // Fix: Changed 'SERVI' to 'SERVED' to match KitchenStatus type definition in types.ts
            case 'SERVED': return <span className="flex items-center gap-1 text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest">Servi</span>;
            default: return null;
        }
    }

    const displayedOrders = orders
        .filter(o => o.status === activeTab)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(o => {
            const searchLower = filter.toLowerCase();
            const tableName = getTableName(o.tableId).toLowerCase();
            return (o.number || 0).toString().includes(searchLower) || tableName.includes(searchLower);
        });

    return (
        <div className="flex h-[calc(100vh-6rem)] max-w-7xl mx-auto gap-8">
            {/* List Sidebar */}
            <div className="w-[400px] flex flex-col bg-white rounded-[32px] shadow-2xl border-2 border-slate-50 overflow-hidden">
                <div className="p-6 bg-slate-950 text-white">
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl mb-6">
                        <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>En Cours</button>
                        <button onClick={() => setActiveTab('COMPLETED')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Payés</button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" placeholder="RECHERCHER..." className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white font-black text-xs outline-none focus:border-emerald-500 transition-all uppercase tracking-widest"
                            value={filter} onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {displayedOrders.length === 0 && <p className="text-center text-slate-400 font-black uppercase tracking-widest py-20 opacity-30 italic">Aucune commande</p>}
                    {displayedOrders.map(order => (
                        <button
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`w-full text-left p-6 rounded-[24px] border-2 transition-all flex flex-col gap-3 group animate-in slide-in-from-left-4 ${
                                selectedOrder?.id === order.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-slate-200'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedOrder?.id === order.id ? 'text-emerald-500' : 'text-slate-400'}`}>Commande #{order.number}</span>
                                    <h3 className="font-black text-lg tracking-tighter uppercase">{getTableName(order.tableId)}</h3>
                                </div>
                                <span className={`font-black text-xl tracking-tighter ${selectedOrder?.id === order.id ? 'text-white' : 'text-slate-900'}`}>{order.total.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                                    <Clock size={12}/> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                {getKitchenStatusBadge(order.kitchenStatus)}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 bg-white rounded-[40px] shadow-2xl border-2 border-slate-50 p-10 flex flex-col overflow-hidden relative">
                {selectedOrder ? (
                    <div className="h-full flex flex-col animate-in zoom-in-95">
                        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
                            <div>
                                <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">{getTableName(selectedOrder.tableId)}</h2>
                                <p className="text-slate-500 font-black uppercase tracking-widest text-xs mt-1">Serveur: {users.find(u => u.id === selectedOrder.userId)?.name}</p>
                            </div>
                            <div className="text-right">
                                <div className="bg-slate-950 text-white px-5 py-2 rounded-2xl font-black text-xl tracking-tighter mb-2 inline-block">#{selectedOrder.number}</div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedOrder.date).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-4">
                            {selectedOrder.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[20px] border border-slate-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">{item.quantity}</div>
                                        <div>
                                            <p className="font-black text-slate-950 uppercase tracking-tight">{item.name}</p>
                                            {item.note && <p className="text-[10px] text-orange-600 font-black flex items-center gap-1 mt-1 uppercase tracking-widest"><AlertCircle size={10}/> {item.note}</p>}
                                        </div>
                                    </div>
                                    <span className="font-black text-slate-900 text-lg">{(item.price * item.quantity).toFixed(2)} €</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t-4 border-slate-900">
                            <div className="flex justify-between items-end mb-8">
                                <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">TOTAL À PAYER</span>
                                <span className="text-6xl font-black text-slate-950 tracking-tighter">{selectedOrder.total.toFixed(2)} €</span>
                            </div>

                            {activeTab === 'PENDING' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => payOrder(selectedOrder.id, 'CASH')} className="bg-emerald-600 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl shadow-emerald-100 active:scale-95 flex items-center justify-center gap-3 transition-all uppercase tracking-tighter"><Banknote size={24}/> Espèces</button>
                                    <button onClick={() => payOrder(selectedOrder.id, 'CARD')} className="bg-blue-600 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-3 transition-all uppercase tracking-tighter"><CreditCard size={24}/> Carte Bancaire</button>
                                </div>
                            ) : (
                                <button onClick={() => window.print()} className="w-full bg-slate-950 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-tighter"><Printer size={24}/> Imprimer Reçu</button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                        <ShoppingBag size={100} className="text-slate-900 mb-6" />
                        <h3 className="text-2xl font-black uppercase tracking-[0.3em]">Consulter une facture</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
