# Historique – Version 2.0

Une ligne par décision ou modification, la plus récente en haut. Format : date · type (Décision / Modification / Idée / Abandon) · ce qui a changé et pourquoi.

| Date | Type | Quoi | Pourquoi |
| --- | --- | --- | --- |
| 21/11/2026 | Modification | **Étape 0.2** : double vérification activée et 2e membre invité sur le compte Cloudflare (adresse du club). | Le compte ne dépend pas d'une seule personne. |
| 21/11/2026 | Modification | **Étape 0.1** : compte Cloudflare créé. | Début de la préparation. |
| 21/11/2026 | Décision | Les mails de la **version de test** partent aussi du compte Gmail du club, avec « [TEST] » dans l'objet et envoyés seulement aux testeurs. | Un seul compte à gérer, sans risque de confusion pour les capitaines. |
| 21/11/2026 | Modification | Ajout du schéma technique de la V2 (`schema-technique-v2.svg`). | Voir d'un coup d'œil qui parle à qui. |
| 21/11/2026 | Décision | Plan de la V2 en 8 étapes (`3-plan-simple.md`) : préparer, base de données, serveur, copie des données, page d'essai, tests, répétition, bascule, surveillance. | Avoir une feuille de route claire avant de construire. |
| 21/11/2026 | Décision | **Partie payante mise de côté.** Priorité au bon fonctionnement complet de l'appli pour le club. | Une chose à la fois : d'abord une appli fiable. |
| 21/11/2026 | Modification | Création du dossier `docs/v2` : photo de la v1, projet 2.0, ce journal. | Garder une trace de tout et pouvoir comparer avec la v1. |
| 20/11/2026 | Décision | Compte Cloudflare au nom du club, double vérification, 2 responsables. Code de la 2.0 dans `TCBazogeais`. | Que l'outil ne dépende pas d'une seule personne. |
| 20/11/2026 | Décision | **Cloudflare** retenu (Workers + D1) après comparatif avec Supabase, Firebase, Netlify + Neon, serveur loué. | Gratuit, jamais en pause, rapide, rien à entretenir. |
| 20/11/2026 | Décision | Construire une **base de test** sans toucher à l'appli actuelle ; bascule invisible prévue (même adresse, seule `URL_API` change). | Ne prendre aucun risque pour le club. |
| 20/11/2026 | Décision | Se concentrer **uniquement sur le TC Bazoges** ; multi-clubs mis de côté. | Aller plus vite, gagner en vitesse d'abord. |
| 20/11/2026 | Abandon (pour l'instant) | Accélération de la v1 sans migration. | Priorité à la base de test Cloudflare. |
| 19/11/2026 | Décision | Abandon de Google Sheet + Apps Script comme cible ; tout piloté depuis GitHub, mails par le compte Google. | Un seul endroit de travail ; GitHub seul ne peut pas stocker les réponses. |
| 18/11/2026 | Idée | Freemium : gratuit puis payant pour les fonctions les plus utiles (sélection, tableau, import FFT…). | Commercialisation éventuelle plus tard. |
| 17/11/2026 | Idée | Appli multi-clubs en libre-service, sans intervention. | Les clubs doivent pouvoir s'installer seuls. |
| 16/11/2026 | Décision | Rester en appli web installable (PWA) plutôt qu'appli Android / iPhone. | Lien WhatsApp sans installation, gratuit, mises à jour immédiates. |
