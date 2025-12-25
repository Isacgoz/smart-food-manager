
import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Clock, CheckCircle, Play, Utensils, AlertCircle, Printer, MessageSquare } from 'lucide-react';
import { KitchenStatus } from '../types';

const Kitchen: React.FC = () => {
    const { orders, updateKitchenStatus, users } = useStore();

    const activeOrders = useMemo(() => {
        return orders
            // Fix: Changed 'SERVI' to 'SERVED' to match KitchenStatus type
            .filter(o => o.status === 'PENDING' && o.kitchenStatus !== 'SERVED')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [orders]);

    const getStatusStyle = (status: KitchenStatus) => {
        switch (status) {
            case 'QUEUED': return 'bg-orange-500 text-white animate-pulse';
            case 'PREPARING': return 'bg-blue-600 text-white';
            case 'READY': return 'bg-emerald-600 text-white';
            default: return 'bg-slate-200 text-slate-600';
        }
    };

    const getStatusLabel = (status: KitchenStatus) => {
        switch (status) {
            case 'QUEUED': return 'EN ATTENTE';
            case 'PREPARING': return 'EN PRÉPARATION';
            case 'READY': return 'PRÊT';
            default: return 'TERMINÉ';
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            <header className="flex justify-between items-center bg-slate-900 p-6 rounded-[24px] text-white shadow-xl">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <Utensils className="text-emerald-500" /> ÉCRAN CUISINE (KDS)
                    </h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        {activeOrders.length} Commandes en cours
                    </p>
                </div>
                <button onClick={() => window.print()} className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-colors">
                    <Printer size={20} />
                </button>
            </header>

            <div className="flex-1 overflow-x-auto no-scrollbar flex gap-6 pb-6">
                {activeOrders.map(order => (
                    <div key={order.id} className="w-[380px] shrink-0 flex flex-col bg-white rounded-[32px] shadow-2xl border-2 border-slate-100 overflow-hidden">
                        {/* Status Header */}
                        <div className={`p-4 flex justify-between items-center font-black text-xs tracking-widest ${getStatusStyle(order.kitchenStatus)}`}>
                            <span>{getStatusLabel(order.kitchenStatus)}</span>
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {order.tableId || 'COMPTOIR'}
                                </h3>
                                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black">#{order.number}</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Serveur: {users.find(u => u.id === order.userId)?.name || 'N/A'}
                            </p>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg">
                                        {item.quantity}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-900 leading-tight uppercase text-sm">{item.name}</p>
                                        {item.note && (
                                            <div className="mt-1 flex items-start gap-1 text-orange-600 bg-orange-50 p-2 rounded-lg">
                                                <MessageSquare size={12} className="mt-0.5 shrink-0" />
                                                <p className="text-[11px] font-black uppercase leading-tight">{item.note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                            {order.kitchenStatus === 'QUEUED' && (
                                <button 
                                    onClick={() => updateKitchenStatus(order.id, 'PREPARING')}
                                    className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                >
                                    <Play size={18} /> Commencer
                                </button>
                            )}
                            {order.kitchenStatus === 'PREPARING' && (
                                <button 
                                    onClick={() => updateKitchenStatus(order.id, 'READY')}
                                    className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                                >
                                    <CheckCircle size={18} /> C'est Prêt !
                                </button>
                            )}
                            {order.kitchenStatus === 'READY' && (
                                <button 
                                    // Fix: Changed 'SERVI' to 'SERVED' to match KitchenStatus type
                                    onClick={() => updateKitchenStatus(order.id, 'SERVED')}
                                    className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    <Utensils size={18} /> Servi
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {activeOrders.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50">
                        <Utensils size={80} className="mb-4" />
                        <p className="text-xl font-black uppercase tracking-[0.3em]">Cuisine vide</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Kitchen;
