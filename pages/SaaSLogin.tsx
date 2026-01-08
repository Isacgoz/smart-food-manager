
import React, { useState, useEffect } from 'react';
import { PlanType, RestaurantProfile } from '../types';
import { ChefHat, Check, LogIn, Mail, Lock, Eye, EyeOff, Users, Trash2, ArrowRight, Smartphone } from 'lucide-react';
import { supabase } from '../services/storage';

interface SaaSLoginProps {
    onLogin: (profile: RestaurantProfile) => void;
}

// CLES DE STOCKAGE CRITIQUES - NE PAS CHANGER
const SAAS_DB_KEY = 'SMART_FOOD_SAAS_MASTER_DB';

const SaaSLogin: React.FC<SaaSLoginProps> = ({ onLogin }) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'SAVED'>('LOGIN');
    const [accounts, setAccounts] = useState<any[]>([]);
    
    // Login form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Register form
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPlan, setRegPlan] = useState<PlanType>('PRO');

    useEffect(() => {
        const db = JSON.parse(localStorage.getItem(SAAS_DB_KEY) || '[]');
        setAccounts(db);
        if (db.length > 0) setView('SAVED');
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!supabase) {
            // Fallback mode local si Supabase non configuré
            const user = accounts.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user) {
                onLogin(user.profile);
                return;
            }
            setError("Email ou mot de passe invalide.");
            return;
        }

        try {
            // Auth Supabase sécurisée
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            });

            if (authError) {
                setError(authError.message === 'Invalid login credentials'
                    ? 'Email ou mot de passe invalide.'
                    : authError.message);
                return;
            }

            if (!data.user) {
                setError('Erreur de connexion.');
                return;
            }

            // Charger profil restaurant depuis Supabase
            const { data: profileData, error: profileError } = await supabase
                .from('app_state')
                .select('data')
                .eq('id', data.user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                setError('Erreur chargement profil.');
                return;
            }

            // Créer ou utiliser profil existant
            const profile: RestaurantProfile = profileData?.data?.restaurant || {
                id: data.user.id,
                name: data.user.email?.split('@')[0] || 'Mon Restaurant',
                ownerEmail: data.user.email || email,
                plan: 'PRO',
                createdAt: new Date().toISOString()
            };

            onLogin(profile);
        } catch (err: any) {
            setError(err.message || 'Erreur connexion.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!regName || !regEmail || !regPassword) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        if (!supabase) {
            // Fallback mode local
            const existing = accounts.find(u => u.email.toLowerCase() === regEmail.toLowerCase());
            if (existing) {
                setError("Un compte existe déjà avec cet email.");
                return;
            }

            const stableId = btoa(regEmail.toLowerCase().trim()).replace(/=/g, '');
            const profile: RestaurantProfile = {
                id: stableId,
                name: regName.trim(),
                ownerEmail: regEmail.trim(),
                plan: regPlan,
                createdAt: new Date().toISOString()
            };

            const newAccount = {
                email: regEmail.toLowerCase(),
                profile
            };

            const updatedAccounts = [...accounts, newAccount];
            localStorage.setItem(SAAS_DB_KEY, JSON.stringify(updatedAccounts));
            onLogin(profile);
            return;
        }

        try {
            // Inscription Supabase sécurisée avec auto-confirm
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: regEmail.toLowerCase().trim(),
                password: regPassword,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        restaurant_name: regName.trim(),
                        plan: regPlan
                    }
                }
            });

            if (signUpError) {
                setError(signUpError.message === 'User already registered'
                    ? 'Un compte existe déjà avec cet email.'
                    : signUpError.message);
                return;
            }

            if (!data.user) {
                setError('Erreur lors de l\'inscription.');
                return;
            }

            // Créer profil restaurant dans app_state
            const profile: RestaurantProfile = {
                id: data.user.id,
                name: regName.trim(),
                ownerEmail: regEmail.trim(),
                plan: regPlan,
                createdAt: new Date().toISOString()
            };

            const initialState = {
                restaurant: profile,
                users: [{
                    id: '1',
                    name: 'Admin',
                    pin: '1234',
                    pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
                    role: 'OWNER'
                }],
                products: [],
                tables: [],
                orders: [],
                ingredients: [],
                movements: [],
                expenses: [],
                cashDeclarations: [],
                partners: [],
                supplierOrders: [],
                _lastUpdatedAt: Date.now()
            };

            const { error: insertError } = await supabase
                .from('app_state')
                .upsert({
                    id: data.user.id,
                    data: initialState
                }, {
                    onConflict: 'id'
                });

            if (insertError) {
                console.error('[REGISTER] Insert error:', insertError);
                setError('Erreur création profil: ' + insertError.message);
                return;
            }

            // Sauvegarder localement aussi pour fallback
            const newAccount = {
                email: regEmail.toLowerCase(),
                profile
            };
            const updatedAccounts = [...accounts, newAccount];
            localStorage.setItem(SAAS_DB_KEY, JSON.stringify(updatedAccounts));

            // Auto-login après inscription (même si email non vérifié en dev)
            onLogin(profile);
        } catch (err: any) {
            console.error('[REGISTER] Exception:', err);
            setError(err.message || 'Erreur inscription.');
        }
    };

    const removeAccount = (email: string) => {
        const filtered = accounts.filter(a => a.email !== email);
        setAccounts(filtered);
        localStorage.setItem(SAAS_DB_KEY, JSON.stringify(filtered));
        if (filtered.length === 0) setView('LOGIN');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full z-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-md w-full z-10">
                <header className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-[24px] mb-6 shadow-2xl shadow-emerald-900/40 transform rotate-3">
                        <ChefHat size={40} className="text-white"/>
                    </div>
                    <h1 className="text-5xl font-black mb-2 tracking-tighter">SMART FOOD</h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em]">Édition SaaS Manager</p>
                </header>

                {view === 'SAVED' ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <h2 className="text-center text-slate-400 font-bold mb-6">Restaurants Détectés</h2>
                        {accounts.map(acc => (
                            <div key={acc.email} className="group relative">
                                <button 
                                    onClick={() => { setEmail(acc.email); setView('LOGIN'); }}
                                    className="w-full flex items-center gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-[28px] hover:border-emerald-500 hover:bg-slate-800 transition-all text-left"
                                >
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 font-black">
                                        {acc.profile.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black text-white truncate">{acc.profile.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{acc.email}</p>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"/>
                                </button>
                                <button 
                                    onClick={() => removeAccount(acc.email)}
                                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <Trash2 size={12}/>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setView('LOGIN')} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-[28px] text-slate-500 text-sm font-bold hover:text-white hover:border-slate-600 transition-all mt-4">
                            Connecter un autre établissement
                        </button>
                        <button type="button" onClick={() => setView('REGISTER')} className="w-full text-center text-emerald-500 text-xs font-bold hover:underline mt-4">
                            Créer un nouveau restaurant
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[40px] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black">
                                {view === 'LOGIN' ? 'Bon retour' : 'Inscription'}
                            </h2>
                            {accounts.length > 0 && (
                                <button type="button" onClick={() => setView('SAVED')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Mes Comptes</button>
                            )}
                        </div>
                        
                        {error && <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-2xl mb-6 text-xs font-bold animate-pulse">{error}</div>}

                        <form onSubmit={view === 'LOGIN' ? handleLogin : handleRegister} className="space-y-5">
                            {view === 'REGISTER' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nom de l'enseigne</label>
                                    <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-all text-white font-bold" placeholder="Ex: Food Truck Gourmet" required />
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Gérant</label>
                                <input type="email" value={view === 'LOGIN' ? email : regEmail} onChange={e => view === 'LOGIN' ? setEmail(e.target.value) : setRegEmail(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-all text-white font-bold" placeholder="votre@email.com" required />
                            </div>
                            <div className="space-y-1 relative">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Mot de passe</label>
                                <input type={showPassword ? "text" : "password"} value={view === 'LOGIN' ? password : regPassword} onChange={e => view === 'LOGIN' ? setPassword(e.target.value) : setRegPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pr-12 outline-none focus:border-emerald-500 transition-all text-white font-bold" placeholder="••••••••" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-500 hover:text-white">
                                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all mt-4">
                                {view === 'LOGIN' ? 'OUVRIR MA SESSION' : 'CRÉER MON COMPTE'}
                            </button>
                        </form>
                        
                        <button type="button" onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest">
                            {view === 'LOGIN' ? "Pas de compte ? S'inscrire" : "Déjà client ? Se connecter"}
                        </button>
                    </div>
                )}
                
                <p className="mt-10 text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">
                    Version 2.5 • Stockage Local Sécurisé
                </p>
            </div>
        </div>
    );
};

export default SaaSLogin;
