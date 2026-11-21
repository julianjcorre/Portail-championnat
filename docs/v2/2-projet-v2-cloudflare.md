# Projet 2.0 – Passage sur Cloudflare

Synthèse des discussions du 16 au 21/11/2026. Rien n'est encore construit : c'est la feuille de route.

## Objectif
**Priorité absolue : le bon fonctionnement complet de l'appli pour le TC Bazoges.** Une appli plus rapide, fiable, tout pilotée depuis GitHub, sans Google Sheet ni Apps Script.

Hors sujet pour l'instant : toute partie payante. La version multi-clubs reste une idée pour plus tard.

## Décisions prises

| Sujet | Décision |
| --- | --- |
| Périmètre de départ | **Uniquement le TC Bazoges.** La version multi-clubs est mise de côté. |
| Méthode | Construire d'abord une **base de test**, sans toucher à l'appli actuelle (Sheet, Apps Script et `tcbazogeais.github.io` restent intacts). |
| Hébergement | **Cloudflare** : Workers (serveur), D1 (base de données), éventuellement Pages. Mise en ligne automatique depuis GitHub. |
| Mails | Le compte Google du club, via l'API Gmail. |
| Appli mobile | **On reste en appli web (PWA)**, pas d'appli Android / iPhone. Capacitor éventuellement plus tard pour être dans les stores. |
| Compte Cloudflare | Créé avec l'adresse du **club** (pas un compte perso), double vérification activée, au moins 2 responsables invités. |
| Propriété du code | Code de la 2.0 dans l'organisation GitHub **`TCBazogeais`**. |

## Pourquoi Cloudflare (comparatif fait le 20/11/2026)

| Solution | Verdict |
| --- | --- |
| **Cloudflare** (Workers + D1) | ✅ Retenu : gratuit, jamais en pause, très rapide, rien à entretenir, un seul prestataire. Point faible : pas de tableau type Sheet pour corriger à la main. |
| Supabase | 2e choix : tableau proche de la Sheet et connexion par mail intégrée, mais **pause après 7 jours sans visite** en gratuit (25 $/mois sinon). |
| Firebase | On resterait chez Google, base non tabulaire, carte bancaire obligatoire. |
| Netlify + Neon | Deux prestataires, base qui s'endort. |
| Serveur loué (OVH, Scaleway) | Mises à jour de sécurité à faire : incompatible avec « sans moi ». |
| Tout dans GitHub | Impossible : GitHub ne peut pas recevoir les réponses des joueurs en sécurité. GitHub reste le **poste de pilotage** (code + mise en ligne). |

Chiffres des offres gratuites à revérifier au moment de démarrer.

## Architecture visée

| Partie | v1 (actuelle) | v2 |
| --- | --- | --- |
| Page | GitHub Pages | **Inchangée** (même adresse `tcbazogeais.github.io`), seule `URL_API` change |
| Serveur | Apps Script `Code.gs` | Cloudflare Worker, **mêmes noms de fonctions** et même format `{ fn, args }` |
| Données | Google Sheet | Cloudflare D1, historique de 30 jours pour revenir en arrière |
| Accès capitaines | Propriétés du script | Base D1 (jetons et codes brouillés recopiés) |
| Mails | Gmail (Apps Script) | Gmail (API) |
| Correction à la main | Directement dans la Sheet | Écrans capitaines + **export Excel** |
| Mise en ligne | clasp + copie manuelle de la page | Automatique depuis GitHub pour tout |

Gain attendu : environ 0,1 à 0,3 s par action au lieu de 1 à 3 s, plus de file d'attente.

## Bascule invisible pour les joueurs
1. **Même adresse de page** : les joueurs gardent leur nom mémorisé, les capitaines leur connexion, l'appli installée reste valable.
2. **Même dialogue avec le serveur** : une seule ligne change dans la page (`URL_API`).
3. **Données recopiées à l'identique**, ID compris, ainsi que jetons et codes capitaines.
4. Le soir de la bascule : dernière copie de la Sheet → vérification des totaux → changement de `URL_API` → rechargement automatique chez les joueurs.
5. **Retour arrière en 2 minutes** en remettant l'ancienne `URL_API` (prévoir un export des réponses données entre-temps).
6. Seule trace visible : les liens de connexion envoyés par mail avant la bascule ne marchent plus (les codes, si).

## Base de test
- Worker + base D1 de test, avec une **copie** des vraies données.
- Page de test à une adresse à part, jamais montrée aux joueurs.
- Copie des données via un menu « Exporter pour Cloudflare » ajouté à la Sheet (lecture seule).
- À vérifier : réponses, sélection, résultats, classements, import FFT, connexion capitaine, rôles, et la vitesse.

## Prochaines étapes
- [ ] Créer le compte Cloudflare (adresse du club, double vérification, 2e responsable).
- [ ] Créer le dépôt de la 2.0 dans `TCBazogeais`.
- [ ] Rédiger le document de conception détaillé de la base de test.
- [ ] Ajouter la clé d'accès Cloudflare dans les secrets GitHub.
- [ ] Construire la base de test, puis comparer avec la v1.

## Idées pour plus tard (non décidées)
**Version multi-clubs en libre-service**
- Un club s'inscrit seul (« Créer mon club » → code par mail → assistant : logo, équipes, import FFT, rencontres → lien à partager).
- Réglages du club dans la base, plus rien d'écrit en dur.
- Aide intégrée, export Excel, sauvegardes, quelqu'un d'autre capable de reprendre.

**Partie payante : mise de côté (21/11/2026)**
- Plus d'actualité tant que l'appli ne fonctionne pas parfaitement pour le club. L'idée discutée (gratuit puis payant) reste notée dans `HISTORIQUE.md` au 18/11/2026.

**Autres pistes**
- Accélérer la v1 sans migrer (données gardées sur le téléphone, suppression des vérifications « une fois », `CacheService`) : proposé, mis de côté pour l'instant.
- Notifications push (web).
