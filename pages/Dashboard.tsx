
import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  Banknote, CreditCard, UserCheck, TrendingUp, AlertTriangle,
  ShieldCheck, Calculator, CheckCircle2, History, Activity, PieChart
} from 'lucide-react';
import { calculateEBE, calculateEmployeeRevenue, calculatePaymentTypeBreakdown } from '../shared/services/expenses';

const Dashboard: React.FC = () => {
  const { orders, users, cashDeclarations, declareCash, currentUser, products, ingredients, expenses } = useStore();

  // États pour le rapprochement de fin de journée
  const [closingCash, setClosingCash] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = orders.filter(o => o.status === 'COMPLETED' && o.date.startsWith(today));

    const cashTotal = completedToday.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
    const cardTotal = completedToday.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0);

    const openingDecl = cashDeclarations.find(d => d.date.startsWith(today) && d.type === 'OPENING');
    const openingAmount = openingDecl ? openingDecl.amount : 0;

    const theoreticalCash = openingAmount + cashTotal;

    // Calcul EBE journée
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const ebeData = calculateEBE(
      orders,
      expenses || [],
      products || [],
      ingredients || [],
      todayStart.toISOString(),
      todayEnd.toISOString()
    );

    // CA par employé
    const employeeRevenue = calculateEmployeeRevenue(orders, todayStart.toISOString(), todayEnd.toISOString());

    // Détail paiements journée
    const paymentBreakdown = calculatePaymentTypeBreakdown(orders, today);

    // Analyse par encaisseur (Traçabilité)
    const collectors: Record<string, { name: string, cash: number, card: number, total: number }> = {};
    completedToday.forEach(o => {
      const id = o.paidByUserId || o.userId;
      if (!collectors[id]) {
        collectors[id] = {
          name: users.find(u => u.id === id)?.name || 'Inconnu',
          cash: 0,
          card: 0,
          total: 0
        };
      }
      if (o.paymentMethod === 'CASH') collectors[id].cash += o.total;
      else collectors[id].card += o.total;
      collectors[id].total += o.total;
    });

    return {
      revenue: cashTotal + cardTotal,
      cashTotal,
      cardTotal,
      theoreticalCash,
      openingAmount,
      collectors: Object.values(collectors),
      ebeData,
      employeeRevenue,
      paymentBreakdown
    };
  }, [orders, users, cashDeclarations, products, ingredients, expenses]);

  const handleClosing = () => {
    const amount = parseFloat(closingCash);
    if (isNaN(amount) || !currentUser) return;
    declareCash(currentUser.id, amount, 'CLOSING');
    setIsClosing(true);
    setClosingCash('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase">Audit Financier</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Évaluation du {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="bg-emerald-600 text-white px-8 py-5 rounded-[28px] shadow-2xl shadow-emerald-900/20">
          <span className="text-[10px] font-black opacity-60 uppercase block tracking-widest">Chiffre d'Affaire</span>
          <span className="text-4xl font-black tracking-tighter">{stats.revenue.toFixed(2)} €</span>
        </div>
      </header>

      {/* SECTION EBE & RENTABILITÉ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-[32px] text-white shadow-2xl shadow-emerald-900/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} className="opacity-80"/>
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Marge Brute</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-2">{stats.ebeData.grossMargin.toFixed(2)} €</div>
          <div className="text-sm font-bold opacity-80">{stats.ebeData.grossMarginRate.toFixed(1)}% du CA</div>
        </div>

        <div className={`p-8 rounded-[32px] shadow-2xl ${stats.ebeData.isProfitable ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-900/20' : 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-900/20'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Activity size={24} className="opacity-80"/>
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">EBE</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-2">{stats.ebeData.ebe.toFixed(2)} €</div>
          <div className="text-sm font-bold opacity-80">{stats.ebeData.ebeRate.toFixed(1)}% du CA</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-[32px] text-white shadow-2xl shadow-purple-900/20">
          <div className="flex items-center gap-3 mb-4">
            <PieChart size={24} className="opacity-80"/>
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Coût Matière</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-2">{stats.ebeData.materialCost.toFixed(2)} €</div>
          <div className="text-sm font-bold opacity-80">{stats.revenue > 0 ? ((stats.ebeData.materialCost / stats.revenue) * 100).toFixed(1) : 0}% du CA</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-[32px] text-white shadow-2xl shadow-orange-900/20">
          <div className="flex items-center gap-3 mb-4">
            <Calculator size={24} className="opacity-80"/>
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Charges</span>
          </div>
          <div className="text-4xl font-black tracking-tighter mb-2">{stats.ebeData.expenses.totalExpenses.toFixed(2)} €</div>
          <div className="text-sm font-bold opacity-80">
            {stats.ebeData.expenses.fixed.toFixed(0)}€ fixes + {stats.ebeData.expenses.variable.toFixed(0)}€ var.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* SECTION RAPPROCHEMENT */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[44px] border-4 border-slate-950 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Calculator size={32}/></div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Clôture du Tiroir Caisse</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fond Initial (Matin)</span>
                  <span className="text-2xl font-black text-slate-900">{stats.openingAmount.toFixed(2)} €</span>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Espèces Encaissées</span>
                  <span className="text-2xl font-black text-emerald-600">+{stats.cashTotal.toFixed(2)} €</span>
                </div>
                <div className="p-8 bg-slate-950 rounded-[32px] text-white shadow-2xl">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Théorique à compter</span>
                  <span className="text-4xl font-black text-emerald-400 tracking-tighter">{stats.theoreticalCash.toFixed(2)} €</span>
                </div>
              </div>

              <div className="flex flex-col justify-center bg-emerald-50 p-8 rounded-[40px] border-2 border-emerald-100 border-dashed">
                <label className="text-center text-xs font-black text-emerald-800 uppercase tracking-widest mb-6">Montant réel compté</label>
                <div className="relative mb-8">
                  <input 
                    type="number" 
                    className="w-full bg-white border-4 border-emerald-200 rounded-[30px] p-8 text-5xl font-black text-center text-slate-950 outline-none focus:border-emerald-500 transition-all shadow-inner"
                    placeholder="0.00"
                    value={closingCash}
                    onChange={e => setClosingCash(e.target.value)}
                  />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-200 font-black text-3xl">€</span>
                </div>
                <button 
                  onClick={handleClosing}
                  className="w-full bg-slate-950 text-white py-6 rounded-[24px] font-black text-xl hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  <ShieldCheck size={24}/> Valider la Clôture
                </button>
              </div>
            </div>
          </div>

          {/* CA PAR EMPLOYÉ */}
          <div className="bg-white p-10 rounded-[44px] border-2 border-slate-100 shadow-sm">
            <h3 className="text-xl font-black mb-8 uppercase tracking-tighter flex items-center gap-3">
              <UserCheck className="text-blue-500" size={24}/> CA par Employé
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.collectors.map((c, i) => {
                const employeePercent = stats.revenue > 0 ? (c.total / stats.revenue) * 100 : 0;
                return (
                  <div key={i} className="flex flex-col p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">{c.name[0]}</div>
                      <div className="flex-1">
                        <span className="font-black text-slate-900 uppercase tracking-tight block">{c.name}</span>
                        <span className="text-xs text-slate-400 font-bold">{employeePercent.toFixed(1)}% du CA total</span>
                      </div>
                    </div>
                    <div className="mb-3 pt-3 border-t border-slate-200">
                      <div className="text-center mb-2">
                        <span className="text-2xl font-black text-emerald-600">{c.total.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <div className="text-left">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Espèces</span>
                          <span className="font-black text-slate-950">{c.cash.toFixed(2)} €</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Carte</span>
                          <span className="font-black text-slate-950">{c.card.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.collectors.length === 0 && (
                <p className="col-span-full py-10 text-center text-slate-400 font-bold italic">Aucune transaction enregistrée aujourd'hui.</p>
              )}
            </div>
          </div>

          {/* DÉTAIL ENCAISSEMENTS PAR JOUR */}
          <div className="bg-white p-10 rounded-[44px] border-2 border-slate-100 shadow-sm">
            <h3 className="text-xl font-black mb-8 uppercase tracking-tighter flex items-center gap-3">
              <Banknote className="text-emerald-500" size={24}/> Détail Encaissements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100">
                <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Espèces</span>
                <div className="text-3xl font-black text-emerald-700 mb-2">{stats.paymentBreakdown.cash.amount.toFixed(2)} €</div>
                <div className="text-sm text-emerald-600 font-bold">{stats.paymentBreakdown.cash.count} transaction(s)</div>
                <div className="text-xs text-emerald-500 font-bold mt-1">
                  {stats.revenue > 0 ? ((stats.paymentBreakdown.cash.amount / stats.revenue) * 100).toFixed(1) : 0}% du total
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100">
                <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Carte Bancaire</span>
                <div className="text-3xl font-black text-blue-700 mb-2">{stats.paymentBreakdown.card.amount.toFixed(2)} €</div>
                <div className="text-sm text-blue-600 font-bold">{stats.paymentBreakdown.card.count} transaction(s)</div>
                <div className="text-xs text-blue-500 font-bold mt-1">
                  {stats.revenue > 0 ? ((stats.paymentBreakdown.card.amount / stats.revenue) * 100).toFixed(1) : 0}% du total
                </div>
              </div>

              <div className="p-6 bg-slate-100 rounded-3xl border-2 border-slate-200">
                <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Total Journée</span>
                <div className="text-3xl font-black text-slate-900 mb-2">{stats.paymentBreakdown.total.amount.toFixed(2)} €</div>
                <div className="text-sm text-slate-600 font-bold">{stats.paymentBreakdown.total.count} transaction(s)</div>
                <div className="text-xs text-slate-500 font-bold mt-1">
                  Ticket moyen: {stats.paymentBreakdown.total.count > 0 ? (stats.paymentBreakdown.total.amount / stats.paymentBreakdown.total.count).toFixed(2) : '0.00'} €
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : RÉPARTITION & HISTORIQUE */}
        <div className="space-y-8">
          <div className="bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl">
            <h3 className="text-lg font-black mb-8 uppercase tracking-widest flex items-center gap-3">
              <TrendingUp className="text-emerald-400" size={24}/> Mix de Paiement
            </h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Espèces</span>
                  <span className="font-black text-emerald-400">{stats.cashTotal.toFixed(2)} €</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${(stats.cashTotal / (stats.revenue || 1)) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Carte Bancaire</span>
                  <span className="font-black text-blue-400">{stats.cardTotal.toFixed(2)} €</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${(stats.cardTotal / (stats.revenue || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm">
            <h3 className="text-lg font-black mb-6 uppercase tracking-widest flex items-center gap-3">
              <History className="text-orange-500" size={24}/> Dernières Clôtures
            </h3>
            <div className="space-y-4">
              {cashDeclarations.filter(d => d.type === 'CLOSING').slice(-5).reverse().map((d, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-[20px] border border-slate-100">
                  <div>
                    <p className="text-sm font-black text-slate-900">{new Date(d.date).toLocaleDateString('fr-FR')}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{users.find(u => u.id === d.userId)?.name}</p>
                  </div>
                  <span className="font-black text-slate-950 text-lg">{d.amount.toFixed(2)} €</span>
                </div>
              ))}
              {cashDeclarations.filter(d => d.type === 'CLOSING').length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-[20px]">
                  <AlertTriangle className="mx-auto text-slate-200 mb-2" size={32}/>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aucune clôture archivée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isClosing && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-sm animate-in zoom-in-95 duration-300 border-4 border-emerald-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={60}/>
            </div>
            <h3 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter uppercase">Caisse Clôturée</h3>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed uppercase text-xs tracking-widest">Le rapport de fin de journée a été archivé. Vous pouvez maintenant éteindre le système en toute sécurité.</p>
            <button 
              onClick={() => setIsClosing(false)}
              className="w-full bg-slate-950 text-white py-6 rounded-[24px] font-black text-xl hover:bg-black transition-all shadow-2xl uppercase tracking-tighter"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
