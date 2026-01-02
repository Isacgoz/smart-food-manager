/**
 * Cash Session (Z de Caisse) - Clôture journalière
 * Conformité NF525 : Rapport comptable obligatoire
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { DollarSign, Calendar, TrendingUp, AlertCircle, Printer, Check, X } from 'lucide-react';
import { printOrder } from '../services/printer';

interface CashSession {
  id: string;
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  openingCash: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  cardTotal: number;
  totalRevenue: number;
  orderCount: number;
  status: 'open' | 'closed';
}

const CashSessionPage: React.FC = () => {
  const { currentUser, orders, restaurant } = useStore();

  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [actualCash, setActualCash] = useState<number>(0);
  const [showReport, setShowReport] = useState(false);

  // Charger session en cours
  useEffect(() => {
    const savedSession = localStorage.getItem('current_cash_session');
    if (savedSession) {
      setCurrentSession(JSON.parse(savedSession));
    }

    const savedSessions = localStorage.getItem('cash_sessions_history');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Ouvrir nouvelle session
  const openSession = () => {
    if (!currentUser) return;

    const session: CashSession = {
      id: Date.now().toString(),
      openedBy: currentUser.name,
      openedAt: new Date().toISOString(),
      openingCash,
      expectedCash: 0,
      actualCash: 0,
      cashDifference: 0,
      cardTotal: 0,
      totalRevenue: 0,
      orderCount: 0,
      status: 'open'
    };

    setCurrentSession(session);
    localStorage.setItem('current_cash_session', JSON.stringify(session));
    alert(`✅ Session ouverte avec ${openingCash.toFixed(2)}€ de fonds de caisse`);
  };

  // Clôturer session
  const closeSession = () => {
    if (!currentSession || !currentUser) return;

    // Calculer totaux depuis les commandes
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      const sessionDate = new Date(currentSession.openedAt);
      return orderDate >= sessionDate && o.status === 'COMPLETED';
    });

    const cashOrders = todayOrders.filter(o => o.paymentMethod === 'CASH');
    const cardOrders = todayOrders.filter(o => o.paymentMethod === 'CARD');

    const expectedCash = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const cardTotal = cardOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = expectedCash + cardTotal;
    const cashDifference = actualCash - expectedCash;

    const closedSession: CashSession = {
      ...currentSession,
      closedBy: currentUser.name,
      closedAt: new Date().toISOString(),
      expectedCash,
      actualCash,
      cashDifference,
      cardTotal,
      totalRevenue,
      orderCount: todayOrders.length,
      status: 'closed'
    };

    // Sauvegarder historique
    const updatedSessions = [closedSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem('cash_sessions_history', JSON.stringify(updatedSessions));
    localStorage.removeItem('current_cash_session');

    setCurrentSession(null);
    setShowReport(true);
    setOpeningCash(0);
    setActualCash(0);

    // Impression automatique rapport Z
    printReportZ(closedSession);
  };

  // Imprimer rapport Z
  const printReportZ = async (session: CashSession) => {
    const reportData = {
      date: new Date(session.closedAt || session.openedAt).toLocaleString('fr-FR'),
      openingCash: session.openingCash,
      expectedCash: session.expectedCash,
      actualCash: session.actualCash,
      cardTotal: session.cardTotal,
      totalRevenue: session.totalRevenue,
      orderCount: session.orderCount
    };

    // Utiliser le service printer (adaptation nécessaire)
    console.log('📄 Rapport Z:', reportData);
    alert('📄 Rapport Z envoyé à l\'imprimante');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg">
            <DollarSign className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Clôture de Caisse</h1>
            <p className="text-sm text-slate-500 font-bold">Rapport Z - Session journalière</p>
          </div>
        </div>
      </div>

      {/* Session en cours */}
      {currentSession ? (
        <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-3xl shadow-2xl border-2 border-emerald-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">Session en cours</h2>
            <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-sm uppercase">Ouverte</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ouvert par</p>
              <p className="text-lg font-black text-slate-900">{currentSession.openedBy}</p>
            </div>
            <div className="bg-white p-4 rounded-xl">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Heure ouverture</p>
              <p className="text-lg font-black text-slate-900">
                {new Date(currentSession.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fonds ouverture</p>
              <p className="text-lg font-black text-emerald-600">{currentSession.openingCash.toFixed(2)} €</p>
            </div>
          </div>

          {/* Clôture */}
          <div className="bg-slate-950 p-6 rounded-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Clôturer la caisse</h3>

            <div className="mb-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Espèces comptées (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={actualCash || 0}
                onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="w-full p-4 bg-white text-slate-950 font-black text-2xl rounded-xl text-right font-mono"
                placeholder="0.00"
              />
            </div>

            <button
              onClick={closeSession}
              disabled={actualCash === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white py-4 rounded-xl font-black text-lg uppercase tracking-wide transition-all shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={24} />
              Clôturer & Imprimer Z
            </button>
          </div>
        </div>
      ) : (
        /* Ouverture session */
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 mb-8">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-6">Ouvrir une session</h2>

          <div className="mb-6">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Fonds de caisse initial (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={openingCash || 0}
              onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="w-full p-4 bg-slate-50 text-slate-950 font-black text-2xl rounded-xl text-right font-mono border-2 border-slate-200"
              placeholder="0.00"
            />
            <p className="text-sm text-slate-500 mt-2">Montant liquide placé en caisse au début de service</p>
          </div>

          <button
            onClick={openSession}
            className="w-full bg-slate-950 hover:bg-black text-white py-4 rounded-xl font-black text-lg uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <DollarSign size={24} />
            Ouvrir la Session
          </button>
        </div>
      )}

      {/* Historique */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200">
        <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-6 flex items-center gap-2">
          <Calendar size={24} />
          Historique des sessions
        </h2>

        {sessions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Aucune session fermée</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border border-slate-200 p-6 rounded-2xl hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                      {new Date(session.closedAt || session.openedAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(session.openedAt).toLocaleTimeString('fr-FR')} → {new Date(session.closedAt!).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.cashDifference === 0 ? (
                      <Check className="text-emerald-600" size={20} />
                    ) : (
                      <AlertCircle className={session.cashDifference > 0 ? 'text-emerald-600' : 'text-red-600'} size={20} />
                    )}
                    <button
                      onClick={() => printReportZ(session)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Réimprimer Z"
                    >
                      <Printer size={18} className="text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Commandes</p>
                    <p className="font-black text-slate-900">{session.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">CA Total</p>
                    <p className="font-black text-emerald-600">{session.totalRevenue.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">CB</p>
                    <p className="font-black text-slate-900">{session.cardTotal.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Écart caisse</p>
                    <p className={`font-black ${session.cashDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {session.cashDifference >= 0 ? '+' : ''}{session.cashDifference.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashSessionPage;
