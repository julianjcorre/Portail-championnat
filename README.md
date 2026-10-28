# 🎾 TC Bazoges – Portail championnat

Page web gratuite, hébergée par Google, qui affiche aux joueurs les dates de championnat (**validée** ou **en attente de convocation**) et récolte leurs présences. Aucun compte, aucune appli à installer : un lien épinglé dans le groupe WhatsApp suffit.

Techniquement : une Google Sheet + un script Apps Script publié en « Application Web ».

## Adresse à partager aux joueurs

👉 **https://tcbazogeais.github.io** (GitHub Pages, dépôt public `TCBazogeais/tcbazogeais.github.io`).

La page est hébergée hors de Google et appelle Apps Script en coulisses (`doPost`, sans compte Google) : plus d'erreur « Impossible d'ouvrir le fichier » quand plusieurs comptes Google sont connectés, plus de bandeau gris. L'ancienne adresse `…/exec` fonctionne toujours mais reste sujette à ce bug.

Après une modification de `Index.html`, copier le fichier en `index.html` dans le dépôt `tcbazogeais.github.io` et le pousser (GitHub Pages se met à jour en 1 à 2 minutes). `Code.gs` reste mis en ligne automatiquement sur Apps Script.

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
   - Nouveau nom : ajouté à l'onglet Joueurs (équipes Hommes 1 et Hommes 2), avec la date d'inscription. S'il y avait plusieurs groupes dans `GROUPES_INSCRIPTION`, la page demanderait lequel.
3. Une seule liste : **tous les matchs du club**, par date. Sur chaque match, un gros bouton « Je suis dispo » / « Pas dispo » (n'importe quel joueur peut répondre sur n'importe quel match). Toucher à nouveau annule la réponse.
4. Pour chaque match : statut de la date, heure, domicile/extérieur, infos, et la liste des dispos / pas dispos / sans réponse (joueurs de l'équipe concernée). Alerte rouge quand il y a trop de rencontres à domicile le même jour (2 terrains).

## Côté capitaines

Espace capitaines **dans la page des joueurs** (lien « ⚙️ Espace capitaines » en bas), sans passer par la Sheet. Réservé au compte du club (propriétaire de la Sheet) et aux adresses listées dans `CAPITAINES` en haut de `Code.gs` :

- julian.jcorre@gmail.com
- florent.guery1@gmail.com
- jamin.matthieu85@gmail.com

Connexion :
1. « ⚙️ Espace capitaines » → taper son adresse e-mail → « Recevoir mon lien de connexion ».
2. Si l'adresse est dans la liste, un mail part du compte du club avec un lien personnel (`…/exec?capitaine=<jeton>`). La page dit clairement si le mail est parti, si l'adresse n'est pas dans la liste ou si la limite est atteinte (10 mails maximum par adresse et par jour , seuls les envois réussis comptent).
3. Ouvrir le lien sur son téléphone : la page s'ouvre sur les matchs (comme pour les joueurs) et le téléphone garde la connexion capitaine (1 an, ou jusqu'à « Se déconnecter »). L'espace capitaines s'ouvre ensuite avec le bouton **⚙️** en haut à droite (ou le lien en bas de page).

Code capitaine (choisi par le capitaine) :
- Après une connexion par le code du mail, la page propose « 🔑 Mon code capitaine » : 6 chiffres choisis par le capitaine (codes trop simples refusés : 000000, 123456…). Modifiable ensuite depuis l'accueil de l'espace capitaines.
- Connexions suivantes (nouveau téléphone, après « Se déconnecter ») : adresse + code capitaine, sans mail.
- Code oublié : « ✉️ Recevoir un code par mail », puis choisir un nouveau code. 5 erreurs de suite effacent le code capitaine : il faut repasser par le mail.
- Stocké brouillé (SHA-256 avec un sel) dans les propriétés du script (`code_perso_<adresse>`), jamais en clair, ni dans la Sheet ni dans un mail.

Appli sur l'écran d'accueil : bouton « 📲 Installer l'appli » en bas de la page (Android/ordinateur : installation directe ; iPhone : instructions Safari → Partager → Sur l'écran d'accueil). Fichiers `manifest.webmanifest`, `sw.js` et icônes dans le dépôt `tcbazogeais.github.io`. Sur iPhone, l'appli a sa propre mémoire : on y retape son prénom une fois, et les capitaines s'y connectent avec le **code à 6 chiffres** du mail (valable 30 min, 5 essais), puisque les liens des mails s'ouvrent dans Safari.

