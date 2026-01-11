/**
 * Page d'exports comptables
 * FEC, CA3, Charges
 */

import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import {
  FileText, Download, Calendar, Filter, CheckCircle, AlertCircle,
  FileSpreadsheet, FileJson, TrendingUp, DollarSign, Receipt
} from 'lucide-react';
import {
  generateFECExport,
  downloadFECFile,
  FECExportOptions
} from '../services/accounting-fec';
import {
  generateCA3Export,
  downloadCA3CSV,
  downloadCA3JSON,
  CA3ExportOptions
} from '../services/accounting-ca3';
import {
  generateExpensesExport,
  downloadExpensesFile,
  ExpenseExportOptions
} from '../services/accounting-expenses';

const Exports: React.FC = () => {
  const { orders, expenses, currentUser, restaurants } = useStore();
  
  const restaurant = restaurants?.find(r => r.id === currentUser?.restaurantId);
  
  // États pour les filtres de date
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Premier jour du mois
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  // États pour les exports en cours
  const [exportingFEC, setExportingFEC] = useState(false);
  const [exportingCA3, setExportingCA3] = useState(false);
  const [exportingExpenses, setExportingExpenses] = useState(false);
  
  // États pour les messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Statistiques de la période sélectionnée
  const periodStats = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end && order.status === 'COMPLETED';
    });
    
    const filteredExpenses = expenses?.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    }) || [];
    
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      ordersCount: filteredOrders.length,
      expensesCount: filteredExpenses.length,
      totalSales,
      totalExpenses,
      netResult: totalSales - totalExpenses
    };
  }, [orders, expenses, startDate, endDate]);

  // Gestion des messages
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Export FEC
  const handleExportFEC = async () => {
    if (!restaurant) {
      showError('Restaurant non trouvé');
      return;
    }

    setExportingFEC(true);
    try {
      const options: FECExportOptions = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        siret: restaurant.siret
      };

      const csv = await generateFECExport(
        orders.filter(o => o.status === 'COMPLETED'),
        expenses || [],
        options
      );

      downloadFECFile(csv, options);
      showSuccess('Export FEC téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export FEC:', error);
      showError('Erreur lors de l\'export FEC');
    } finally {
      setExportingFEC(false);
    }
  };

  // Export CA3 CSV
  const handleExportCA3CSV = async () => {
    if (!restaurant) {
      showError('Restaurant non trouvé');
      return;
    }

    setExportingCA3(true);
    try {
      const options: CA3ExportOptions = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        siret: restaurant.siret
      };

      const csv = await generateCA3Export(
        orders.filter(o => o.status === 'COMPLETED'),
        expenses || [],
        options,
        'csv'
      );

      downloadCA3CSV(csv, options);
      showSuccess('Export CA3 CSV téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export CA3:', error);
      showError('Erreur lors de l\'export CA3');
    } finally {
      setExportingCA3(false);
    }
  };

  // Export CA3 JSON
  const handleExportCA3JSON = async () => {
    if (!restaurant) {
      showError('Restaurant non trouvé');
      return;
    }

    setExportingCA3(true);
    try {
      const options: CA3ExportOptions = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        siret: restaurant.siret
      };

      const json = await generateCA3Export(
        orders.filter(o => o.status === 'COMPLETED'),
        expenses || [],
        options,
        'json'
      );

      downloadCA3JSON(json, options);
      showSuccess('Export CA3 JSON téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export CA3:', error);
      showError('Erreur lors de l\'export CA3');
    } finally {
      setExportingCA3(false);
    }
  };

  // Export Charges CSV
  const handleExportExpensesCSV = async () => {
    if (!restaurant) {
      showError('Restaurant non trouvé');
      return;
    }

    setExportingExpenses(true);
    try {
      const options: ExpenseExportOptions = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        format: 'csv'
      };

      const csv = await generateExpensesExport(expenses || [], options);
      downloadExpensesFile(csv, options, 'csv');
      showSuccess('Export des charges CSV téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export charges:', error);
      showError('Erreur lors de l\'export des charges');
    } finally {
      setExportingExpenses(false);
    }
  };

  // Export Charges JSON
  const handleExportExpensesJSON = async () => {
    if (!restaurant) {
      showError('Restaurant non trouvé');
      return;
    }

    setExportingExpenses(true);
    try {
      const options: ExpenseExportOptions = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        format: 'json'
      };

      const json = await generateExpensesExport(expenses || [], options);
      downloadExpensesFile(json, options, 'json');
      showSuccess('Export des charges JSON téléchargé avec succès');
    } catch (error) {
      console.error('Erreur export charges:', error);
      showError('Erreur lors de l\'export des charges');
    } finally {
      setExportingExpenses(false);
    }
  };

  // Raccourcis de période
  const setCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setCurrentYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Exports Comptables
        </h1>
        <p className="text-gray-600">
          Générez vos exports pour votre expert-comptable (FEC, CA3, Charges)
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Filtres de période */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Période d'export</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Raccourcis */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={setCurrentMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Mois en cours
          </button>
          <button
            onClick={setLastMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Mois dernier
          </button>
          <button
            onClick={setCurrentYear}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Année en cours
          </button>
        </div>
      </div>

      {/* Statistiques de la période */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-gray-600">Commandes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{periodStats.ordersCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <span className="text-sm font-medium text-gray-600">Ventes TTC</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {periodStats.totalSales.toFixed(2)} €
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-orange-600" size={20} />
            <span className="text-sm font-medium text-gray-600">Charges</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {periodStats.totalExpenses.toFixed(2)} €
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className={periodStats.netResult >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
            <span className="text-sm font-medium text-gray-600">Résultat net</span>
          </div>
          <p className={`text-2xl font-bold ${periodStats.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {periodStats.netResult.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Cartes d'export */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export FEC */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Export FEC</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Fichier des Écritures Comptables conforme à la norme française.
            Format requis pour les contrôles fiscaux.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>Ventes + Achats</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>TVA détaillée</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>Format pipe (|)</span>
            </div>
          </div>

          <button
            onClick={handleExportFEC}
            disabled={exportingFEC}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {exportingFEC ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Export en cours...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>Télécharger FEC</span>
              </>
            )}
          </button>
        </div>

        {/* Export CA3 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileSpreadsheet className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Export CA3</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Déclaration de TVA mensuelle ou trimestrielle.
            Calcul automatique de la TVA collectée et déductible.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>TVA 5.5%, 10%, 20%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>TVA à payer calculée</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>CSV ou JSON</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportCA3CSV}
              disabled={exportingCA3}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {exportingCA3 ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Export en cours...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={20} />
                  <span>Télécharger CSV</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCA3JSON}
              disabled={exportingCA3}
              className="w-full px-4 py-3 bg-green-100 hover:bg-green-200 disabled:bg-gray-200 text-green-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileJson size={20} />
              <span>Télécharger JSON</span>
            </button>
          </div>
        </div>

        {/* Export Charges */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="text-orange-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Export Charges</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Export détaillé de toutes les dépenses avec catégorisation comptable.
            Compatible Sage, QuickBooks.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>Détail par catégorie</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>Comptes comptables</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-600" />
              <span>Résumé + détail</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportExpensesCSV}
              disabled={exportingExpenses}
              className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {exportingExpenses ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Export en cours...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={20} />
                  <span>Télécharger CSV</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportExpensesJSON}
              disabled={exportingExpenses}
              className="w-full px-4 py-3 bg-orange-100 hover:bg-orange-200 disabled:bg-gray-200 text-orange-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileJson size={20} />
              <span>Télécharger JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Informations légales */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          ℹ️ Informations importantes
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <strong>FEC :</strong> Obligatoire pour les contrôles fiscaux. Conservez tous vos fichiers FEC pendant 6 ans.</li>
          <li>• <strong>CA3 :</strong> Déclaration mensuelle ou trimestrielle selon votre régime de TVA.</li>
          <li>• <strong>Charges :</strong> Transmettez ce fichier à votre expert-comptable pour la saisie comptable.</li>
          <li>• <strong>Archivage :</strong> Tous les exports sont horodatés et traçables pour conformité NF525.</li>
        </ul>
      </div>
    </div>
  );
};

export default Exports;
