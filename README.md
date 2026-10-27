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
2. La 1re fois, ils touchent leur prénom dans « Qui es-tu ? ». Le téléphone s'en souvient.
3. **Mes matchs** : un gros bouton « Je viens » / « Je ne viens pas » par rencontre. Toucher à nouveau annule la réponse. On voit le statut de la date, l'heure, domicile/extérieur, les infos, et qui vient / qui n'a pas répondu.
4. **Tout le club** : toutes les rencontres par jour, avec une alerte rouge quand il y a plus de rencontres à domicile que le seuil fixé (2 terrains).

## Côté bureau

Tout se gère dans la Google Sheet, la page se met à jour toute seule.

| Onglet | Colonnes | Qui remplit |
| --- | --- | --- |
| Rencontres | ID (cachée, automatique), Date, Heure, Équipe, Adversaire, Lieu (Domicile / Extérieur), Statut (Validée / En attente), Infos | Bureau |
| Joueurs | Nom, Équipe(s) | Bureau |
| Réponses | ID rencontre, Nom, Réponse, Répondu le | Automatique |

- Valider une date = passer le statut à « Validée ».
- Équipes : Hommes 1, Hommes 2, Femmes. Joueur dans 2 équipes : « Hommes 1, Hommes 2 ».
- Noms : les prénoms du club. En cas de doublon, ajouter l'initiale (« Thomas G. »).
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

## Évolutions possibles

- [ ] Bouton « Je ne suis pas dans la liste » : le joueur tape son prénom, choisit son équipe, et il est ajouté à l'onglet Joueurs.
- [ ] Saisir les vraies dates des 3 équipes dans l'onglet Rencontres.
