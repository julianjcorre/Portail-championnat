/**
 * TC Bazoges – Portail championnat
 *
 * Page web (Apps Script) qui affiche les rencontres de championnat
 * et récolte les présences des joueurs. Toutes les données vivent
 * dans la Google Sheet à laquelle ce script est lié.
 */

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------

var NB_TERRAINS = 2;
// Au-delà de ce nombre de rencontres à domicile le même jour, la page affiche une alerte.
var MAX_DOMICILE_PAR_JOUR = 1;
// Seules ces équipes apparaissent sur la page (les autres lignes de la Sheet sont ignorées).
var EQUIPES = ['Hommes 1', 'Hommes 2'];
// Choix proposé à un joueur qui s'inscrit lui-même sur la page, et équipes qu'il rejoint.
// Avec un seul groupe, la page ne pose pas la question.
var GROUPES_INSCRIPTION = [
  { libelle: 'Hommes', equipes: ['Hommes 1', 'Hommes 2'] },
];

// Comptes Google autorisés à gérer les rencontres (en plus du propriétaire de la Sheet).
var CAPITAINES = [
  'julian.jcorre@gmail.com',
  'florent.guery1@gmail.com',
  'jamin.matthieu85@gmail.com',
];

var NOM_CLUB = 'TC Bazoges';

// ---------------------------------------------------------------------------
// Structure de la Sheet (ne pas modifier sans adapter le reste du code)
// ---------------------------------------------------------------------------

var ONGLET_RENCONTRES = 'Rencontres';
var ONGLET_JOUEURS = 'Joueurs';
var ONGLET_REPONSES = 'Réponses';

var ENTETES_RENCONTRES = ['ID', 'Date', 'Heure', 'Équipe', 'Adversaire', 'Lieu', 'Statut', 'Infos'];
var ENTETES_JOUEURS = ['Nom', 'Équipe(s)', 'Inscrit par la page le'];
var ENTETES_REPONSES = ['ID rencontre', 'Nom', 'Réponse', 'Répondu le'];

var LIEUX = ['Domicile', 'Extérieur'];
var STATUTS = ['Validée', 'En attente'];
var REPONSES = ['Présent', 'Absent'];

// ---------------------------------------------------------------------------
// Menu dans la Sheet
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎾 ' + NOM_CLUB)
    .addItem('Installer les onglets', 'installerOnglets')
    .addItem('Ouvrir la page des joueurs', 'afficherLienPage')
    .addItem('🔑 Autoriser l\'envoi des mails', 'autoriserScript')
    .addSeparator()
    .addItem('Importer le calendrier 2026-2027', 'importerCalendrier')
    .addToUi();
}

/**
 * Crée les onglets manquants avec leurs en-têtes, leurs listes déroulantes
 * et quelques exemples. Ne touche pas aux onglets qui existent déjà.
 */
function installerOnglets() {
  verifierCapitaine_();
  var ss = SpreadsheetApp.getActive();
  var dansUneSemaine = new Date();
  dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);

  var rencontres = ss.getSheetByName(ONGLET_RENCONTRES);
  if (!rencontres) {
    rencontres = ss.insertSheet(ONGLET_RENCONTRES);
    preparerEntetes_(rencontres, ENTETES_RENCONTRES);
    rencontres.getRange('B:B').setNumberFormat('dd/mm/yyyy');
    rencontres.getRange('C:C').setNumberFormat('@');
    rencontres.getRange(2, 1, 3, ENTETES_RENCONTRES.length).setValues([
      [nouvelId_(), dansUneSemaine, '09:00', 'Hommes 1', 'TC Exemple', 'Domicile', 'Validée', 'RDV 8h30 au club'],
      [nouvelId_(), dansUneSemaine, '14:00', 'Hommes 2', 'AS Exemple', 'Domicile', 'En attente', ''],
    ]);
    ajouterListe_(rencontres, 'D2:D', EQUIPES);
    ajouterListe_(rencontres, 'F2:F', LIEUX);
    ajouterListe_(rencontres, 'G2:G', STATUTS);
    rencontres.hideColumns(1);
  }

  var joueurs = ss.getSheetByName(ONGLET_JOUEURS);
  if (!joueurs) {
    joueurs = ss.insertSheet(ONGLET_JOUEURS);
    preparerEntetes_(joueurs, ENTETES_JOUEURS);
    joueurs.getRange(2, 1, 4, 2).setValues([
      ['Julien', 'Hommes 1'],
      ['Thomas G.', 'Hommes 1, Hommes 2'],
      ['Marc', 'Hommes 2'],
    ]);
  }

  var reponses = ss.getSheetByName(ONGLET_REPONSES);
  if (!reponses) {
    reponses = ss.insertSheet(ONGLET_REPONSES);
    preparerEntetes_(reponses, ENTETES_REPONSES);
    reponses.getRange('D:D').setNumberFormat('dd/mm/yyyy hh:mm');
    reponses.getRange(1, 1, 1, ENTETES_REPONSES.length)
      .setNote('Onglet rempli automatiquement par la page web. Ne pas modifier.');
  }

  SpreadsheetApp.getUi().alert(
    'Onglets prêts. Remplacez les exemples dans « ' + ONGLET_RENCONTRES + ' » et « ' + ONGLET_JOUEURS + ' ».\n\n' +
    'La colonne ID (cachée) se remplit toute seule : ne pas la modifier.'
  );
}

