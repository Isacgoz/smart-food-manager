
import React, { useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload, Database, AlertTriangle, ShieldCheck } from 'lucide-react';

const Backup: React.FC = () => {
    const { exportData, importData, notify, restaurant } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${restaurant.name}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify("Base de données exportée avec succès", "success");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (window.confirm("Attention : l'importation va écraser toutes vos données actuelles. Voulez-vous continuer ?")) {
                    if (importData(content)) {
                        notify("Données restaurées avec succès. Reconnexion requise.", "success");
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        notify("Fichier invalide", "error");
                    }
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h2 className="text-3xl font-black text-slate-900">Centre de Sauvegarde</h2>
                <p className="text-slate-500">Sécurisez vos données en exportant votre base de données localement</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                        <Download size={40}/>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Exporter la Base</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        Téléchargez une copie complète de vos réglages, produits, stocks et factures. Utile pour garder une archive sur votre PC.
                    </p>
                    <button 
                        onClick={handleExport}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        TÉLÉCHARGER LA SAUVEGARDE
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                        <Upload size={40}/>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Importer des Données</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        Restaurez votre restaurant à partir d'un fichier JSON précédemment exporté. Attention, vos données actuelles seront supprimées.
                    </p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json" 
                        onChange={handleImport}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        CHOISIR UN FICHIER JSON
                    </button>
                </div>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl flex items-start gap-4">
                <AlertTriangle className="text-orange-600 shrink-0" size={24}/>
                <div>
                    <h4 className="font-black text-orange-900 uppercase text-sm mb-1">Conseil de Sécurité</h4>
                    <p className="text-orange-800 text-sm">
                        Bien que Smart Food enregistre vos données automatiquement sur ce navigateur, nous vous recommandons d'exporter votre base de données au moins une fois par semaine pour parer à tout incident matériel ou changement de poste.
                    </p>
                </div>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl flex items-start gap-4">
                <ShieldCheck className="text-emerald-600 shrink-0" size={24}/>
                <div>
                    <h4 className="font-black text-emerald-900 uppercase text-sm mb-1">Protection des Données</h4>
                    <p className="text-emerald-800 text-sm">
                        Votre identifiant de restaurant est lié à votre email : <strong>{restaurant.ownerEmail}</strong>. Si vous changez d'appareil, connectez-vous avec cet email pour retrouver vos accès SaaS.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Backup;
