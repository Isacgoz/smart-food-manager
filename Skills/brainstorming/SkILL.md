# SKILL: Brainstorming

## Objectif
Générer des idées, explorer des solutions, anticiper des problèmes sans entrer dans l'implémentation.

## Règles de concision
- Réponses ultra-courtes
- Phrases sans verbe si possible
- Listes à puces max
- Pas de prose inutile

## Processus

### 1. Clarifier la demande
- Reformuler en 1 phrase
- Identifier le vrai problème
- Exemple : "Besoin : gestion stock temps réel avec multi-utilisateurs"

### 2. Explorer les options
Format :
```
Option A: [nom court]
  Pro: [1-3 points max]
  Con: [1-3 points max]
  
Option B: [nom court]
  Pro: [1-3 points max]
  Con: [1-3 points max]
```

### 3. Anticiper les problèmes
Liste les risques potentiels :
- Performance
- Sécurité
- Complexité
- Maintenance
- Scalabilité

### 4. Recommander
- 1 phrase de recommandation
- Justification en 2-3 lignes max
- Pas de détails d'implémentation

### 5. Questions non résolues (obligatoire)
Toujours terminer par :
```
## Questions non résolues
- [Question 1]
- [Question 2]
- [Question 3]
```

## Format de sortie

```
# Brainstorm: [sujet]

## Problème
[1 phrase]

## Options

### Option 1: [nom]
Pro:
- [point]
- [point]

Con:
- [point]
- [point]

### Option 2: [nom]
Pro:
- [point]

Con:
- [point]

## Recommandation
[1-2 phrases]

Raison: [explication courte]

## Questions non résolues
- [question 1]
- [question 2]
```

## Exemples

### Bon exemple
```
# Brainstorm: Stock sync strategy

## Problème
Multi-user stock updates = conflicts

## Options

### Option 1: Optimistic locking
Pro:
- Better UX (no blocking)
- Higher throughput

Con:
- Conflict resolution needed
- More complex code

### Option 2: Pessimistic locking
Pro:
- No conflicts
- Simpler logic

Con:
- Users blocked
- Lower performance

## Recommandation
Option 1 (optimistic)

Raison: UX priority + conflicts rare in practice (different ingredients)

## Questions non résolues
- Conflict UI design?
- Retry strategy?
- Max retry attempts?
```

### Mauvais exemple
```
# Brainstorming sur la stratégie de synchronisation du stock

Je pense que nous devrions explorer plusieurs approches pour gérer 
la synchronisation du stock entre plusieurs utilisateurs...

[500 mots de prose inutile]
```

## Anti-patterns à éviter

❌ Trop de prose
❌ Entrer dans les détails d'implémentation
❌ Proposer du code
❌ Oublier les questions non résolues
❌ Trop d'options (max 3-4)
❌ Justifications longues

## Patterns à suivre

✅ Ultra-concis
✅ Structuré
✅ Focus sur les trade-offs
✅ Questions non résolues listées
✅ Recommandation claire
✅ Pas de code

## Notes spécifiques Smart Food Manager

### Considérations techniques
- Multi-tenant isolation
- PostgreSQL constraints
- FastAPI async patterns
- React Native limitations
- Offline scenarios (futur)

### Considérations métier
- Stock = ingrédients (pas produits)
- Déstockage automatique = critique
- PMP calculation = précision requise
- Multi-user = serveurs concurrents
- Temps réel = WebSockets

### Questions fréquentes à anticiper
- Performance scale (combien users/company?)
- Data retention (combien temps historique?)
- Backup strategy?
- Migration path?
- Rollback plan?