Vignettes :
- **➕ Créer une rencontre** : date, heure, équipe, adversaire, lieu, statut, nombre de terrains (1 ou 2, colonne `Terrains` de la Sheet, affiché aux joueurs), infos.
- **📅 Gérer les rencontres** : modifier, valider / remettre en attente, supprimer (supprime aussi les réponses à ce match).
- **📅 Ajouter à mon agenda** (côté joueurs, sur les matchs où ils sont retenus) : Google Agenda sur Android, fichier `.ics` sur iPhone ; à l'heure du match pour 4 h, ou journée entière si l'heure n'est pas connue. Lieu des matchs à domicile : `ADRESSE_CLUB` dans `Index.html`. L'évènement n'est pas mis à jour si le match change ensuite.
- **🏆 Sélection** : pour chaque match, ordre de jeu des 4 simples n°1 à n°4 (`NB_POSITIONS` dans `Code.gs` ; le double se compose sur place) et remplaçants ; joueurs groupés (dispos, sans réponse, pas dispos) avec n°1 / n°2 / … / Remp. / — (une position n'a qu'un joueur : la donner à un autre la retire au précédent) ; alerte si un joueur est déjà retenu dans l'autre équipe le même jour. Boutons « 📤 WhatsApp » (message de composition prêt à envoyer) et « 📋 Copier ». Les joueurs voient l'ordre de jeu sur la carte du match et « 🏆 Tu joues en n°2 » / « 🔄 Tu es remplaçant ». Onglet `Sélection` de la Sheet (créé automatiquement).
- **📊 Tableau des dispos** : vue globale, une ligne par joueur, une colonne par match (✅ / ❌ / – pas répondu), total des dispos par match et nombre de réponses par joueur. Le tableau défile horizontalement, la colonne des noms reste fixe. Filtre par journée (boutons au-dessus) : n'affiche que les matchs du jour et trie les joueurs (dispos, puis sans réponse, puis pas dispos). Filtre par réponse (Tous / ✅ Dispo / ❌ Pas dispo / – Non voté, avec le nombre de joueurs) : garde les joueurs ayant au moins une case de ce type parmi les matchs affichés ; combinable avec le filtre par journée.
- **👥 Dispos par match** : pour chaque match, qui est dispo, pas dispo, sans réponse.
- **🎾 Classements** : classement FFT de chaque joueur (menu NC … -30), saisi par les capitaines, avec la date de vérification. Les classements pouvant changer chaque mois, un classement non vérifié depuis plus de 31 jours est marqué « à vérifier » (compteur sur la vignette) ; « ✓ Bon » remet la date à aujourd'hui sans rien changer. Colonnes `Classement` (format texte, sinon la Sheet transforme « 15/4 » en date) et `Classement vérifié le` de l'onglet Joueurs, créées à la 1re saisie ; modifiables aussi dans la Sheet. Affiché dans la Sélection (joueurs triés du mieux classé au moins bien classé) et dans le message WhatsApp.
- **👤 Joueurs** : inscrits triés par nombre de réponses manquantes (ceux qui n'ont jamais répondu en tête) ; renommer (refusé si le nom existe déjà) ou supprimer un joueur (ses réponses avec).
- **🎾 Page des joueurs**.

Sécurité : les fonctions de gestion exigent un jeton valable, lié à une adresse encore présente dans `CAPITAINES` (retirer une adresse coupe son accès). Les jetons sont stockés dans les propriétés du script. Ne pas transférer le mail de connexion.

Repères visuels : Hommes 1 en bleu doux, Hommes 2 en violet doux (pastille du nom + trait le long du match, sur toutes les vues). Filtre Toutes / Hommes 1 / Hommes 2 en haut de la page des joueurs, mémorisé sur le téléphone.

## Côté bureau

Tout se gère dans la Google Sheet, la page se met à jour toute seule.

| Onglet | Colonnes | Qui remplit |
| --- | --- | --- |
| Rencontres | ID (cachée, automatique), Date, Heure, Équipe, Adversaire, Lieu (Domicile / Extérieur), Statut (Validée / En attente), Infos | Bureau |
| Joueurs | Nom, Équipe(s), Inscrit par la page le | Les joueurs eux-mêmes (bureau : corriger doublons / équipes) |
| Réponses | ID rencontre, Nom, Réponse, Répondu le | Automatique |

- Valider une date = passer le statut à « Validée ».
- Calendrier officiel de la saison : importé automatiquement une fois, au premier chargement de la page (les rencontres d'exemple sont alors retirées). Pour le réappliquer : menu **🎾 → Importer le calendrier 2026-2027** (liste `CALENDRIER` dans `Code.gs`). Ajoute les rencontres à venir, met à jour adversaire et lieu de celles déjà présentes (sans toucher heure, statut, infos ni réponses), puis propose de supprimer les rencontres à venir absentes du calendrier.
- Équipes : Hommes 1 et Hommes 2 (`EQUIPES` dans `Code.gs`). Les lignes d'autres équipes (ex. Femmes) sont ignorées par la page. Joueur dans 2 équipes : « Hommes 1, Hommes 2 ».
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
