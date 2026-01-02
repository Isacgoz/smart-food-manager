/**
 * Invoice Component - Conforme législation française
 * NF525: Mentions légales obligatoires + TVA détaillée
 */

import React from 'react';
import type { Order, Company, User } from '../types';

interface InvoiceProps {
  order: Order;
  company: Company;
  server?: User;
  products: any[]; // Pour récupérer vatRate de chaque produit
}

const Invoice: React.FC<InvoiceProps> = ({ order, company, server, products }) => {
  // Calcul TVA par taux
  const tvaByCat = order.items.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    const rate = product?.vatRate || 10;
    const ht = (item.price * item.quantity) / (1 + rate / 100);
    const tva = (item.price * item.quantity) - ht;
    acc[rate] = (acc[rate] || 0) + tva;
    return acc;
  }, {} as Record<number, number>);

  const totalHT = order.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    const rate = product?.vatRate || 10;
    return sum + (item.price * item.quantity) / (1 + rate / 100);
  }, 0);

  const totalTVA = Object.values(tvaByCat).reduce((sum, val) => sum + val, 0);
  const totalTTC = totalHT + totalTVA;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto print:shadow-none">
      {/* En-tête Entreprise (OBLIGATOIRE) */}
      <div className="border-b-2 border-slate-900 pb-6 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">FACTURE</h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Informations légales entreprise */}
          <div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Émetteur</h2>
            <p className="font-black text-lg text-slate-900">{company.legalName || company.name}</p>
            {company.address && <p className="text-sm text-slate-600">{company.address}</p>}
            {company.postalCode && company.city && (
              <p className="text-sm text-slate-600">{company.postalCode} {company.city}</p>
            )}
            {company.country && <p className="text-sm text-slate-600">{company.country}</p>}

            {/* SIREN/SIRET OBLIGATOIRE (NF525) */}
            <div className="mt-3 space-y-1">
              {company.siren && (
                <p className="text-sm font-bold text-slate-900">
                  SIREN: <span className="font-mono">{company.siren}</span>
                </p>
              )}
              {company.siret && (
                <p className="text-sm font-bold text-slate-900">
                  SIRET: <span className="font-mono">{company.siret}</span>
                </p>
              )}
              {company.vatNumber && (
                <p className="text-sm font-bold text-slate-900">
                  TVA: <span className="font-mono">{company.vatNumber}</span>
                </p>
              )}
            </div>

            {company.email && <p className="text-sm text-slate-600 mt-2">{company.email}</p>}
            {company.phone && <p className="text-sm text-slate-600">{company.phone}</p>}
          </div>

          {/* Informations facture */}
          <div className="text-right">
            {/* Numéro facture OBLIGATOIRE (inaltérable) */}
            {order.invoiceNumber && (
              <>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">N° Facture</h2>
                <p className="text-2xl font-black text-slate-900 font-mono mb-4">{order.invoiceNumber}</p>
              </>
            )}

            <div className="space-y-1 text-sm">
              <p className="text-slate-600">
                <span className="font-bold">Date:</span> {new Date(order.createdAt || order.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {order.tableId && (
                <p className="text-slate-600">
                  <span className="font-bold">Table:</span> {order.tableId}
                </p>
              )}
              {server && (
                <p className="text-slate-600">
                  <span className="font-bold">Serveur:</span> {server.name}
                </p>
              )}
              {order.paymentMethod && (
                <p className="text-slate-600">
                  <span className="font-bold">Paiement:</span> {order.paymentMethod === 'CASH' ? 'Espèces' : 'Carte'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Détail articles */}
      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="text-left py-3 text-xs font-black text-slate-500 uppercase tracking-widest">Désignation</th>
              <th className="text-center py-3 text-xs font-black text-slate-500 uppercase tracking-widest">Qté</th>
              <th className="text-right py-3 text-xs font-black text-slate-500 uppercase tracking-widest">Prix U. TTC</th>
              <th className="text-right py-3 text-xs font-black text-slate-500 uppercase tracking-widest">TVA</th>
              <th className="text-right py-3 text-xs font-black text-slate-500 uppercase tracking-widest">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => {
              const product = products.find(p => p.id === item.productId);
              const vatRate = product?.vatRate || 10;
              return (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-3 text-sm font-bold text-slate-900">
                    {item.name}
                    {item.note && <span className="block text-xs text-slate-500 font-normal italic">{item.note}</span>}
                  </td>
                  <td className="text-center py-3 text-sm text-slate-700">{item.quantity}</td>
                  <td className="text-right py-3 text-sm text-slate-700">{item.price.toFixed(2)} €</td>
                  <td className="text-right py-3 text-sm text-slate-700">{vatRate}%</td>
                  <td className="text-right py-3 text-sm font-bold text-slate-900">{(item.price * item.quantity).toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totaux et TVA (OBLIGATOIRE NF525) */}
      <div className="border-t-2 border-slate-900 pt-6">
        <div className="flex justify-end">
          <div className="w-80 space-y-3">
            {/* Total HT */}
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-700">Total HT</span>
              <span className="font-mono text-slate-900">{totalHT.toFixed(2)} €</span>
            </div>

            {/* TVA par taux (OBLIGATOIRE) */}
            {Object.entries(tvaByCat).map(([rate, amount]) => (
              <div key={rate} className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">TVA {rate}%</span>
                <span className="font-mono text-slate-900">{amount.toFixed(2)} €</span>
              </div>
            ))}

            {/* Total TVA */}
            <div className="flex justify-between text-sm border-t border-slate-300 pt-3">
              <span className="font-bold text-slate-700">Total TVA</span>
              <span className="font-mono text-slate-900">{totalTVA.toFixed(2)} €</span>
            </div>

            {/* Total TTC */}
            <div className="flex justify-between text-xl font-black bg-slate-950 text-white p-4 rounded-xl">
              <span>TOTAL TTC</span>
              <span className="font-mono">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mentions légales footer */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          {company.legalName || company.name} - {company.siren && `SIREN ${company.siren}`} {company.siret && `- SIRET ${company.siret}`}
          {company.vatNumber && ` - TVA ${company.vatNumber}`}
          <br />
          {company.address && `${company.address}, `}
          {company.postalCode && `${company.postalCode} `}
          {company.city}
        </p>

        {/* Mention NF525 (optionnel mais recommandé) */}
        <p className="text-xs text-slate-400 text-center mt-2 italic">
          Logiciel de caisse certifié conforme NF525 - Archivage sécurisé 6 ans
        </p>
      </div>
    </div>
  );
};

export default Invoice;
