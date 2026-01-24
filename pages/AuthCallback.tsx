import { useEffect, useState } from 'react';
import { supabase } from '../services/storage';

/**
 * Page de callback après confirmation email Supabase
 * URL: /auth/callback?token=xxx
 */
export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const navigate = (path: string) => {
    window.location.href = path === '/dashboard' ? '/' : '/';
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase non configuré');
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