// Calendrier officiel saison 2026-2027 (PDF « Calendrier des rencontres »), équipes Hommes uniquement.
var CALENDRIER = [
  ['2026-10-18', 'Hommes 1', 'Extérieur', 'TC Les Achards 2'],
  ['2026-10-18', 'Hommes 2', 'Extérieur', 'St Etienne Palluau 1'],
  ['2026-11-01', 'Hommes 2', 'Domicile', 'TC Flavois'],
  ['2026-11-08', 'Hommes 1', 'Domicile', 'Ste Hermine TC 1'],
  ['2026-11-15', 'Hommes 2', 'Domicile', 'TC Rive de Lion 1'],
  ['2026-11-22', 'Hommes 1', 'Extérieur', 'TC Montaigu 5'],
  ['2026-12-06', 'Hommes 1', 'Domicile', 'TC Montaigu 4'],
  ['2026-12-06', 'Hommes 2', 'Extérieur', 'TC Bellevigny 2'],
  ['2027-01-17', 'Hommes 1', 'Extérieur', 'TC Talmont 2'],
  ['2027-01-17', 'Hommes 2', 'Domicile', 'TC Mouchampais 2'],
  ['2027-01-31', 'Hommes 1', 'Domicile', 'Atlantique TC 3'],
  ['2027-01-31', 'Hommes 2', 'Extérieur', 'TC Macheen 2'],
  ['2027-02-07', 'Hommes 2', 'Domicile', 'TC Loulaysien 3'],
  ['2027-02-14', 'Hommes 1', 'Domicile', 'TC des Clouzeaux 2'],
];

/**
 * Ajoute les rencontres à venir du CALENDRIER à l'onglet Rencontres.
 * Une rencontre déjà présente (même date, même équipe) garde son ID, son heure,
 * son statut, ses infos et ses réponses : seuls l'adversaire et le lieu sont mis à jour.
 * Propose ensuite de supprimer les rencontres à venir absentes du calendrier.
 */
function importerCalendrier() {
  verifierCapitaine_();
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName(ONGLET_RENCONTRES);
  var aujourdhui = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var cle = function (date, equipe) { return date + '|' + equipe; };

  var resultat = ajouterCalendrier_();
  var ajoutees = resultat.ajoutees, misesAJour = resultat.misesAJour, attendues = resultat.attendues;

  // Rencontres à venir qui ne figurent pas au calendrier (exemples, dates provisoires…).
  var enTrop = [];
  lireLignes_(ONGLET_RENCONTRES).forEach(function (l, i) {
    if (!(l[1] instanceof Date)) return;
    var date = Utilities.formatDate(l[1], tz, 'yyyy-MM-dd');
    if (date >= aujourdhui && !attendues[cle(date, String(l[3]).trim())]) {
      enTrop.push({ ligne: i + 2, texte: Utilities.formatDate(l[1], tz, 'dd/MM/yyyy') + ' ' + l[3] + (l[4] ? ' – ' + l[4] : '') });
    }
  });
  var supprimees = 0;
  if (enTrop.length) {
    var choix = ui.alert('Rencontres absentes du calendrier officiel',
      enTrop.map(function (x) { return '• ' + x.texte; }).join('\n') + '\n\nLes supprimer ?',
      ui.ButtonSet.YES_NO);
    if (choix === ui.Button.YES) {
      enTrop.sort(function (a, b) { return b.ligne - a.ligne; }).forEach(function (x) { sheet.deleteRow(x.ligne); });
      supprimees = enTrop.length;
    }
  }

  var derniere = sheet.getLastRow();
  if (derniere > 2) sheet.getRange(2, 1, derniere - 1, sheet.getLastColumn()).sort([{ column: 2 }, { column: 4 }]);

  ui.alert('Calendrier importé : ' + ajoutees + ' rencontre(s) ajoutée(s), ' + misesAJour + ' mise(s) à jour, ' +
    supprimees + ' supprimée(s).\n\nPassez le statut à « Validée » à réception des convocations.');
}

