
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useStore } from './store';
import Layout from './components/Layout';
import MobileLayout from './components/MobileLayout';
import NetworkStatus from './components/NetworkStatus';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Purchases from './pages/Purchases';
import Partners from './pages/Partners';
import Menu from './pages/Menu';
import POS from './pages/POS';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Kitchen from './pages/Kitchen';
import SaaSLogin from './pages/SaaSLogin';
import Expenses from './pages/Expenses';
import Tables from './pages/Tables';
import Exports from './pages/Exports';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import { RestaurantProfile, Role } from './shared/types';
import { hasFeature } from './services/subscription';
import { Lock } from 'lucide-react';
import { useAutoLock } from './shared/hooks/useAutoLock';
import { registerServiceWorker } from './shared/hooks/usePWA';
import { useMobile } from './shared/hooks/useMobile';
import { initMonitoring, initWebVitals, setUserContext } from './shared/services/monitoring';
import { scheduledBackup } from './shared/services/backup';

// Permissions par rôle (Sécurité)
const ROLE_ROUTES: Record<Role, string[]> = {
  OWNER: ['dashboard', 'kitchen', 'stocks', 'purchases', 'partners', 'menu', 'pos', 'users', 'orders', 'expenses', 'exports', 'settings'],
  MANAGER: ['dashboard', 'kitchen', 'stocks', 'purchases', 'menu', 'pos', 'orders', 'expenses', 'exports', 'settings'],
  SERVER: ['pos', 'kitchen', 'orders'],
  COOK: ['kitchen']
};

const ProtectedRoute: React.FC<{ feature: 'hasERP' | 'hasStats', children: React.ReactNode }> = ({ feature, children }) => {
    const { restaurant } = useStore();
    
    if (!hasFeature(restaurant.plan, feature)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-slate-200 p-8 rounded-full mb-6">
                    <Lock size={48} className="text-slate-900" />
                </div>
                <h2 className="text-3xl font-black text-slate-950 mb-2 tracking-tighter uppercase">Fonctionnalité Verrouillée</h2>
                <p className="text-slate-600 max-w-md mb-8 font-bold">
                    Cette fonctionnalité n'est pas disponible dans votre plan actuel (<strong>{restaurant.plan}</strong>).
                    Veuillez mettre à niveau votre abonnement pour y accéder.
                </p>
            </div>
        );
    }
    return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { currentUser, logout, restaurant } = useStore();
  const [currentView, setCurrentView] = useState('pos');
  const isMobile = useMobile();

  // Auto-lock après 2 min inactivité (SÉCURITÉ CRITIQUE)
  useAutoLock(logout, 120000); // 2 minutes

  // Set contexte utilisateur pour Sentry quand user change
  useEffect(() => {
    setUserContext(currentUser);
  }, [currentUser]);

  // Backup automatique quotidien (3h du matin)
  useEffect(() => {
    if (!restaurant?.id || !currentUser) return;

    const scheduleBackup = () => {
      const now = new Date();
      const next3AM = new Date();
      next3AM.setHours(3, 0, 0, 0);

      // Si déjà passé 3h aujourd'hui, programmer pour demain
      if (now > next3AM) {
        next3AM.setDate(next3AM.getDate() + 1);
      }

      const msUntil3AM = next3AM.getTime() - now.getTime();

      const timeoutId = setTimeout(async () => {
        console.info('[BACKUP] Démarrage backup automatique quotidien');
        // Charger données depuis localStorage pour backup
        const storageKey = `smart_food_db_${restaurant.id}`;
        const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
        await scheduledBackup(restaurant.id, data);

        // Reprogrammer pour le lendemain
        scheduleBackup();
      }, msUntil3AM);

      return timeoutId;
    };

    const timeoutId = scheduleBackup();
    return () => clearTimeout(timeoutId);
  }, [restaurant?.id, currentUser]);

  if (!currentUser) {
    return <Login />;
  }

  // Vérification permission rôle
  const hasAccess = (view: string): boolean => {
    return ROLE_ROUTES[currentUser.role]?.includes(view) || false;
  };

  const renderView = () => {
    // Bloquer accès si rôle insuffisant
    if (!hasAccess(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="bg-red-100 p-8 rounded-full mb-6">
            <Lock size={48} className="text-red-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-950 mb-2 tracking-tighter uppercase">Accès Refusé</h2>
          <p className="text-slate-600 max-w-md mb-4 font-bold">
            Votre rôle <strong>{currentUser.role}</strong> ne permet pas d'accéder à cette fonctionnalité.
          </p>
          <p className="text-sm text-slate-500">
            Routes autorisées: {ROLE_ROUTES[currentUser.role].join(', ')}
          </p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <ProtectedRoute feature="hasStats"><Dashboard /></ProtectedRoute>;
      case 'kitchen': return <Kitchen />;
      case 'stocks':
        return <ProtectedRoute feature="hasERP"><Stocks /></ProtectedRoute>;
      case 'purchases':
        return <ProtectedRoute feature="hasERP"><Purchases /></ProtectedRoute>;
      case 'partners':
        return <ProtectedRoute feature="hasERP"><Partners /></ProtectedRoute>;
      case 'expenses':
        return <ProtectedRoute feature="hasERP"><Expenses /></ProtectedRoute>;
      case 'exports':
        return <ProtectedRoute feature="hasERP"><Exports /></ProtectedRoute>;
      case 'settings': return <Settings />;
      case 'menu': return <Menu />;
      case 'pos': return <POS />;
      case 'users': return <Users />;
      case 'orders': return <Orders />;
      case 'tables': return <Tables />;
      default: return <div className="text-center p-10 font-black">MODULE EN CONSTRUCTION</div>;
    }
  };

  // Mode mobile: Layout simplifié pour serveurs
  if (isMobile) {
    return (
      <MobileLayout currentView={currentView} setView={setCurrentView}>
        {renderView()}
      </MobileLayout>
    );
  }

  // Mode desktop: Layout complet pour gérants
  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const savedProfile = localStorage.getItem('smart_food_last_restaurant');
      if(savedProfile) {
          try {
              setRestaurantProfile(JSON.parse(savedProfile));
          } catch(e) {
              localStorage.removeItem('smart_food_last_restaurant');
          }
      }
      setLoading(false);
  }, []);

  // Initialiser monitoring + Service Worker au démarrage
  useEffect(() => {
    registerServiceWorker();
    initMonitoring();
    initWebVitals();
  }, []);

  const handleSaaSLogin = (profile: RestaurantProfile) => {
      setRestaurantProfile(profile);
      localStorage.setItem('smart_food_last_restaurant', JSON.stringify(profile));
  };

  const handleSaaSLogout = () => {
      localStorage.removeItem('smart_food_last_restaurant');
      setRestaurantProfile(null);
  };

  if (loading) return null;

  // Gérer callback Supabase Auth (confirmation email)
  if (window.location.pathname === '/auth/callback') {
      return <AuthCallback />;
  }

  if (!restaurantProfile) {
      return <SaaSLogin onLogin={handleSaaSLogin} />;
  }

  return (
    <AppProvider restaurant={restaurantProfile} onRestaurantLogout={handleSaaSLogout}>
      <Toaster />
      <NetworkStatus />
      <PWAInstallPrompt />
      <AppContent />
    </AppProvider>
  );
};

export default App;
