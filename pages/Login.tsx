
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Lock, User as UserIcon, ArrowLeft, LogOut, Clock, Banknote, CheckCircle, Loader2 } from 'lucide-react';
import { User } from '../shared/types';
import { verifyPIN, verifyPINOffline } from '../shared/services/auth';

const LAST_USER_KEY = 'smart_food_last_staff_login';

const Login: React.FC = () => {
  const { login, users, logoutRestaurant, restaurant, cashDeclarations, declareCash } = useStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Declaration Step
  const [step, setStep] = useState<'USER' | 'PIN' | 'CASH'>('USER');
  const [cashAmount, setCashAmount] = useState('');

  useEffect(() => {
      const saved = localStorage.getItem(`${LAST_USER_KEY}_${restaurant.id}`);
      if (saved) setLastUserId(saved);
  }, [restaurant.id]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || isVerifying) return;

    setIsVerifying(true);
    setError(false);

    try {
      // Vérification server-side prioritaire
      const result = await verifyPIN(restaurant.id, selectedUser.id, pin);

      // Fallback offline si Supabase inaccessible
      const finalResult = result.success
        ? result
        : await verifyPINOffline(users, selectedUser.id, pin);

      if (finalResult.success) {
        localStorage.setItem(`${LAST_USER_KEY}_${restaurant.id}`, selectedUser.id);

        // Check if declaration needed for TODAY
        const today = new Date().toISOString().split('T')[0];
        const hasDeclared = cashDeclarations.some(d =>
            d.userId === selectedUser.id &&
            d.date.startsWith(today) &&
            d.type === 'OPENING'
        );

        if (hasDeclared) {
            login(finalResult.user || selectedUser);
        } else {
            setStep('CASH');
        }
      } else {
        setError(true);
        setPin('');
      }
    } catch (err) {
      console.error('[LOGIN] PIN verification failed:', err);
      setError(true);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCashSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser || !cashAmount) return;
      
      declareCash(selectedUser.id, parseFloat(cashAmount));
      login(selectedUser);
  };

  const handleUserSelect = (user: User) => {
      setSelectedUser(user);
      setError(false);
      setPin('');
      setStep('PIN');
  };

  const handleExit = () => {
      if(window.confirm("Revenir à l'écran de connexion principal ?")) {
          logoutRestaurant();
      }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] z-0" />

      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl p-10 w-full max-w-2xl transition-all border border-slate-800 relative z-10">
        
        {/* Restaurant Header */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center border-b border-slate-800/50 bg-slate-800/20 rounded-t-[40px]">
             <span className="font-black text-emerald-500 uppercase text-xs tracking-[0.2em]">{restaurant.name}</span>
             <button 
                type="button"
                onClick={handleExit} 
                className="text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
             >
                 <LogOut size={12} /> Quitter le restaurant
             </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10 mt-12">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">SMART FOOD</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                {selectedUser ? `SESSION : ${selectedUser.name}` : "Veuillez choisir un utilisateur"}
            </p>
        </div>

        {step === 'USER' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {users.map(user => {
                    const isLast = user.id === lastUserId;
                    return (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => handleUserSelect(user)}
                            className={`group flex flex-col items-center justify-center p-8 bg-slate-800/40 border-2 rounded-[32px] transition-all active:scale-95 relative ${
                                isLast ? 'border-emerald-500 bg-emerald-500/5 shadow-xl shadow-emerald-900/10' : 'border-transparent hover:border-slate-700 hover:bg-slate-800/60'
                            }`}
                        >
                            {isLast && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg flex items-center gap-1">
                                    <Clock size={8}/> Dernier login
                                </div>
                            )}
                            <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-4 transition-all shadow-inner ${
                                isLast ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-white'
                            }`}>
                                <span className="text-2xl font-black">
                                    {user.name.substring(0, 1).toUpperCase()}
                                </span>
                            </div>
                            <span className={`font-black tracking-tight ${isLast ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{user.name}</span>
                            <span className="text-[9px] text-slate-600 mt-1 uppercase font-black tracking-widest">{user.role}</span>
                        </button>
                    )
                })}
            </div>
        )}

        {step === 'PIN' && selectedUser && (
            <div className="max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-6 duration-500">
                <button 
                    type="button"
                    onClick={() => setStep('USER')}
                    className="flex items-center text-[10px] font-black uppercase text-slate-500 hover:text-white mb-8 transition-colors mx-auto tracking-widest"
                >
                    <ArrowLeft size={12} className="mr-2"/> Autre utilisateur
                </button>

                <form onSubmit={handlePinSubmit} className="space-y-8">
                    <div className="relative">
                        <input
                            type="password"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => { 
                                if (/^\d*$/.test(e.target.value)) {
                                    setPin(e.target.value); 
                                    setError(false); 
                                }
                            }}
                            className="w-full text-center text-5xl font-black tracking-[0.8em] p-6 bg-slate-800/50 border-2 border-slate-700 rounded-[32px] focus:border-emerald-500 focus:outline-none text-white placeholder:text-slate-800 transition-all"
                            placeholder="••••"
                            autoFocus
                        />
                        {error && (
                            <div className="absolute -bottom-10 left-0 w-full text-red-500 text-[10px] text-center font-black uppercase tracking-widest animate-bounce">
                                Code PIN incorrect
                            </div>
                        )}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={pin.length < 4 || isVerifying}
                        className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black text-xl hover:bg-emerald-500 disabled:opacity-20 disabled:grayscale transition-all shadow-2xl shadow-emerald-900/40 active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                VÉRIFICATION...
                            </>
                        ) : (
                            'VÉRIFIER LE PIN'
                        )}
                    </button>
                </form>
            </div>
        )}

        {step === 'CASH' && selectedUser && (
            <div className="max-w-md mx-auto animate-in zoom-in duration-500 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Banknote size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Fond de Caisse Initial</h2>
                <p className="text-slate-500 text-sm mb-8 font-bold uppercase tracking-widest">Ouverture de session obligatoire</p>
                
                <form onSubmit={handleCashSubmit} className="space-y-6">
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            className="w-full text-center text-4xl font-black p-8 bg-slate-800/50 border-2 border-emerald-500/30 rounded-[32px] focus:border-emerald-500 focus:outline-none text-white transition-all"
                            placeholder="0.00"
                            onFocus={(e) => e.target.select()}
                            autoFocus
                        />
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 text-2xl font-black">€</span>
                    </div>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-4 text-left">
                        <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest leading-relaxed">
                            En validant, vous déclarez être responsable de ce montant initial pour la durée de votre service.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!cashAmount || parseFloat(cashAmount) < 0}
                        className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black text-xl hover:bg-emerald-500 disabled:opacity-20 transition-all shadow-2xl shadow-emerald-900/40 active:scale-95"
                    >
                        OUVRIR LA CAISSE
                    </button>
                </form>
            </div>
        )}

        <div className="mt-12 text-center pt-6 border-t border-slate-800/50">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <Lock size={10} className="text-emerald-500"/> Gestion de Caisse Intégrée
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
