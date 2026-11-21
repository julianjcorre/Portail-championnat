# Plan de la V2, expliqué simplement

## L'image : l'appli est un restaurant

| Dans le restaurant | Dans l'appli | Aujourd'hui (V1) | Demain (V2) |
| --- | --- | --- | --- |
| 🪑 La **salle**, là où les clients s'assoient | La page que voient les joueurs | GitHub Pages | **La même**, on n'y touche pas |
| 👨‍🍳 Le **cuisinier**, qui prépare ce qu'on demande | Le serveur (`Code.gs`) | Google Apps Script : lent, il faut attendre 1 à 3 s | **Cloudflare Worker** : très rapide, environ 0,2 s |
| 📒 Le **cahier** où tout est noté | Les données | Google Sheet | **Cloudflare D1**, une vraie base de données |
| ✉️ Le **facteur** | Les mails de connexion | Gmail | **Gmail**, le même |
| 🏠 Le **chef du restaurant**, qui décide de tout | Le code et les mises en ligne | GitHub + Google | **GitHub seul** |

Les clients (les joueurs) passent leur commande de la même façon : « Je suis dispo ». Ils ne voient pas qu'on a changé de cuisinier et de cahier. Ils remarquent seulement que c'est servi beaucoup plus vite.

## Les étapes

### Étape 0 – Préparer la cuisine
- Créer le compte Cloudflare avec l'adresse du club, activer la double vérification et inviter un 2e responsable.
- Créer le dépôt de la V2 dans `TCBazogeais`.
- Donner à GitHub la clé pour envoyer le code chez Cloudflare (dans les secrets GitHub).
- Autoriser le facteur : permettre au Worker d'envoyer des mails avec le compte Google du club.

👉 *Ce qu'il faut de toi : créer le compte et cliquer sur « Autoriser » aux bons endroits. Je te guide pas à pas.*

### Étape 1 – Fabriquer le cahier neuf 📒
Le nouveau cahier a les mêmes pages que la Sheet : Rencontres, Joueurs, Réponses, Sélection, Résultats, Classement championnat. On y ajoute une page pour les accès des capitaines, qui sont aujourd'hui cachés dans Apps Script.

### Étape 2 – Embaucher le nouveau cuisinier 👨‍🍳
Il connaît **exactement les mêmes recettes**, avec les mêmes noms : `repondre`, `getDonnees`, `definirSelection`… La page n'a donc rien à réapprendre.

### Étape 3 – Recopier l'ancien cahier dans le neuf
Un bouton « Exporter pour Cloudflare » dans la Sheet. Il **lit** seulement et ne modifie rien. On recopie tout à l'identique, même les numéros des matchs, pour que rien ne se mélange.

### Étape 4 – Ouvrir un restaurant d'essai 🧪
Une **copie de la page**, à une adresse secrète, qui parle au nouveau cuisinier. Les joueurs ne la voient jamais. Le vrai restaurant continue comme avant.

### Étape 5 – Tout goûter ✅
On essaie chaque fonction sur le restaurant d'essai et on coche :
- [ ] Choisir son nom, répondre dispo / pas dispo, annuler
- [ ] Voir les matchs, les résultats, le classement, les licences
- [ ] Connexion capitaine par mail, puis avec le code à 6 chiffres
- [ ] Créer, modifier et supprimer une rencontre
- [ ] Sélection, ordre de jeu, message WhatsApp
- [ ] Tableau des dispos, filtres
- [ ] Saisir un résultat, un classement de poule
- [ ] Import de la liste FFT, classements, joueurs figés
- [ ] Rôles : admin, capitaine, communication
- [ ] Plusieurs personnes qui répondent en même temps
- [ ] **Chronomètre** : V1 contre V2

Tant qu'une case n'est pas cochée, on ne bascule pas.

### Étape 6 – Répétition générale 🎭
On fait une fausse bascule sur le restaurant d'essai, avec une copie fraîche du cahier, pour s'entraîner sans risque.

### Étape 7 – Le grand soir 🌙 (la bascule)
1. Le soir, quand personne ne répond.
2. Dernière copie du cahier Google vers le cahier Cloudflare.
3. On vérifie que les comptes sont bons : autant de joueurs, de réponses, de matchs.
4. On change **une seule ligne** dans la vraie page : l'adresse du cuisinier (`URL_API`).
5. Les téléphones se mettent à jour tout seuls.

Les joueurs gardent leur nom, les capitaines restent connectés et l'appli installée continue de marcher.

### Étape 8 – Surveiller et garder la roue de secours 🛟
- Pendant 2 semaines, on garde l'ancien cuisinier et l'ancien cahier **intacts**.
- En cas de problème, on remet l'ancienne ligne : retour à la V1 en 2 minutes.
- Quand tout va bien, on range l'ancien : la Sheet devient une archive.

## Ce qui change pour chacun

| Qui | Ce qui change |
| --- | --- |
| Joueurs | Rien, sauf que c'est plus rapide |
| Capitaines | Rien, sauf que c'est plus rapide. Ils ne corrigent plus dans la Sheet : tout passe par les écrans, avec un export Excel si besoin |
| Toi | Tout se pilote depuis GitHub. Une modification poussée part en ligne toute seule |

## Règles de sécurité du chantier
1. On ne touche **jamais** à l'appli actuelle avant le grand soir.
2. On ne bascule que quand **toutes les cases** de l'étape 5 sont cochées.
3. On peut **toujours revenir en arrière**.
4. Chaque étape terminée est notée dans `HISTORIQUE.md`.