/**
 * Ajoute les rencontres à venir du CALENDRIER absentes de l'onglet Rencontres
 * (même date + même équipe) et met à jour adversaire et lieu des autres.
 * Ne touche ni à l'heure, ni au statut, ni aux infos, ni aux réponses.
 */
function ajouterCalendrier_() {
  var ss = SpreadsheetApp.getActive();
  var tz = ss.getSpreadsheetTimeZone();
  var sheet = ss.getSheetByName(ONGLET_RENCONTRES);
  var aujourdhui = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var cle = function (date, equipe) { return date + '|' + equipe; };

  var existantes = {};
  lireLignes_(ONGLET_RENCONTRES).forEach(function (l, i) {
    if (l[1] instanceof Date) existantes[cle(Utilities.formatDate(l[1], tz, 'yyyy-MM-dd'), String(l[3]).trim())] = i + 2;
  });

  var ajoutees = 0, misesAJour = 0, attendues = {};
  CALENDRIER.forEach(function (r) {
    var date = r[0], equipe = r[1], lieu = r[2], adversaire = r[3];
    attendues[cle(date, equipe)] = true;
    if (date < aujourdhui) return;
    var ligne = existantes[cle(date, equipe)];
    if (ligne) {
      sheet.getRange(ligne, 5, 1, 2).setValues([[adversaire, lieu]]);
      misesAJour++;
    } else {
      var p = date.split('-');
      sheet.appendRow([nouvelId_(), new Date(+p[0], +p[1] - 1, +p[2]), '', equipe, adversaire, lieu, 'En attente', '']);
      ajoutees++;
    }
  });
  return { ajoutees: ajoutees, misesAJour: misesAJour, attendues: attendues };
}

var EXEMPLES = ['TC Exemple', 'AS Exemple', 'US Exemple'];

/**
 * Au premier chargement de la page après sa mise en ligne : importe le
 * calendrier officiel et retire les rencontres d'exemple (avec leurs réponses).
 * Ne s'exécute qu'une fois (propriété du script).
 */
function importerCalendrierUneFois_() {
  var props = PropertiesService.getScriptProperties();
  var CLE = 'calendrier_2026_2027_importe';
  if (props.getProperty(CLE)) return;

  var verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    if (props.getProperty(CLE)) return;
    ajouterCalendrier_();

    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(ONGLET_RENCONTRES);
    var idsExemples = [];
    lireLignes_(ONGLET_RENCONTRES)
      .map(function (l, i) {
        if (EXEMPLES.indexOf(String(l[4]).trim()) === -1) return 0;
        idsExemples.push(String(l[0]));
        return i + 2;
      })
      .filter(Boolean).reverse()
      .forEach(function (n) { sheet.deleteRow(n); });

    var reponses = ss.getSheetByName(ONGLET_REPONSES);
    lireLignes_(ONGLET_REPONSES)
      .map(function (l, i) { return idsExemples.indexOf(String(l[0])) !== -1 ? i + 2 : 0; })
      .filter(Boolean).reverse()
      .forEach(function (n) { reponses.deleteRow(n); });

    var derniere = sheet.getLastRow();
    if (derniere > 2) sheet.getRange(2, 1, derniere - 1, sheet.getLastColumn()).sort([{ column: 2 }, { column: 4 }]);
    SpreadsheetApp.flush();
    props.setProperty(CLE, new Date().toISOString());
  } finally {
    verrou.releaseLock();
  }
}

