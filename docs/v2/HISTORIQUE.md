# Historique – Version 2.0

Une ligne par décision ou modification, la plus récente en haut. Format : date · type (Décision / Modification / Idée / Abandon) · ce qui a changé et pourquoi.

| Date | Type | Quoi | Pourquoi |
| --- | --- | --- | --- |
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
