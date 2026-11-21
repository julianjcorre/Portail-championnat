# Version 1 – État de l'application au 21/11/2026

Photo de référence, prise avant tout travail sur la 2.0 (dernier changement : commit `f929dd7`, « Espace com : ne plus rester bloqué sur « Connexion… » »). Le détail complet de chaque fonction est dans le [README principal](../../README.md).

## En une phrase
Application web du TC Bazogeais pour les équipes Hommes 1 et Hommes 2 : les joueurs donnent leurs disponibilités, les capitaines composent les équipes, saisissent les résultats et suivent les classements.

## Architecture

| Partie | Technologie | Où |
| --- | --- | --- |
| Page joueurs + capitaines | Un seul fichier HTML/JS (~2 400 lignes), appli installable (PWA) | GitHub Pages : `tcbazogeais.github.io` (dépôt `TCBazogeais/tcbazogeais.github.io`) |
| Serveur | Google Apps Script, `Code.gs` (~1 800 lignes), une vingtaine de fonctions appelées par `doPost` (`{ fn, args }`) | Compte Google du club |
| Données | Google Sheet, 6 onglets : Rencontres, Joueurs, Réponses, Sélection, Résultats, Classement championnat | Google Drive du club |
| Accès capitaines | Jetons, codes perso brouillés (SHA-256 + sel), liste des rôles | Propriétés du script Apps Script |
| Mails | Gmail du compte du club (code de connexion, max 10 par adresse et par jour) | Google |
| Mise en ligne | `Code.gs` : GitHub Actions + clasp à chaque push sur `main`. Page : copie manuelle de `Index.html` vers le dépôt GitHub Pages | GitHub (`julianjcorre/Portail-championnat`) |

## Fonctions

**Joueurs** (sans compte, un lien WhatsApp suffit)
- Choix de son nom dans la liste, mémorisé sur le téléphone.
- 📅 Mes disponibilités : tous les matchs du club, « Je suis dispo / Pas dispo », qui vient, statut, domicile / extérieur, ordre de jeu, ajout à l'agenda.
- 🎾 Résultats matchs, avec son bilan personnel.
- 🏆 Classement championnat (poules Hommes 1 et Hommes 2).
- 🪪 Licences FFT.
- Filtre par équipe, installation sur l'écran d'accueil, rechargement automatique à chaque nouvelle version.

**Capitaines** (connexion par e-mail + code à 6 chiffres)
- Créer / gérer les rencontres (valider, supprimer, nombre de terrains).
- 🏆 Sélection : ordre de jeu n°1 à n°4 + remplaçants, message WhatsApp prêt à envoyer.
- 📊 Tableau des dispos (filtres par journée et par réponse), 👥 dispos par match.
- 📋 Résultats (saisie d'après la feuille de match Ten'Up), 🏆 classement de poule.
- 🎾 Classements FFT des joueurs, 📥 import de la liste FFT (traitée dans le téléphone), 👤 gestion des joueurs (renommer, supprimer, figer dans une équipe).

**Rôles** : Admin (gère 🛡️ Accès), Capitaine, Communication (consultation seule).

## Ce qui est propre au TC Bazoges (écrit en dur)
Nom et logo du club, adresse (`ADRESSE_CLUB`), équipes (`EQUIPES`), calendrier 2026-2027 (`CALENDRIER`), liste de départ des rôles, résultats et classements initiaux, repérage de la ligne du club dans les classements (« Bazog »).

## Limites connues
- **Lenteur** : chaque appel à Apps Script prend en général 1 à 3 s ; l'ouverture de la page refait à chaque fois 7 vérifications « une fois » qui ne servent plus, puis lit 6 onglets entiers.
- **Écritures en file d'attente** (verrou `LockService`) quand plusieurs joueurs répondent en même temps.
- **Deux mondes** : code dans GitHub, données et serveur chez Google.
- **Mails limités** par les quotas Gmail.
- **Un seul club** : impossible à proposer à d'autres clubs sans modifier le code.
- Code du serveur sur un GitHub personnel ; seule la page appartient au club.
