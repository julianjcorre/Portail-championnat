# 🎾 TC Bazoges – Portail championnat

Page web gratuite, hébergée par Google, qui affiche aux joueurs les dates de championnat (**validée** ou **en attente de convocation**) et récolte leurs présences. Aucun compte, aucune appli à installer : un lien épinglé dans le groupe WhatsApp suffit.

Techniquement : une Google Sheet + un script Apps Script publié en « Application Web ».

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `Code.gs` | Côté serveur : menu de la Sheet, lecture des onglets, enregistrement des réponses. Réglages en haut du fichier. |
| `Index.html` | La page affichée aux joueurs (mobile d'abord). |
| `appsscript.json` | Manifeste Apps Script (fuseau Europe/Paris, accès web), envoyé par la mise en ligne automatique. |
| `.github/workflows/deployer.yml` | Mise en ligne automatique à chaque push sur `main`. |

## Côté joueurs

1. Ils ouvrent le lien (navigateur du téléphone, pas de connexion).
2. La 1re fois, ils écrivent leur prénom et l'initiale de leur nom (« Julien C. »). Le téléphone s'en souvient.
   - Nom déjà dans l'onglet Joueurs (sans tenir compte des majuscules, accents, points) : reconnu directement.
   - Nouveau nom : la page demande « Hommes » ou « Femmes » et l'ajoute à l'onglet Joueurs (Hommes → Hommes 1 et Hommes 2), avec la date d'inscription.
3. **Mes matchs** : une carte par jour, avec un gros bouton « Je suis dispo » / « Pas dispo ». Un joueur de plusieurs équipes répond une seule fois pour la journée (la réponse vaut pour toutes ses rencontres du jour). Toucher à nouveau annule la réponse. On voit le statut de chaque date, l'heure, domicile/extérieur, les infos, et qui est dispo / qui n'a pas répondu.
4. **Tout le club** : toutes les rencontres par jour, avec une alerte rouge quand il y a plus de rencontres à domicile que le seuil fixé (2 terrains).

## Côté bureau

Tout se gère dans la Google Sheet, la page se met à jour toute seule.

| Onglet | Colonnes | Qui remplit |
| --- | --- | --- |
| Rencontres | ID (cachée, automatique), Date, Heure, Équipe, Adversaire, Lieu (Domicile / Extérieur), Statut (Validée / En attente), Infos | Bureau |
| Joueurs | Nom, Équipe(s), Inscrit par la page le | Les joueurs eux-mêmes (bureau : corriger doublons / équipes) |
| Réponses | ID rencontre, Nom, Réponse, Répondu le | Automatique |

- Valider une date = passer le statut à « Validée ».
- Calendrier officiel de la saison : menu **🎾 → Importer le calendrier 2026-2027** (liste `CALENDRIER` dans `Code.gs`). Ajoute les rencontres à venir, met à jour adversaire et lieu de celles déjà présentes (sans toucher heure, statut, infos ni réponses), puis propose de supprimer les rencontres à venir absentes du calendrier.
- Équipes : Hommes 1, Hommes 2, Femmes. Joueur dans 2 équipes : « Hommes 1, Hommes 2 » (cas de tous les hommes pour l'instant).
- Noms : prénom + initiale du nom. Si un joueur s'inscrit en double (« Seb B » et « Sébastien B »), garder une ligne et renommer ses réponses dans l'onglet Réponses.
- Choix proposés à l'inscription : `GROUPES_INSCRIPTION` en haut de `Code.gs`.
- Heure : « 9h », « 9h30 » ou « 09:30 », tout est accepté.
- Nouvelle rencontre : remplir une ligne en laissant l'ID vide, il se crée au prochain chargement de la page.

## Mise en place (10 min, compte Google du club)

1. Créer une Google Sheet vide « TC Bazoges – Championnat ».
2. Extensions → Apps Script.
3. Coller le contenu de `Code.gs` dans le fichier `Code.gs`.
4. Bouton **+** → HTML → nommer le fichier `Index` (sans .html) et y coller le contenu de `Index.html`.
5. Enregistrer, recharger la Sheet, menu **🎾 TC Bazoges → Installer les onglets** (autoriser l'accès la 1re fois).
6. Remplacer les exemples dans Rencontres et Joueurs.
7. Apps Script → **Déployer → Nouveau déploiement → Application Web**. Exécuter en tant que : **Moi**. Accès : **Tout le monde** (pas « Tout le monde ayant un compte Google »).
8. Copier l'URL (aussi disponible via le menu 🎾 → Ouvrir la page des joueurs) et l'épingler dans les groupes WhatsApp.

## Mise en ligne automatique depuis GitHub

Une fois réglé, chaque modification poussée sur `main` est envoyée dans Apps Script et mise en ligne toute seule, avec la même URL (`.github/workflows/deployer.yml`, onglet **Actions** du dépôt pour suivre).

À faire une seule fois, après la mise en place ci-dessus :

1. Activer l'API Apps Script avec le compte du club : https://script.google.com/home/usersettings → « API Google Apps Script » → **Activé**.
2. Sur un ordinateur avec [Node.js](https://nodejs.org) :
   ```bash
   npm install -g @google/clasp@2.4.2
   clasp login
   ```
   Se connecter avec le compte Google du club. Cela crée le fichier `.clasprc.json` dans le dossier personnel (`~/.clasprc.json` sur Mac/Linux, `C:\Users\<nom>\.clasprc.json` sur Windows).
3. Dans GitHub : dépôt → **Settings → Secrets and variables → Actions → New repository secret**, créer `CLASPRC_JSON` avec tout le contenu du fichier `.clasprc.json` (sous Windows : `type %USERPROFILE%\.clasprc.json | clip` puis Ctrl+V).
   L'ID du script et l'ID de déploiement ne sont pas secrets : ils sont écrits en haut de `.github/workflows/deployer.yml`.
4. Onglet **Actions** → « Déployer sur Apps Script » → **Run workflow** pour vérifier que tout est vert.

> ⚠️ `.clasprc.json` donne accès aux scripts du compte Google du club : il ne va que dans les secrets GitHub, jamais dans le code ni dans un message. Pour couper l'accès : https://myaccount.google.com/permissions → retirer « clasp ».

## Maintenance

- Modifier les données de la Sheet : rien à redéployer.
- Modifier le code : pousser sur `main` (mise en ligne automatique). Sans l'automatisation : coller le code puis **Déployer → Gérer les déploiements → Modifier → Nouvelle version** (garde la même URL).
- Réglages en haut de `Code.gs` : `NB_TERRAINS` (2), `MAX_DOMICILE_PAR_JOUR` (1, seuil de l'alerte), `EQUIPES`.

## Points d'attention

- Google affiche un petit bandeau gris en haut de la page (« créée par un utilisateur de Google Apps Script ») : normal.
- N'importe qui peut répondre au nom d'un autre. Acceptable pour le club ; l'onglet Réponses garde la date de chaque réponse.
- Les rencontres passées (avant hier) ne s'affichent plus.
- **Plusieurs comptes Google connectés dans le même navigateur** : Google peut afficher « Impossible d'ouvrir le fichier pour le moment » (sur la page des joueurs comme sur Extensions → Apps Script). Contournement : fenêtre de navigation privée, ou un seul compte connecté. Sur téléphone, sans compte Google connecté, la page s'ouvre normalement.

## Évolutions possibles

- [ ] Régler le problème « plusieurs comptes Google connectés » : héberger la page elle-même sur GitHub Pages et n'utiliser Apps Script que pour lire/écrire la Sheet (appels `fetch`). Supprime aussi le bandeau gris de Google.
