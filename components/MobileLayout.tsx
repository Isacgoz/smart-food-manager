import React from 'react';
import { ShoppingCart, UtensilsCrossed, LayoutGrid, LogOut } from 'lucide-react';
import { useStore } from '../store';

interface MobileLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children, currentView, setView }) => {
  const { logout, currentUser } = useStore();

  const navItems = [
    { id: 'pos', label: 'Caisse', icon: ShoppingCart },
    { id: 'kitchen', label: 'Cuisine', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables', icon: LayoutGrid }
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header Mobile */}
      <header className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center shadow-xl">
        <div>
          <h1 className="font-black text-lg uppercase tracking-tight">Smart Food</h1>
          <p className="text-xs text-slate-400 font-bold">{currentUser?.name}</p>
        </div>
        <button
          onClick={logout}
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          title="Déconnexion"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 px-2 py-2 shadow-2xl">
        <div className="grid grid-cols-3 gap-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center py-3 rounded-2xl font-black text-xs uppercase tracking-wide transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-lg scale-105'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon size={24} className="mb-1" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