/**
 * Nettoyage ponctuel demandé par le club : ne garde que Julian C dans l'onglet
 * Joueurs et supprime les réponses des joueurs retirés. Ne s'exécute qu'une fois.
 */
function nettoyerJoueursUneFois_() {
  var props = PropertiesService.getScriptProperties();
  var CLE = 'joueurs_nettoyes_2026_10';
  if (props.getProperty(CLE)) return;

  var verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    if (props.getProperty(CLE)) return;
    var garder = [cleNom_('Julian C')];
    var ss = SpreadsheetApp.getActive();
    var joueurs = ss.getSheetByName(ONGLET_JOUEURS);
    var retires = [];
    lireLignes_(ONGLET_JOUEURS)
      .map(function (l, i) {
        var nom = String(l[0]).trim();
        if (garder.indexOf(cleNom_(nom)) !== -1) return 0;
        retires.push(nom);
        return i + 2;
      })
      .filter(Boolean).reverse()
      .forEach(function (n) { joueurs.deleteRow(n); });

    var reponses = ss.getSheetByName(ONGLET_REPONSES);
    lireLignes_(ONGLET_REPONSES)
      .map(function (l, i) { return retires.indexOf(String(l[1]).trim()) !== -1 ? i + 2 : 0; })
      .filter(Boolean).reverse()
      .forEach(function (n) { reponses.deleteRow(n); });

    SpreadsheetApp.flush();
    props.setProperty(CLE, new Date().toISOString());
  } finally {
    verrou.releaseLock();
  }
}

/**
 * À lancer une fois avec le compte du club : déclenche l'écran d'autorisation
 * Google (dont l'envoi des mails de connexion des capitaines).
 */
function autoriserScript() {
  var message = 'Autorisations OK. Mails de connexion encore possibles aujourd\'hui : ' + MailApp.getRemainingDailyQuota() + '.';
  // Message non bloquant : lancée depuis l'éditeur, une boîte de dialogue attendrait un clic dans la Sheet.
  console.log(message);
  SpreadsheetApp.getActive().toast(message, '🔑 Autorisations', 10);
}

function afficherLienPage() {
  var url = ScriptApp.getService().getUrl();
  var ui = SpreadsheetApp.getUi();
  if (!url) {
    ui.alert('La page n\'est pas encore déployée : Extensions → Apps Script → Déployer → Nouveau déploiement → Application Web.');
    return;
  }
  ui.alert('Lien à épingler dans les groupes WhatsApp :\n\n' + url);
}

