
import React from 'react';
import { useStore } from '../store';
import {
  LayoutDashboard, ShoppingCart, ChefHat,
  UtensilsCrossed, LogOut, Users, FileText, ArrowLeftCircle, AlertCircle, X, Package, CreditCard, HeartHandshake, Database, CookingPot, DollarSign, LayoutGrid
} from 'lucide-react';
import { hasFeature } from '../services/subscription';
import { Role } from '../types';

// Permissions strictes par rôle
const ROLE_ROUTES: Record<Role, string[]> = {
  OWNER: ['dashboard', 'kitchen', 'stocks', 'purchases', 'partners', 'menu', 'pos', 'users', 'orders', 'backup', 'expenses', 'tables'],
  MANAGER: ['dashboard', 'kitchen', 'stocks', 'purchases', 'menu', 'pos', 'orders', 'backup', 'expenses', 'tables'],
  SERVER: ['pos', 'kitchen', 'orders', 'tables'],
  COOK: ['kitchen']
};

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { currentUser, logout, logoutRestaurant, restaurant, notifications, removeNotification } = useStore();

  const role = currentUser?.role || 'SERVER';
  const allowedRoutes = ROLE_ROUTES[role] || [];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Cuisine (KDS)', icon: CookingPot },
    { id: 'pos', label: 'Caisse (POS)', icon: ShoppingCart },
    { id: 'tables', label: 'Gestion Tables', icon: LayoutGrid },
    { id: 'orders', label: 'Historique Factures', icon: FileText },
    { id: 'menu', label: 'Produits & Recettes', icon: UtensilsCrossed },
    { id: 'stocks', label: 'Gestion Stocks', icon: Package },
    { id: 'purchases', label: 'Achats (BR)', icon: CreditCard },
    { id: 'expenses', label: 'Charges (Fixes/Var)', icon: DollarSign },
    { id: 'partners', label: 'Partenaires & CRM', icon: HeartHandshake },
    { id: 'users', label: 'Équipe', icon: Users },
    { id: 'backup', label: 'Sauvegarde DB', icon: Database },
  ];

  // Filtrer selon rôle ET plan
  const visibleNavItems = navItems.filter(item => {
    // Vérifier permission rôle
    if (!allowedRoutes.includes(item.id)) return false;

    // Vérifier permission plan
    if (['dashboard'].includes(item.id) && !hasFeature(restaurant.plan, 'hasStats')) return false;
    if (['stocks', 'purchases', 'partners', 'expenses'].includes(item.id) && !hasFeature(restaurant.plan, 'hasERP')) return false;

    return true;
  });

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-68 bg-slate-950 text-white flex flex-col shadow-[10px_0_60px_rgba(0,0,0,0.1)] z-20 print:hidden border-r border-slate-900">
        <div className="p-8 border-b border-slate-900">
          <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-900/20"><ChefHat size={22}/></div>
              <h1 className="text-xl font-black tracking-tighter text-white">SMART FOOD</h1>
          </div>
          <div className="flex flex-col bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Etablissement</span>
              <span className="text-sm font-black text-white truncate uppercase tracking-tight">{restaurant.name}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
          <ul className="space-y-1 px-4">
            {visibleNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                    currentView === item.id 
                      ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-900/40' 
                      : 'text-slate-500 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className={currentView === item.id ? 'text-white' : 'text-slate-600 group-hover:text-white'} />
                  <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-slate-900 space-y-3">
          <div className="p-4 bg-slate-900 rounded-[20px] flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-white shadow-lg">
                  {currentUser?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                  <p className="text-sm font-black text-white truncate leading-none mb-1">{currentUser?.name}</p>
                  <p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">{role}</p>
              </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-4 text-slate-500 hover:text-white hover:bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <LogOut size={16} /> <span>Verrouiller</span>
          </button>
          <button onClick={logoutRestaurant} className="w-full flex items-center gap-3 px-4 py-4 text-red-500 hover:bg-red-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <ArrowLeftCircle size={16} /> <span>Quitter</span>
          </button>
        </div>
      </aside>

      {/* Notifications Portal */}
      <div className="fixed top-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
          {notifications.map((n: any) => (
              <div key={n.id} className={`pointer-events-auto flex items-center justify-between gap-6 px-6 py-5 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border-2 min-w-[350px] animate-in slide-in-from-right-10 duration-500 ${
                  n.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
                  n.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
                  n.type === 'warning' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-900 border-slate-800 text-white'
              }`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20}/>
                    <span className="text-sm font-black uppercase tracking-tight">{n.message}</span>
                  </div>
                  <button onClick={() => removeNotification(n.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                      <X size={20}/>
                  </button>
              </div>
          ))}
      </div>

      <main className="flex-1 overflow-y-auto p-12 bg-slate-100 print:bg-white print:p-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
