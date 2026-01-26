import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Expense, ExpenseCategory, ExpenseType } from '../shared/types';
import { Plus, Edit2, Trash2, DollarSign, TrendingDown, Calendar, CheckCircle, XCircle } from 'lucide-react';

const Expenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, currentUser } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'RENT',
    type: 'FIXED',
    frequency: 'MONTHLY',
    isPaid: false
  });

  const categoryLabels: Record<ExpenseCategory, string> = {
    RENT: 'Loyer',
    SALARIES: 'Salaires',
    ELECTRICITY: 'Électricité',
    WATER: 'Eau',
    GAS: 'Gaz',
    INTERNET: 'Internet/Téléphone',
    INSURANCE: 'Assurances',
    MAINTENANCE: 'Maintenance/Réparations',
    MARKETING: 'Marketing/Publicité',
    ACCOUNTING: 'Comptabilité',
    BANK_FEES: 'Frais bancaires',
    WASTE_MANAGEMENT: 'Gestion déchets',
    CLEANING: 'Produits nettoyage',
    LICENSES: 'Licences/Permis',
    OTHER: 'Autres'
  };

  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const fixedExpenses = expenses.filter(e => e.type === 'FIXED').reduce((sum, e) => sum + e.amount, 0);
    const variableExpenses = expenses.filter(e => e.type === 'VARIABLE').reduce((sum, e) => sum + e.amount, 0);
    const unpaidExpenses = expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);

    return { totalExpenses, fixedExpenses, variableExpenses, unpaidExpenses };
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.amount || !formData.date || !currentUser) return;

    if (editingId) {
      updateExpense(editingId, formData);
      setEditingId(null);
    } else {
      addExpense({
        ...formData,
        restaurantId: 'current',
        createdBy: currentUser.id
      } as Omit<Expense, 'id' | 'createdAt'>);
      setIsAdding(false);
    }

    setFormData({
      category: 'RENT',
      type: 'FIXED',
      frequency: 'MONTHLY',
      isPaid: false
    });
  };

  const handleEdit = (expense: Expense) => {
    setFormData(expense);
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette dépense ?')) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">Gestion des Charges</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Dépenses fixes & variables</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-950 text-white px-8 py-5 rounded-[28px] shadow-2xl hover:bg-black transition-all font-black uppercase tracking-tight flex items-center gap-3"
        >
          <Plus size={20} /> Nouvelle Charge
        </button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 rounded-[32px] text-white shadow-2xl shadow-red-900/20">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Total Charges</span>
          </div>
          <div className="text-4xl font-black tracking-tighter">{stats.totalExpenses.toFixed(2)} €</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-[32px] text-white shadow-2xl shadow-orange-900/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown size={24} className="opacity-80" />
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Charges Fixes</span>
          </div>
          <div className="text-4xl font-black tracking-tighter">{stats.fixedExpenses.toFixed(2)} €</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-8 rounded-[32px] text-white shadow-2xl shadow-yellow-900/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown size={24} className="opacity-80" />
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Charges Variables</span>
          </div>
          <div className="text-4xl font-black tracking-tighter">{stats.variableExpenses.toFixed(2)} €</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-[32px] text-white shadow-2xl shadow-purple-900/20">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={24} className="opacity-80" />
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Impayés</span>
          </div>
          <div className="text-4xl font-black tracking-tighter">{stats.unpaidExpenses.toFixed(2)} €</div>
        </div>
      </div>

      {/* LISTE DÉPENSES */}
      <div className="bg-white p-10 rounded-[44px] border-2 border-slate-100 shadow-sm">
        <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Liste des Charges</h3>
        <div className="space-y-4">
          {expenses.sort((a, b) => b.date.localeCompare(a.date)).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-slate-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase ${expense.type === 'FIXED' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {expense.type === 'FIXED' ? 'Fixe' : 'Variable'}
                  </span>
                  <span className="font-black text-slate-900 uppercase tracking-tight">{expense.label}</span>
                  <span className="text-xs text-slate-400 font-bold">{categoryLabels[expense.category]}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="font-bold">{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
                  <span className="font-bold uppercase text-[10px] tracking-widest">{expense.frequency}</span>
                  {expense.isPaid ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle size={14} /> Payé
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      <XCircle size={14} /> Impayé
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-3xl font-black text-red-600">{expense.amount.toFixed(2)} €</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="p-3 bg-blue-100 text-blue-600 rounded-2xl hover:bg-blue-200 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-3 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="text-center py-16 text-slate-400 font-bold italic">Aucune charge enregistrée</p>
          )}
        </div>
      </div>

      {/* MODAL AJOUT/EDIT */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[50px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-12 pb-6 flex-shrink-0">
              <h3 className="text-3xl font-black text-slate-950 mb-8 tracking-tighter uppercase">
                {editingId ? 'Modifier' : 'Nouvelle'} Charge
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-12 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                    required
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseType })}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                    required
                  >
                    <option value="FIXED">Fixe</option>
                    <option value="VARIABLE">Variable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Libellé</label>
                <input
                  type="text"
                  value={formData.label || ''}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                  placeholder="Description de la charge"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Montant (€)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={typeof formData.amount === 'number' ? formData.amount : formData.amount || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (val === '' || val.endsWith('.') || val.endsWith(',')) {
                        setFormData({ ...formData, amount: val as any });
                      } else {
                        const num = parseFloat(val);
                        if (!isNaN(num)) setFormData({ ...formData, amount: num });
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.replace(',', '.');
                      const num = val === '' ? 0 : parseFloat(val);
                      if (!isNaN(num)) setFormData({ ...formData, amount: num });
                    }}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Fréquence</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Expense['frequency'] })}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                    required
                  >
                    <option value="MONTHLY">Mensuelle</option>
                    <option value="QUARTERLY">Trimestrielle</option>
                    <option value="YEARLY">Annuelle</option>
                    <option value="ONE_TIME">Ponctuelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Statut Paiement</label>
                  <select
                    value={formData.isPaid ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.value === 'true' })}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                  >
                    <option value="false">Impayé</option>
                    <option value="true">Payé</option>
                  </select>
                </div>
              </div>

              {formData.isPaid && (
                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Date de Paiement</label>
                  <input
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Notes (optionnel)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-6 py-4 rounded-[20px] border-2 border-slate-200 font-bold focus:border-slate-950 outline-none resize-none"
                  rows={3}
                  placeholder="Notes complémentaires..."
                />
              </div>

              </div>
              <div className="flex gap-4 pt-6 px-12 pb-12 bg-white rounded-b-[50px] flex-shrink-0 border-t border-slate-100 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-slate-950 text-white py-6 rounded-[24px] font-black text-xl hover:bg-black transition-all shadow-2xl uppercase tracking-tighter"
                >
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({ category: 'RENT', type: 'FIXED', frequency: 'MONTHLY', isPaid: false });
                  }}
                  className="px-8 py-6 rounded-[24px] border-2 border-slate-200 font-black text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-tighter"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