function preparerEntetes_(sheet, entetes) {
  sheet.getRange(1, 1, 1, entetes.length).setValues([entetes]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function ajouterListe_(sheet, a1, valeurs) {
  var regle = SpreadsheetApp.newDataValidation().requireValueInList(valeurs, true).build();
  sheet.getRange(a1).setDataValidation(regle);
}

function nouvelId_() {
  return Utilities.getUuid().slice(0, 8);
}

// ---------------------------------------------------------------------------
// Espace capitaines (dans la page web)
//
// Connexion par lien envoyé par mail : le capitaine tape son adresse, reçoit
// un lien contenant un jeton secret, et la page garde ce jeton. Les fonctions
// de gestion exigent ce jeton (ou, dans la Sheet, le compte Google connecté).
// ---------------------------------------------------------------------------

var DUREE_JETON_JOURS = 365;
var MAX_MAILS_PAR_JOUR = 5;

function adressesCapitaines_() {
  var proprietaire = SpreadsheetApp.getActive().getOwner();
  return CAPITAINES.map(function (e) { return e.toLowerCase(); })
    .concat(proprietaire ? [String(proprietaire.getEmail()).toLowerCase()] : []);
}

/**
 * Renvoie l'adresse du capitaine, ou lève une erreur.
 * Avec un jeton : connexion depuis la page. Sans jeton : compte Google
 * connecté (menus de la Sheet) ; vide pour un visiteur de la page publique.
 */
function verifierCapitaine_(jeton) {
  var email = '';
  if (jeton) {
    var brut = PropertiesService.getScriptProperties().getProperty('jeton_' + jeton);
    var info = brut ? JSON.parse(brut) : null;
    if (info && info.expire > Date.now()) email = info.email;
  } else {
    email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  }
  if (!email || adressesCapitaines_().indexOf(email) === -1) {
    throw new Error(jeton ? 'Connexion capitaine expirée : redemande un lien.' : 'Réservé aux capitaines.');
  }
  return email;
}

/**
 * Envoie un lien de connexion si l'adresse est celle d'un capitaine.
 * Répond toujours la même chose, pour ne pas révéler qui est capitaine.
 */
function demanderLienCapitaine(adresse) {
  var email = String(adresse || '').trim().toLowerCase();
  var reponse = 'Si cette adresse est celle d\'un capitaine, un mail avec le lien de connexion vient de partir. Pense à regarder les spams.';
  if (adressesCapitaines_().indexOf(email) === -1) return reponse;

  var props = PropertiesService.getScriptProperties();
  var cleCompteur = 'mails_' + email + '_' + Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyyMMdd');
  var envoyes = Number(props.getProperty(cleCompteur) || 0);
  if (envoyes >= MAX_MAILS_PAR_JOUR) return reponse;
  props.setProperty(cleCompteur, String(envoyes + 1));

  var jeton = Utilities.getUuid();
  props.setProperty('jeton_' + jeton, JSON.stringify({ email: email, expire: Date.now() + DUREE_JETON_JOURS * 86400000 }));
  var lien = ScriptApp.getService().getUrl() + '?capitaine=' + jeton;
  MailApp.sendEmail({
    to: email,
    subject: NOM_CLUB + ' – Connexion à l\'espace capitaines',
    body: 'Bonjour,\n\nPour te connecter à l\'espace capitaines du portail championnat, ouvre ce lien sur ton téléphone :\n\n' +
      lien + '\n\nLe téléphone s\'en souviendra ensuite. Ne transfère pas ce mail : le lien donne accès à la gestion des rencontres.\n',
    name: NOM_CLUB,
  });
  return reponse;
}

/** Adresse du capitaine connecté avec ce jeton (erreur si le jeton n'est plus valable). */
function infoCapitaine(jeton) {
  return { email: verifierCapitaine_(jeton) };
}

function deconnecterCapitaine(jeton) {
  if (/^[0-9a-f-]{36}$/.test(String(jeton))) PropertiesService.getScriptProperties().deleteProperty('jeton_' + jeton);
}

function getDonneesCapitaines(jeton) {
  verifierCapitaine_(jeton);
  var reponses = lireReponses_();
  return {
    equipes: EQUIPES,
    lieux: LIEUX,
    statuts: STATUTS,
    rencontres: lireRencontres_().map(function (r) {
      r.nbReponses = Object.keys(reponses[r.id] || {}).length;
      return r;
    }),
  };
}

/** Ajoute (sans id) ou modifie (avec id) une rencontre. */
function enregistrerRencontre(jeton, r) {
  verifierCapitaine_(jeton);
  var m = String(r.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('Date invalide.');
  if (EQUIPES.indexOf(r.equipe) === -1) throw new Error('Équipe inconnue.');
  if (r.lieu && LIEUX.indexOf(r.lieu) === -1) throw new Error('Lieu inconnu.');
  if (STATUTS.indexOf(r.statut) === -1) throw new Error('Statut inconnu.');
  var valeurs = [
    new Date(+m[1], +m[2] - 1, +m[3]),
    formaterHeure_(r.heure || ''),
    r.equipe,
    String(r.adversaire || '').trim(),
    r.lieu || '',
    r.statut,
    String(r.infos || '').trim(),
  ];

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_RENCONTRES);
    if (r.id) {
      var ligne = ligneRencontre_(r.id);
      if (!ligne) throw new Error('Rencontre introuvable. Rechargez le panneau.');
      sheet.getRange(ligne, 2, 1, valeurs.length).setValues([valeurs]);
    } else {
      sheet.appendRow([nouvelId_()].concat(valeurs));
    }
    var derniere = sheet.getLastRow();
    if (derniere > 2) sheet.getRange(2, 1, derniere - 1, sheet.getLastColumn()).sort([{ column: 2 }, { column: 4 }]);
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return getDonneesCapitaines(jeton);
}

/** Supprime une rencontre et les réponses des joueurs à cette rencontre. */
function supprimerRencontre(jeton, id) {
  verifierCapitaine_(jeton);
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActive();
    var ligne = ligneRencontre_(id);
    if (!ligne) throw new Error('Rencontre introuvable. Rechargez le panneau.');
    ss.getSheetByName(ONGLET_RENCONTRES).deleteRow(ligne);

    var reponses = ss.getSheetByName(ONGLET_REPONSES);
    lireLignes_(ONGLET_REPONSES)
      .map(function (l, i) { return String(l[0]) === id ? i + 2 : 0; })
      .filter(Boolean)
      .reverse()
      .forEach(function (n) { reponses.deleteRow(n); });
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return getDonneesCapitaines(jeton);
}

/** Renomme un joueur dans l'onglet Joueurs et dans ses réponses. */
function renommerJoueur(jeton, ancien, nouveauSaisi) {
  verifierCapitaine_(jeton);
  var nouveau = nettoyerNom_(nouveauSaisi);
  if (nouveau.length < 2 || nouveau.length > 40 || !/^[\p{L} .'-]+$/u.test(nouveau)) throw new Error('Nom invalide.');
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActive();
    var noms = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); });
    var i = noms.indexOf(ancien);
    if (i === -1) throw new Error('Joueur introuvable. Rechargez la page.');
    var doublon = noms.filter(function (n, j) { return j !== i && cleNom_(n) === cleNom_(nouveau); })[0];
    if (doublon) throw new Error('« ' + doublon + ' » existe déjà : supprime plutôt le doublon.');
    ss.getSheetByName(ONGLET_JOUEURS).getRange(i + 2, 1).setValue(nouveau);

    var reponses = ss.getSheetByName(ONGLET_REPONSES);
    lireLignes_(ONGLET_REPONSES).forEach(function (l, j) {
      if (String(l[1]).trim() === ancien) reponses.getRange(j + 2, 2).setValue(nouveau);
    });
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return { nom: nouveau };
}

/** Supprime un joueur et ses réponses. */
function supprimerJoueur(jeton, nom) {
  verifierCapitaine_(jeton);
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActive();
    var i = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); }).indexOf(nom);
    if (i === -1) throw new Error('Joueur introuvable. Rechargez la page.');
    ss.getSheetByName(ONGLET_JOUEURS).deleteRow(i + 2);

    var reponses = ss.getSheetByName(ONGLET_REPONSES);
    lireLignes_(ONGLET_REPONSES)
      .map(function (l, j) { return String(l[1]).trim() === nom ? j + 2 : 0; })
      .filter(Boolean).reverse()
      .forEach(function (n) { reponses.deleteRow(n); });
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return { nom: nom };
}

