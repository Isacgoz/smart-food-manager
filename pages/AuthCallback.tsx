import { useEffect, useState } from 'react';
import { supabase } from '../services/storage';
import { Eye, EyeOff } from 'lucide-react';
import { logAuditEvent } from '../services/auditLog';

/**
 * Page de callback après confirmation email Supabase
 * URL: /auth/callback?token=xxx ou /auth/callback?type=recovery
 */
export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'reset_password'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  const navigate = (path: string) => {
    window.location.href = path === '/dashboard' ? '/' : '/';
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmPassword) {
      setResetError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      if (!supabase) throw new Error('Supabase non configuré');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Audit log: réinitialisation réussie
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        logAuditEvent({
          company_id: user.id,
          auth_user_id: user.id,
          event_type: 'PASSWORD_RESET_SUCCESS',
          event_data: { email: user.email }
        });
      }

      setStatus('success');
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      setResetError(error.message || 'Erreur lors de la réinitialisation');
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase non configuré');
        }

        // Détecter si c'est un recovery (mot de passe oublié)
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');

        if (type === 'recovery') {
          setStatus('reset_password');
          return;
        }

        // Supabase gère automatiquement le token dans l'URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          setStatus('success');

          // Récupérer profil restaurant depuis app_state
          const profile = await loadRestaurantProfile(session.user.id);

          // Sauvegarder en localStorage pour accès rapide
          localStorage.setItem('restaurant_profile', JSON.stringify(profile));
          localStorage.setItem('supabase_session', JSON.stringify(session));

          // Rediriger vers dashboard après 2s
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          throw new Error('Aucune session trouvée');
        }
      } catch (error: any) {
        console.error('Callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Erreur lors de la confirmation');

        // Rediriger vers login après 3s
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, []);

  if (status === 'reset_password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="bg-slate-900 border border-slate-700 rounded-[32px] p-8 max-w-md w-full shadow-2xl">
          <h1 className="text-2xl font-black text-white mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Choisissez un nouveau mot de passe sécurisé.
          </p>

          {resetError && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-2xl mb-6 text-xs font-bold">
              {resetError}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 pr-12 outline-none focus:border-emerald-500 transition-all text-white font-bold"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                Confirmer le mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-all text-white font-bold"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all"
            >
              RÉINITIALISER
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
          <div className="relative inline-block mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Confirmation de votre email
          </h1>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions votre compte...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Email confirmé avec succès!
          </h1>
          <p className="text-gray-600 mb-4">
            Votre compte est maintenant actif.
          </p>
          <div className="flex items-center justify-center text-indigo-600">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Redirection vers le dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Erreur de confirmation
        </h1>
        <p className="text-gray-600 mb-4">
          {errorMessage || 'Une erreur est survenue lors de la confirmation de votre email.'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Vous allez être redirigé vers la page de connexion...
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}

/**
 * Charge le profil restaurant depuis Supabase app_state
 */
async function loadRestaurantProfile(userId: string) {
  try {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Extraire restaurant du JSON
    const appData = data.data as any;
    return appData.restaurant;
  } catch (error) {
    console.error('Error loading restaurant profile:', error);

    // Fallback: créer profil minimal si non trouvé
    return {
      id: userId,
      name: 'Restaurant Demo',
      ownerEmail: 'testprod@demo.com',
      plan: 'BUSINESS',
      createdAt: new Date().toISOString(),
      stockPolicy: 'WARN'
    };
  }
}
