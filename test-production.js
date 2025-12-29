#!/usr/bin/env node

/**
 * Script de Vérification Production - Smart Food Manager
 * Vérifie que tous les bloquants critiques sont résolus
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 VÉRIFICATION CONFIGURATION PRODUCTION\n');
console.log('='.repeat(50));

let errors = [];
let warnings = [];
let success = [];

// ============================================
// 1. Vérifier .env local
// ============================================
console.log('\n📁 1. Fichier .env local...');
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8');

  if (envContent.includes('VITE_SUPABASE_URL=') && !envContent.includes('VITE_SUPABASE_URL=\n')) {
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    if (urlMatch && urlMatch[1].trim() && !urlMatch[1].includes('your-project')) {
      success.push('✅ VITE_SUPABASE_URL configurée');
    } else {
      errors.push('❌ VITE_SUPABASE_URL vide ou valeur par défaut');
    }
  } else {
    errors.push('❌ VITE_SUPABASE_URL manquante');
  }

  if (envContent.includes('VITE_SUPABASE_ANON_KEY=') && !envContent.includes('VITE_SUPABASE_ANON_KEY=\n')) {
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    if (keyMatch && keyMatch[1].trim() && keyMatch[1].startsWith('eyJ')) {
      success.push('✅ VITE_SUPABASE_ANON_KEY configurée');
    } else {
      errors.push('❌ VITE_SUPABASE_ANON_KEY vide ou invalide (doit commencer par eyJ)');
    }
  } else {
    errors.push('❌ VITE_SUPABASE_ANON_KEY manquante');
  }
} catch (err) {
  warnings.push('⚠️  Fichier .env non trouvé (normal si config Vercel uniquement)');
}

// ============================================
// 2. Vérifier Build
// ============================================
console.log('\n🔨 2. Build production...');
try {
  const distExists = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf8');
  success.push('✅ Build dist/ existe');
} catch (err) {
  warnings.push('⚠️  Build dist/ non trouvé - Exécuter: npm run build');
}

// ============================================
// 3. Vérifier PWA
// ============================================
console.log('\n📱 3. PWA Configuration...');
try {
  const manifest = JSON.parse(readFileSync(join(__dirname, 'public', 'manifest.json'), 'utf8'));

  if (manifest.name && manifest.short_name) {
    success.push('✅ manifest.json valide');
  } else {
    warnings.push('⚠️  manifest.json incomplet');
  }

  // Vérifier icons
  const icons = manifest.icons || [];
  if (icons.length >= 3) {
    success.push(`✅ ${icons.length} icônes PWA définies`);
  } else {
    warnings.push(`⚠️  Seulement ${icons.length} icônes (recommandé: 8+)`);
  }
} catch (err) {
  errors.push('❌ manifest.json manquant ou invalide');
}

// ============================================
// 4. Vérifier SQL Setup
// ============================================
console.log('\n💾 4. SQL Setup...');
try {
  const sqlContent = readFileSync(join(__dirname, 'supabase-setup.sql'), 'utf8');

  if (sqlContent.includes('CREATE TABLE IF NOT EXISTS app_state')) {
    success.push('✅ supabase-setup.sql prêt à être exécuté');
  }

  if (sqlContent.includes('ENABLE ROW LEVEL SECURITY')) {
    success.push('✅ RLS activé dans SQL');
  }
} catch (err) {
  errors.push('❌ supabase-setup.sql manquant');
}

// ============================================
// 5. Vérifier Documentation
// ============================================
console.log('\n📚 5. Documentation...');
const requiredDocs = [
  'QUICKSTART.md',
  'ACTIONS_IMMEDIATES.md',
  'GUIDE_PRODUCTION.md',
  'DEPLOY.md'
];

requiredDocs.forEach(doc => {
  try {
    readFileSync(join(__dirname, doc), 'utf8');
    success.push(`✅ ${doc} existe`);
  } catch (err) {
    warnings.push(`⚠️  ${doc} manquant`);
  }
});

// ============================================
// RÉSUMÉ
// ============================================
console.log('\n' + '='.repeat(50));
console.log('\n📊 RÉSUMÉ\n');

if (success.length > 0) {
  console.log('✅ SUCCÈS (' + success.length + ')');
  success.forEach(s => console.log('   ' + s));
}

if (warnings.length > 0) {
  console.log('\n⚠️  AVERTISSEMENTS (' + warnings.length + ')');
  warnings.forEach(w => console.log('   ' + w));
}

if (errors.length > 0) {
  console.log('\n❌ ERREURS CRITIQUES (' + errors.length + ')');
  errors.forEach(e => console.log('   ' + e));
}

console.log('\n' + '='.repeat(50));

// ============================================
// ÉTAT FINAL
// ============================================
if (errors.length === 0) {
  console.log('\n🎉 PRÊT POUR PRODUCTION!\n');
  console.log('Prochaines étapes:');
  console.log('1. Vérifier variables Vercel (Settings → Env Variables)');
  console.log('2. Tester: https://smart-food-manager-alpha.vercel.app');
  console.log('3. Créer compte test et login PIN 1234\n');
  process.exit(0);
} else {
  console.log('\n⚠️  ACTIONS REQUISES AVANT PRODUCTION\n');
  console.log('Consulter: ACTIONS_IMMEDIATES.md\n');
  process.exit(1);
}