function ligneRencontre_(id) {
  var ids = lireLignes_(ONGLET_RENCONTRES).map(function (l) { return String(l[0]); });
  var i = ids.indexOf(String(id));
  return i === -1 ? 0 : i + 2;
}

// ---------------------------------------------------------------------------
// Page web
// ---------------------------------------------------------------------------

function doGet(e) {
  var page = HtmlService.createTemplateFromFile('Index');
  page.nomClub = NOM_CLUB;
  // Lien de connexion capitaine reçu par mail (format vérifié : il est réécrit dans la page).
  var jeton = String((e && e.parameter && e.parameter.capitaine) || '');
  page.jetonCapitaine = /^[0-9a-f-]{36}$/.test(jeton) ? jeton : '';
  return page.evaluate()
    .setTitle(NOM_CLUB + ' – Championnat')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Données envoyées à la page : joueurs, rencontres à venir (à partir d'hier)
 * et réponses déjà données.
 */
function getDonnees() {
  importerCalendrierUneFois_();
  nettoyerJoueursUneFois_();
  var ss = SpreadsheetApp.getActive();
  var tz = ss.getSpreadsheetTimeZone();

  var joueurs = lireLignes_(ONGLET_JOUEURS)
    .filter(function (l) { return String(l[0]).trim(); })
    .map(function (l) {
      return {
        nom: String(l[0]).trim(),
        equipes: String(l[1]).split(',').map(function (e) { return e.trim(); }).filter(String),
      };
    })
    .sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });

  var rencontres = lireRencontres_();

  return {
    equipes: EQUIPES,
    groupes: GROUPES_INSCRIPTION.map(function (g) { return g.libelle; }),
    nbTerrains: NB_TERRAINS,
    maxDomicileParJour: MAX_DOMICILE_PAR_JOUR,
    joueurs: joueurs,
    rencontres: rencontres,
    reponses: lireReponses_(),
  };
}

