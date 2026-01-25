
import React, { useState, useEffect } from 'react';
import { PlanType, RestaurantProfile } from '../types';
import { ChefHat, Eye, EyeOff, Trash2, ArrowRight, Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/storage';

interface SaaSLoginProps {
    onLogin: (profile: RestaurantProfile) => void;
}

// CLES DE STOCKAGE CRITIQUES - NE PAS CHANGER
const SAAS_DB_KEY = 'SMART_FOOD_SAAS_MASTER_DB';
const LOGIN_ATTEMPTS_KEY = 'SMART_FOOD_LOGIN_ATTEMPTS';

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttempt {
    email: string;
    attempts: number;
    lastAttempt: number;
    lockedUntil?: number;
}

// Récupère ou initialise le tracking des tentatives
const getLoginAttempts = (): Record<string, LoginAttempt> => {
    try {
        return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{}');
    } catch {
        return {};
    }
};

// Vérifie si un email est bloqué
const isEmailLocked = (email: string): { locked: boolean; remainingMs: number } => {
    const attempts = getLoginAttempts();
    const record = attempts[email.toLowerCase()];
    if (!record?.lockedUntil) return { locked: false, remainingMs: 0 };

    const remaining = record.lockedUntil - Date.now();
    if (remaining <= 0) {
        // Lockout expiré, nettoyer
        delete attempts[email.toLowerCase()];
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
        return { locked: false, remainingMs: 0 };
    }
    return { locked: true, remainingMs: remaining };
};

// Enregistre une tentative échouée
const recordFailedAttempt = (email: string): number => {
    const attempts = getLoginAttempts();
    const key = email.toLowerCase();
    const now = Date.now();

    if (!attempts[key]) {
        attempts[key] = { email: key, attempts: 0, lastAttempt: now };
    }

    // Reset si dernière tentative > lockout duration
    if (now - attempts[key].lastAttempt > LOCKOUT_DURATION_MS) {
        attempts[key] = { email: key, attempts: 0, lastAttempt: now };
    }

    attempts[key].attempts++;
    attempts[key].lastAttempt = now;

    // Bloquer si trop de tentatives
    if (attempts[key].attempts >= MAX_LOGIN_ATTEMPTS) {
        attempts[key].lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    return MAX_LOGIN_ATTEMPTS - attempts[key].attempts;
};

// Réinitialise les tentatives après succès
const clearLoginAttempts = (email: string): void => {
    const attempts = getLoginAttempts();
    delete attempts[email.toLowerCase()];
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
};

// Génère un PIN sécurisé + son hash SHA-256
const generateSecureCredentials = async () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const pin = String(array[0] % 900000 + 100000).slice(0, 4); // PIN 4 chiffres
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { pin, pinHash };
};

const SaaSLogin: React.FC<SaaSLoginProps> = ({ onLogin }) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'SAVED' | 'FORGOT_PASSWORD'>('LOGIN');
    const [accounts, setAccounts] = useState<any[]>([]);

    // Login form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Forgot password
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);

    // PIN display modal state
    const [showPinModal, setShowPinModal] = useState(false);
    const [generatedPin, setGeneratedPin] = useState('');
    const [pendingProfile, setPendingProfile] = useState<RestaurantProfile | null>(null);
    const [pinCopied, setPinCopied] = useState(false);

    // Rate limiting state
    const [lockoutRemaining, setLockoutRemaining] = useState(0);
    const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_LOGIN_ATTEMPTS);

    // Register form
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPlan, setRegPlan] = useState<PlanType>('SOLO');

    useEffect(() => {
        const db = JSON.parse(localStorage.getItem(SAAS_DB_KEY) || '[]');
        setAccounts(db);
        if (db.length > 0) setView('SAVED');
    }, []);

    // Vérifier lockout quand l'email change
    useEffect(() => {
        if (email) {
            const lockStatus = isEmailLocked(email);
            if (lockStatus.locked) {
                setLockoutRemaining(lockStatus.remainingMs);
                const minutes = Math.ceil(lockStatus.remainingMs / 60000);
                setError(`Compte temporairement bloqué. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`);
            } else {
                setLockoutRemaining(0);
                setError('');
            }
        }
    }, [email]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Vérifier le rate limiting
        const lockStatus = isEmailLocked(email);
        if (lockStatus.locked) {
            const minutes = Math.ceil(lockStatus.remainingMs / 60000);
            setLockoutRemaining(lockStatus.remainingMs);
            setError(`Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`);
            return;
        }

        if (!supabase) {
            // Fallback mode local si Supabase non configuré
            const user = accounts.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user) {
                clearLoginAttempts(email);
                onLogin(user.profile);
                return;
            }
            const remaining = recordFailedAttempt(email);
            setAttemptsRemaining(remaining);
            setError(remaining > 0
                ? `Email ou mot de passe invalide. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
                : "Compte temporairement bloqué. Réessayez dans 15 minutes.");
            return;
        }

        try {
            // Auth Supabase sécurisée
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            });

            if (authError) {
                const remaining = recordFailedAttempt(email);
                setAttemptsRemaining(remaining);
                setError(remaining > 0
                    ? `Email ou mot de passe invalide. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
                    : "Compte temporairement bloqué. Réessayez dans 15 minutes.");
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

            // PGRST116 = No rows found (normal pour nouveau user)
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('[LOGIN] Profile load error:', profileError);
            }

            // Créer profil par défaut si non existant
            const profile: RestaurantProfile = profileData?.data?.restaurant || {
                id: data.user.id,
                name: data.user.user_metadata?.restaurant_name || data.user.email?.split('@')[0] || 'Mon Restaurant',
                ownerEmail: data.user.email || email,
                plan: data.user.user_metadata?.plan || 'SOLO',
                createdAt: new Date().toISOString()
            };

            // Si pas de données existantes, créer l'état initial
            if (!profileData?.data) {
                console.log('[LOGIN] Creating initial state for user:', data.user.id);

                // Nettoyer puis créer company
                await supabase.from('companies').delete().eq('id', data.user.id);
                await supabase.from('companies').insert({
                    id: data.user.id,
                    name: profile.name,
                    owner_id: data.user.id,
                    plan: profile.plan,
                    is_active: true
                });

                // Générer PIN sécurisé pour le nouvel admin
                const { pin: adminPin, pinHash: adminPinHash } = await generateSecureCredentials();

                // Créer état initial
                const initialState = {
                    restaurant: profile,
                    users: [{
                        id: '1',
                        name: 'Admin',
                        pin: '', // Ne plus stocker le PIN en clair
                        pinHash: adminPinHash,
                        role: 'OWNER',
                        requirePinChange: true // Forcer changement au premier login
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
                    _lastUpdatedAt: Date.now(),
                    _initialAdminPin: adminPin // Temporaire: pour affichage unique
                };

                await supabase.from('app_state').delete().eq('id', data.user.id);
                await supabase.from('app_state').insert({
                    id: data.user.id,
                    company_id: data.user.id,
                    data: initialState
                });

                // Afficher le PIN à l'utilisateur (premier login)
                clearLoginAttempts(email);
                setGeneratedPin(adminPin);
                setPendingProfile(profile);
                setShowPinModal(true);
                return;
            }

            // Login réussi - clear rate limiting
            clearLoginAttempts(email);
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

            // Générer PIN sécurisé en mode local aussi
            const { pin: localAdminPin } = await generateSecureCredentials();

            const newAccount = {
                email: regEmail.toLowerCase(),
                profile
            };

            const updatedAccounts = [...accounts, newAccount];
            localStorage.setItem(SAAS_DB_KEY, JSON.stringify(updatedAccounts));

            // Afficher le PIN avant de continuer
            setGeneratedPin(localAdminPin);
            setPendingProfile(profile);
            setShowPinModal(true);
            return;
        }

        try {
            // Inscription Supabase sécurisée avec auto-confirm
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: regEmail.toLowerCase().trim(),
                password: regPassword,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
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

            // ÉTAPE 1: Nettoyer puis créer company (évite conflit upsert/RLS)
            await supabase.from('companies').delete().eq('id', data.user.id);

            const companyPayload = {
                id: data.user.id,
                name: regName.trim(),
                owner_id: data.user.id,
                plan: 'SOLO' as const,  // Force valeur explicite
                is_active: true
            };
            console.log('[REGISTER] Company payload:', JSON.stringify(companyPayload));

            const { error: companyError } = await supabase
                .from('companies')
                .insert(companyPayload);

            if (companyError) {
                console.error('[REGISTER] Company creation error:', companyError);
                console.error('[REGISTER] Payload was:', JSON.stringify(companyPayload));
                setError('Erreur création restaurant: ' + companyError.message);
                return;
            }
            console.log('[REGISTER] Company created successfully');

            // ÉTAPE 2: Créer profil restaurant
            const profile: RestaurantProfile = {
                id: data.user.id,
                name: regName.trim(),
                ownerEmail: regEmail.trim(),
                plan: regPlan,
                createdAt: new Date().toISOString()
            };

            // Générer PIN sécurisé pour l'admin du nouveau restaurant
            const { pin: newAdminPin, pinHash: newAdminPinHash } = await generateSecureCredentials();

            const initialState = {
                restaurant: profile,
                users: [{
                    id: '1',
                    name: 'Admin',
                    pin: '', // Ne plus stocker en clair
                    pinHash: newAdminPinHash,
                    role: 'OWNER',
                    requirePinChange: true
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
                _lastUpdatedAt: Date.now(),
                _initialAdminPin: newAdminPin // Pour affichage unique à l'inscription
            };

            // ÉTAPE 3: Nettoyer puis créer app_state
            await supabase.from('app_state').delete().eq('id', data.user.id);
            const { error: insertError } = await supabase
                .from('app_state')
                .insert({
                    id: data.user.id,
                    company_id: data.user.id,
                    data: initialState
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

            // Afficher le PIN à l'utilisateur avant de continuer
            setGeneratedPin(newAdminPin);
            setPendingProfile(profile);
            setShowPinModal(true);
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

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!supabase) {
            setError("La réinitialisation du mot de passe nécessite une connexion internet.");
            return;
        }

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                forgotEmail.toLowerCase().trim(),
                {
                    redirectTo: `${window.location.origin}/auth/callback?type=recovery`
                }
            );

            if (resetError) {
                setError(resetError.message);
                return;
            }

            setResetSent(true);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'envoi.');
        }
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
                ) : view === 'FORGOT_PASSWORD' ? (
                    <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[40px] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black mb-2">Mot de passe oublié</h2>
                            <p className="text-slate-400 text-sm">
                                Entrez votre email pour recevoir un lien de réinitialisation.
                            </p>
                        </div>

                        {resetSent ? (
                            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 p-6 rounded-2xl mb-6 text-center">
                                <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                                <p className="font-bold mb-2">Email envoyé !</p>
                                <p className="text-xs text-emerald-300">
                                    Consultez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                                </p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-2xl mb-6 text-xs font-bold">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email</label>
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-all text-white font-bold"
                                            placeholder="votre@email.com"
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all">
                                        ENVOYER LE LIEN
                                    </button>
                                </form>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => { setView('LOGIN'); setError(''); setResetSent(false); }}
                            className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest"
                        >
                            Retour à la connexion
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

                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-2xl mb-6 text-xs font-bold animate-pulse">
                                {error}
                                {lockoutRemaining > 0 && (
                                    <div className="mt-2 text-red-300 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Compte verrouillé par sécurité
                                    </div>
                                )}
                            </div>
                        )}

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
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Mot de passe</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} value={view === 'LOGIN' ? password : regPassword} onChange={e => view === 'LOGIN' ? setPassword(e.target.value) : setRegPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pr-12 outline-none focus:border-emerald-500 transition-all text-white font-bold" placeholder="••••••••" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-emerald-900/20 active:scale-[0.98] transition-all mt-4">
                                {view === 'LOGIN' ? 'OUVRIR MA SESSION' : 'CRÉER MON COMPTE'}
                            </button>
                        </form>

                        {view === 'LOGIN' && (
                            <button
                                type="button"
                                onClick={() => { setView('FORGOT_PASSWORD'); setError(''); }}
                                className="w-full mt-4 text-xs text-slate-400 hover:text-emerald-500 transition-colors font-bold"
                            >
                                Mot de passe oublié ?
                            </button>
                        )}

                        <button type="button" onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="w-full mt-8 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest">
                            {view === 'LOGIN' ? "Pas de compte ? S'inscrire" : "Déjà client ? Se connecter"}
                        </button>
                    </div>
                )}
                
                <p className="mt-10 text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">
                    Version 2.5 • Stockage Local Sécurisé
                </p>
            </div>

            {/* Modal affichage PIN initial */}
            {showPinModal && pendingProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-[32px] p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
                                <AlertTriangle size={32} className="text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">
                                PIN Admin Généré
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Notez ce code PIN, il est nécessaire pour accéder à la caisse.
                                <br />
                                <span className="text-amber-400 font-bold">Il ne sera plus affiché après cette étape.</span>
                            </p>
                        </div>

                        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Key size={24} className="text-emerald-500" />
                                <span className="text-4xl font-black text-white tracking-[0.5em] font-mono">
                                    {generatedPin}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedPin);
                                    setPinCopied(true);
                                    setTimeout(() => setPinCopied(false), 2000);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-sm font-bold"
                            >
                                {pinCopied ? (
                                    <>
                                        <CheckCircle size={16} className="text-emerald-500" />
                                        <span className="text-emerald-500">Copié!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} className="text-slate-400" />
                                        <span className="text-slate-300">Copier le PIN</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-xs text-slate-400">
                            <p className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                Utilisateur: <strong className="text-white">Admin</strong>
                            </p>
                            <p className="flex items-start gap-2 mt-1">
                                <span className="text-amber-500 mt-0.5">•</span>
                                Vous pourrez changer ce PIN dans les paramètres.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowPinModal(false);
                                if (pendingProfile) {
                                    onLogin(pendingProfile);
                                }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all"
                        >
                            J'AI NOTÉ MON PIN
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaaSLogin;
