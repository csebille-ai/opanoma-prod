# Opanoma - Production Website

Site source de opanoma.fr (frontend Vite + API PHP).

## Apercu rapide (profil/recruteur)

Projet web en production pour la plateforme Opanoma.

- Site public: https://opanoma.fr
- Role: conception frontend, integration UX, automatisation des parcours de tirage, integration API backend
- Stack principale: JavaScript (Vite), CSS, PHP
- Focus produit: performance, conversion, parcours utilisateur fluide, deploiement continu sur o2switch

Le code ci-dessous detaille le setup local et le process de build/deploiement utilise en production.

## Stack

- Frontend: HTML, CSS, JavaScript (Vite)
- Backend: PHP (dossier `prod/api/`)
- Hosting: o2switch

## Structure du repo

- `index.html`: page principale
- `src/`: scripts et styles source
- `public/`: assets statiques copies tels quels dans le build
- `prod/api/`: endpoints PHP
- `dist/`: sortie de build (genere localement)
- `tools/`: scripts utilitaires

## Developpement local

```powershell
npm install
npm run dev
```

Application locale:

- `http://localhost:5173` (ou port suivant si occupe)

## Build

```powershell
npm run build
```

Vite genere `dist/`.

## Deploy o2switch (workflow actuel)

```powershell
npm run build
Copy-Item "prod\api\*" "dist\api\" -Recurse -Force
Remove-Item "dist\api\brevo-config.php" -Force
Remove-Item "dist\api\airtable-config.php" -Force
Copy-Item "prod\manifest.json" "dist\" -Force
Copy-Item "src\popup.css" "dist\src\" -Force
Copy-Item "src\popup-adapter.js" "dist\src\" -Force
Copy-Item "src\card-animations.js" "dist\src\" -Force
Copy-Item "src\popup.js" "dist\src\" -Force
Copy-Item "src\newsletter-mobile.css" "dist\src\" -Force -ErrorAction SilentlyContinue
Remove-Item "deploy.zip" -ErrorAction SilentlyContinue
Compress-Archive -Path "dist\*" -DestinationPath "deploy.zip" -Force
```

Puis:

1. Upload `deploy.zip` dans `public_html`
2. Extract sur serveur
3. Supprimer le zip

## Notes importantes

- Certains fichiers de `src/` sont charges directement dans `index.html` (non modules), donc ils ne sont pas toujours rebundles automatiquement: ils doivent etre recopies vers `dist/src/` avant packaging.
- Les fichiers de config sensibles (`brevo-config.php`, `airtable-config.php`) ne doivent pas etre ecrases en prod.
- En cas de cache JS en prod, ajouter/incrementer un query param de version dans `index.html` (ex: `popup-adapter.js?v=4`).

## Repo lie

- GitHub: https://github.com/csebille-ai/opanoma-prod
