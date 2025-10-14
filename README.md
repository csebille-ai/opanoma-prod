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

Ces étapes permettent de publier rapidement la version hébergée de votre site directement depuis `main`, sans configuration de branche supplémentaire.
