# opanoma-prod

## Déploiement sur GitHub Pages (option "main")

Si vous souhaitez publier directement la production depuis la branche `main`, voici la marche à suivre :

1. **Vérifier le contenu de la branche `main`**  
   Assurez-vous que la branche contient bien tous les fichiers statiques à exposer (`index.html`, `src/`, `public/`, etc.).

2. **Pousser la branche sur GitHub**  
   ```bash
   git push origin main
   ```

3. **Activer GitHub Pages sur `main`**  
   - Ouvrez votre dépôt sur GitHub puis allez dans **Settings → Pages**.  
   - Dans la section **Build and deployment**, choisissez `Deploy from a branch`.  
   - Sélectionnez `main` comme branche et `/ (root)` comme dossier.  
   - Enregistrez : GitHub lance immédiatement un déploiement.

4. **Attendre l’URL de publication**  
   Après quelques instants, une URL du type `https://<organisation>.github.io/<nom-du-repo>/` sera disponible et pointera vers les fichiers de `main`.

5. **Mettre à jour la production**  
   Chaque `git push origin main` déclenchera un nouveau déploiement. Surveillez l’historique dans **Settings → Pages** en cas d’échec.

6. **Points de vigilance**
   - Utilisez des chemins relatifs ou HTTPS pour toutes les ressources externes afin d’éviter les avertissements de contenu mixte.
   - Prévoyez un fichier `404.html` si votre site s’appuie sur des routes internes (SPA).
   - Les mises à jour peuvent prendre quelques minutes à apparaître ; attendez l’indicateur "Published".

### Résoudre les erreurs 404 sur GitHub Pages

Sur GitHub Pages, le site est servi depuis `https://<organisation>.github.io/<nom-du-repo>/`. Les ressources référencées par un chemin absolu commençant par `/` (ex. `/src/style.css`, `/public/fond10.mp4`, `/opalogo.png`) sont alors cherchées à la racine `https://<organisation>.github.io/`, ce qui provoque des erreurs 404 comme :

```
resource: the server responded with a status of 404 ()
opalogo.png:1  Failed to load resource: the server responded with a status of 404 ()
src/style.css?v=force-reload-20251013:1  Failed to load resource: the server responded with a status of 404 ()
public/fond10.mp4:1  Failed to load resource: the server responded with a status of 404 ()
```

Pour corriger ces erreurs :

1. **Remplacer les chemins absolus par des chemins relatifs** (par exemple `src/style.css` ou `./src/style.css` à la place de `/src/style.css`).
2. **Ou définir dynamiquement la base de vos liens** avant l’initialisation du site :
   ```html
   <script>
     if (window.location.hostname.endsWith('github.io')) {
       const base = document.createElement('base');
       base.href = `${window.location.pathname.replace(/\/[^/]*$/, '/')}`;
       document.head.prepend(base);
     }
   </script>
   ```
   Ce script ajuste la balise `<base>` pour que les chemins commençant par `/` pointent vers le bon sous-répertoire.
3. **Re-déployer la branche `main`** une fois les liens corrigés (`git push origin main`).

Ces étapes permettent de publier rapidement la version hébergée de votre site directement depuis `main`, sans configuration de branche supplémentaire, tout en s’assurant que les assets sont correctement servis sur GitHub Pages.

### Tester le fonctionnement en conditions "en ligne"

Pour reproduire le comportement de GitHub Pages depuis votre machine ou valider qu’un déploiement n’a pas de ressources manquantes :

1. **Lancer un serveur statique depuis le dossier parent du projet** afin d’exposer le site sous un sous-répertoire, comme le fait GitHub Pages :
   ```bash
   cd ..
   python -m http.server 4173
   ```
   Le site est alors accessible à l’adresse [http://localhost:4173/opanoma-prod/](http://localhost:4173/opanoma-prod/).
2. **Ouvrir l’URL ci-dessus dans un navigateur** pour vérifier que les styles, scripts (`src/card-animations.js`), vidéos (`public/fond10.mp4`) et icônes se chargent correctement.
3. **Surveiller la console du navigateur** : aucune erreur 404 ne doit apparaître. Si un fichier est manquant, vérifiez son chemin dans le dépôt.

Cette procédure reproduit fidèlement la structure d’URL qu’utilise GitHub Pages (`/<nom-du-repo>/...`) et permet de détecter en local les erreurs de chemin avant même la mise en ligne.
