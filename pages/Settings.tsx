/**
 * Page de paramètres du restaurant
 * Gère la configuration de la politique de stock et autres paramètres
 */

import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, AlertTriangle, Shield, Bell } from 'lucide-react';
import { StockPolicy } from '../shared/types';
import { getStockPolicyDescription, getStockPolicyIcon } from '../services/stock-policy';
import { useStore } from '../shared/hooks/useStore';

const Settings: React.FC = () => {
  const { restaurant, updateRestaurant } = useStore();
  const [stockPolicy, setStockPolicy] = useState<StockPolicy>(
    (restaurant.stockPolicy as StockPolicy) || 'WARN'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateRestaurant({ stockPolicy });
      setSaveMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
    }
  };

  const stockPolicies: Array<{ value: StockPolicy; label: string; color: string }> = [
    { value: 'BLOCK', label: 'Bloquer', color: 'red' },
    { value: 'WARN', label: 'Avertir', color: 'yellow' },
    { value: 'SILENT', label: 'Silencieux', color: 'gray' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={32} className="text-slate-900" />
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase">
            Paramètres
          </h1>
        </div>
        <p className="text-slate-600 font-medium">
          Configurez le comportement de votre application
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Stock Policy Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} className="text-slate-700" />
          <h2 className="text-xl font-bold text-slate-900">
            Politique de Stock
          </h2>
        </div>

        <p className="text-slate-600 mb-6">
          Définissez comment l'application doit réagir lorsqu'un produit est en rupture de stock.
        </p>

        <div className="space-y-4">
          {stockPolicies.map((policy) => (
            <label
              key={policy.value}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                stockPolicy === policy.value
                  ? `border-${policy.color}-500 bg-${policy.color}-50`
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="stockPolicy"
                value={policy.value}
                checked={stockPolicy === policy.value}
                onChange={(e) => setStockPolicy(e.target.value as StockPolicy)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{getStockPolicyIcon(policy.value)}</span>
                  <span className="font-bold text-slate-900">{policy.label}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {getStockPolicyDescription(policy.value)}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Warning for SILENT mode */}
        {stockPolicy === 'SILENT' && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <strong>Attention:</strong> Le mode silencieux peut entraîner des stocks négatifs et des
              incohérences dans votre inventaire. Utilisez-le uniquement si vous gérez le stock manuellement.
            </div>
          </div>
        )}

        {/* Recommendation for BLOCK mode */}
        {stockPolicy === 'BLOCK' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Shield size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <strong>Recommandé:</strong> Ce mode garantit que vous ne vendrez jamais un produit sans
              stock disponible. Idéal pour une gestion rigoureuse de l'inventaire.
            </div>
          </div>
        )}
      </div>

      {/* Future Settings Sections */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={24} className="text-slate-400" />
          <h2 className="text-xl font-bold text-slate-400">
            Notifications (Bientôt disponible)
          </h2>
        </div>
        <p className="text-slate-400">
          Configurez les alertes pour les stocks faibles, les commandes en attente, etc.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={20} />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">💡 Conseil</h3>
        <p className="text-sm text-blue-800">
          Les paramètres sont enregistrés immédiatement et s'appliquent à toutes les nouvelles commandes.
          Les commandes en cours ne sont pas affectées.
        </p>
      </div>
    </div>
  );
};

export default Settings;