/**
 * Enregistre la réponse d'un joueur à une ou plusieurs rencontres
 * (un joueur de plusieurs équipes répond une fois pour toute la journée).
 * reponse : 'Présent', 'Absent', ou '' pour annuler.
 * Renvoie les réponses à jour de toutes les rencontres.
 */
function repondre(idsRencontres, nom, reponse) {
  var ids = [].concat(idsRencontres).map(String);
  if (!ids.length) throw new Error('Aucune rencontre indiquée.');
  if (reponse && REPONSES.indexOf(reponse) === -1) throw new Error('Réponse inconnue.');

  var nomsConnus = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); });
  if (nomsConnus.indexOf(nom) === -1) throw new Error('Joueur inconnu : ' + nom);

  var idsConnus = lireLignes_(ONGLET_RENCONTRES).map(function (l) { return String(l[0]); });
  ids.forEach(function (id) {
    if (idsConnus.indexOf(id) === -1) throw new Error('Rencontre introuvable. Rechargez la page.');
  });

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_REPONSES);
    var lignes = lireLignes_(ONGLET_REPONSES);
    var maintenant = new Date();
    var aSupprimer = [];
    ids.forEach(function (id) {
      var index = -1;
      for (var i = 0; i < lignes.length; i++) {
        if (String(lignes[i][0]) === id && String(lignes[i][1]) === nom) { index = i; break; }
      }
      if (!reponse) {
        if (index !== -1) aSupprimer.push(index + 2);
      } else if (index !== -1) {
        sheet.getRange(index + 2, 3, 1, 2).setValues([[reponse, maintenant]]);
      } else {
        sheet.appendRow([id, nom, reponse, maintenant]);
      }
    });
    // Du bas vers le haut, pour ne pas décaler les lignes restant à supprimer.
    aSupprimer.sort(function (x, y) { return y - x; }).forEach(function (ligne) { sheet.deleteRow(ligne); });
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return lireReponses_();
}

/**
 * Inscription d'un joueur qui a tapé son nom sur la page.
 * Si le nom existe déjà (sans tenir compte des majuscules ni des accents),
 * renvoie le nom existant ; sinon l'ajoute à l'onglet Joueurs avec les
 * équipes du groupe choisi. Renvoie { nom, donnees }.
 */
function inscrire(nomSaisi, libelleGroupe) {
  var nom = nettoyerNom_(nomSaisi);
  if (nom.length < 2) throw new Error('Nom trop court.');
  if (nom.length > 40) throw new Error('Nom trop long.');
  if (!/^[\p{L} .'-]+$/u.test(nom)) throw new Error('Le nom ne doit contenir que des lettres.');

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var existant = lireLignes_(ONGLET_JOUEURS)
      .map(function (l) { return String(l[0]).trim(); })
      .filter(function (n) { return n && cleNom_(n) === cleNom_(nom); })[0];
    if (existant) return { nom: existant, donnees: getDonnees() };

    var groupe = GROUPES_INSCRIPTION.length === 1
      ? GROUPES_INSCRIPTION[0]
      : GROUPES_INSCRIPTION.filter(function (g) { return g.libelle === libelleGroupe; })[0];
    if (!groupe) throw new Error('Choisis ton équipe.');

    var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_JOUEURS);
    if (!sheet.getRange(1, 3).getValue()) sheet.getRange(1, 3).setValue(ENTETES_JOUEURS[2]).setFontWeight('bold');
    sheet.appendRow([nom, groupe.equipes.join(', '), new Date()]);
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return { nom: nom, donnees: getDonnees() };
}

/** « julien  c » → « Julien C ». */
function nettoyerNom_(texte) {
  return String(texte || '').trim().replace(/\s+/g, ' ').toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, function (m, sep, lettre) { return sep + lettre.toUpperCase(); });
}

