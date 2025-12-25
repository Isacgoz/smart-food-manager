# Contributing

Merci de contribuer à Smart Food Manager !

## Workflow

1. Fork le projet
2. Créer branche: `git checkout -b feature/ma-feature`
3. Commit: `git commit -m 'feat: ma feature'`
4. Push: `git push origin feature/ma-feature`
5. Créer Pull Request

## Convention Commits

Format: `type(scope): description`

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction bug
- `docs`: Documentation
- `test`: Tests
- `refactor`: Refactoring
- `chore`: Tâches build/config

**Exemples:**
- `feat(pos): ajout paiement QR code`
- `fix(stock): correction calcul PMP`
- `docs(readme): ajout screenshots`

## Tests

```bash
npm test
```

Tous les tests doivent passer avant PR.

## Code Style

- TypeScript strict
- Pas de `any` non justifié
- Commentaires POURQUOI (pas QUOI)
- Noms variables explicites

## Pull Requests

- Titre clair et descriptif
- Description détaillée des changements
- Tests ajoutés/mis à jour
- Screenshots si UI modifiée
- Pas de console.log

## Questions

Ouvrir une issue pour discuter avant grosse feature.