/** Clé de comparaison : sans accents, majuscules, points ni espaces. */
function cleNom_(texte) {
  return String(texte).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
}

// ---------------------------------------------------------------------------
// Lecture de la Sheet
// ---------------------------------------------------------------------------

/** Rencontres à venir (à partir d'hier), triées par date, heure et équipe. */
function lireRencontres_() {
  var ss = SpreadsheetApp.getActive();
  var tz = ss.getSpreadsheetTimeZone();
  var hier = new Date();
  hier.setDate(hier.getDate() - 1);
  var depuis = Utilities.formatDate(hier, tz, 'yyyy-MM-dd');

  var lignes = completerIds_();
  // L'heure est lue telle qu'affichée : les cellules au format heure sont
  // décalées de quelques minutes si on passe par un objet Date.
  var heures = lignes.length
    ? ss.getSheetByName(ONGLET_RENCONTRES).getRange(2, 3, lignes.length, 1).getDisplayValues()
    : [];

  return lignes
    .map(function (l, i) { return { ligne: l, heure: heures[i][0] }; })
    .filter(function (x) { return x.ligne[1] instanceof Date; })
    .map(function (x) {
      var l = x.ligne;
      return {
        id: String(l[0]),
        date: Utilities.formatDate(l[1], tz, 'yyyy-MM-dd'),
        heure: formaterHeure_(x.heure),
        equipe: String(l[3]).trim(),
        adversaire: String(l[4]).trim(),
        lieu: String(l[5]).trim(),
        statut: String(l[6]).trim() === 'Validée' ? 'Validée' : 'En attente',
        infos: String(l[7]).trim(),
      };
    })
    .filter(function (r) { return r.date >= depuis && EQUIPES.indexOf(r.equipe) !== -1; })
    .sort(function (a, b) {
      return (a.date + a.heure + a.equipe).localeCompare(b.date + b.heure + b.equipe);
    });
}

/** Lignes de données d'un onglet (sans l'en-tête). */
function lireLignes_(nomOnglet) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(nomOnglet);
  if (!sheet) throw new Error('Onglet « ' + nomOnglet + ' » introuvable. Menu 🎾 → Installer les onglets.');
  var derniere = sheet.getLastRow();
  if (derniere < 2) return [];
  return sheet.getRange(2, 1, derniere - 1, sheet.getLastColumn()).getValues();
}

/** Donne un ID aux rencontres saisies sans ID, puis renvoie toutes les lignes. */
function completerIds_() {
  var lignes = lireLignes_(ONGLET_RENCONTRES);
  var manquants = false;
  lignes.forEach(function (l) {
    if (!String(l[0]).trim() && l[1]) { l[0] = nouvelId_(); manquants = true; }
  });
  if (manquants) {
    var verrou = LockService.getScriptLock();
    verrou.waitLock(10000);
    try {
      var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_RENCONTRES);
      // Relecture sous verrou pour ne pas écraser un ID posé entre-temps.
      var ids = sheet.getRange(2, 1, lignes.length, 1).getValues();
      ids.forEach(function (cellule, i) {
        if (String(cellule[0]).trim()) lignes[i][0] = cellule[0];
        else cellule[0] = lignes[i][0];
      });
      sheet.getRange(2, 1, ids.length, 1).setValues(ids);
    } finally {
      verrou.releaseLock();
    }
  }
  return lignes;
}

/** { idRencontre: { nom: 'Présent' | 'Absent' } } */
function lireReponses_() {
  var reponses = {};
  lireLignes_(ONGLET_REPONSES).forEach(function (l) {
    var id = String(l[0]);
    if (!id) return;
    reponses[id] = reponses[id] || {};
    reponses[id][String(l[1])] = String(l[2]);
  });
  return reponses;
}

/** « 9h », « 9h30 », « 09:30:00 » → « 09:00 », « 09:30 ». Laisse le reste tel quel. */
function formaterHeure_(texte) {
  var m = String(texte).trim().match(/^(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (!m) return String(texte).trim();
  return ('0' + m[1]).slice(-2) + ':' + (m[2] || '00');
}
