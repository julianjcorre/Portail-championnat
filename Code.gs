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

// Adresse de la page des joueurs hébergée sur GitHub Pages (vide = page Apps Script).
// Les liens de connexion des capitaines pointent vers cette adresse.
var URL_PAGE = 'https://tcbazogeais.github.io/';

// ---------------------------------------------------------------------------
// Structure de la Sheet (ne pas modifier sans adapter le reste du code)
// ---------------------------------------------------------------------------

var ONGLET_RENCONTRES = 'Rencontres';
var ONGLET_JOUEURS = 'Joueurs';
var ONGLET_REPONSES = 'Réponses';
var ONGLET_SELECTION = 'Sélection';
var ONGLET_RESULTATS = 'Résultats';

var ENTETES_RENCONTRES = ['ID', 'Date', 'Heure', 'Équipe', 'Adversaire', 'Lieu', 'Statut', 'Infos', 'Terrains'];
var ENTETES_JOUEURS = ['Nom', 'Équipe(s)', 'Inscrit par la page le', 'Classement', 'Classement vérifié le', 'Licence'];
var ENTETES_REPONSES = ['ID rencontre', 'Nom', 'Réponse', 'Répondu le'];
var ENTETES_SELECTION = ['ID rencontre', 'Nom', 'Rôle', 'Modifié le'];
// Une ligne par partie. Plusieurs joueurs (double) : séparés par « / ». Score vu du TCB : « 6-3 4-6 7-6(5) ».
var ENTETES_RESULTATS = ['ID rencontre', 'Date', 'Équipe', 'Adversaire', 'Lieu', 'Partie', 'Joueur(s) TCB', 'Classement(s) TCB',
  'Adversaire(s)', 'Classement(s) adv.', 'Score', 'Résultat', 'Modifié le'];

var LIEUX = ['Domicile', 'Extérieur'];
var TERRAINS = ['1', '2'];
var STATUTS = ['Validée', 'En attente'];
var REPONSES = ['Présent', 'Absent'];
// Classements FFT, du plus faible au meilleur (ordre utilisé pour trier les joueurs).
var CLASSEMENTS = ['NC', '40', '30/5', '30/4', '30/3', '30/2', '30/1', '30', '15/5', '15/4', '15/3', '15/2', '15/1', '15',
  '5/6', '4/6', '3/6', '2/6', '1/6', '0', '-2/6', '-4/6', '-15', '-30'];
// Nombre de positions de jeu (n°1, n°2…) dans la sélection d'une équipe.
var NB_POSITIONS = 4;
// Parties d'une rencontre, dans l'ordre de la feuille de match.
var PARTIES = ['Simple 1', 'Simple 2', 'Simple 3', 'Simple 4', 'Double 1'];
var RESULTATS = ['Gagné', 'Perdu'];

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
    rencontres.getRange(2, 1, 2, ENTETES_RENCONTRES.length).setValues([
      [nouvelId_(), dansUneSemaine, '09:00', 'Hommes 1', 'TC Exemple', 'Domicile', 'Validée', 'RDV 8h30 au club', '2'],
      [nouvelId_(), dansUneSemaine, '14:00', 'Hommes 2', 'AS Exemple', 'Domicile', 'En attente', '', ''],
    ]);
    ajouterListe_(rencontres, 'D2:D', EQUIPES);
    ajouterListe_(rencontres, 'F2:F', LIEUX);
    ajouterListe_(rencontres, 'G2:G', STATUTS);
    ajouterListe_(rencontres, 'I2:I', TERRAINS);
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
var MAX_MAILS_PAR_JOUR = 10;

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
 * Renvoie un message qui dit clairement ce qui s'est passé.
 */
function demanderLienCapitaine(adresse) {
  var email = String(adresse || '').trim().toLowerCase();
  if (!email) throw new Error('Tape ton adresse e-mail.');
  if (adressesCapitaines_().indexOf(email) === -1) {
    throw new Error('L\'adresse ' + email + ' n\'est pas dans la liste des capitaines. Vérifie l\'orthographe.');
  }

  var props = PropertiesService.getScriptProperties();
  var maintenant = new Date();
  var cleCompteur = 'envois_' + email + '_' + Utilities.formatDate(maintenant, 'Europe/Paris', 'yyyyMMdd');
  var envoyes = Number(props.getProperty(cleCompteur) || 0);
  if (envoyes >= MAX_MAILS_PAR_JOUR) {
    throw new Error('Trop de demandes aujourd\'hui pour ' + email + '. Utilise le dernier mail reçu ou réessaie demain.');
  }

  var jeton = creerJeton_(email);
  var lien = (URL_PAGE || ScriptApp.getService().getUrl()) + '?capitaine=' + jeton;
  var heure = Utilities.formatDate(maintenant, 'Europe/Paris', 'dd/MM HH:mm');
  // Code à taper dans l'appli installée (valable 30 minutes).
  var code = String(Math.floor(100000 + Math.random() * 900000));
  props.setProperty('code_' + email, JSON.stringify({ code: code, jeton: jeton, expire: Date.now() + 30 * 60000, essais: 0 }));
  MailApp.sendEmail({
    to: email,
    // Heure dans l'objet : Gmail ne regroupe pas le mail avec les demandes précédentes.
    subject: NOM_CLUB + ' – Code de connexion capitaine (' + heure + ')',
    body: 'Bonjour,\n\nPour te connecter à l\'espace capitaines du portail championnat :\n\n' +
      '• dans l\'appli installée sur ton téléphone, tape ce code : ' + code + ' (valable 30 minutes)\n\n' +
      '• ou ouvre ce lien dans ton navigateur :\n' + lien + '\n\n' +
      'Le téléphone s\'en souviendra ensuite. Ne transfère pas ce mail : il donne accès à la gestion des rencontres.\n',
    name: NOM_CLUB,
  });
  // Compté seulement une fois le mail réellement parti.
  props.setProperty(cleCompteur, String(envoyes + 1));
  console.log('Lien de connexion envoyé à ' + email);
  return 'Mail envoyé à ' + email + ' (objet « ' + NOM_CLUB + ' – Code de connexion capitaine (' + heure + ') »). ' +
    'Il arrive en 1 à 2 minutes ; regarde aussi Spam et Promotions. Tape le code du mail ci-dessous, ou ouvre son lien.';
}

function creerJeton_(email) {
  var jeton = Utilities.getUuid();
  PropertiesService.getScriptProperties()
    .setProperty('jeton_' + jeton, JSON.stringify({ email: email, expire: Date.now() + DUREE_JETON_JOURS * 86400000 }));
  return jeton;
}

/**
 * Connexion par code (appli installée sur l'écran d'accueil : les liens des mails
 * s'ouvrent dans le navigateur, pas dans l'appli). Renvoie { jeton }.
 */
function validerCodeCapitaine(adresse, code) {
  var email = String(adresse || '').trim().toLowerCase();
  var props = PropertiesService.getScriptProperties();
  var brut = props.getProperty('code_' + email);
  var info = brut ? JSON.parse(brut) : null;
  if (!info || info.expire < Date.now()) throw new Error('Code expiré : redemande un mail de connexion.');
  if (info.essais >= 5) throw new Error('Trop d\'essais : redemande un mail de connexion.');
  if (String(code || '').replace(/\D/g, '') !== info.code) {
    info.essais++;
    props.setProperty('code_' + email, JSON.stringify(info));
    throw new Error('Code incorrect. Vérifie le dernier mail reçu.');
  }
  props.deleteProperty('code_' + email);
  verifierCapitaine_(info.jeton);
  return { jeton: info.jeton };
}

// Code capitaine choisi par le capitaine (6 chiffres), après une 1re connexion par mail.
// Gardé brouillé (SHA-256 + sel) dans les propriétés du script, jamais en clair.
// 5 erreurs de suite : le code est effacé, il faut repasser par le mail.
var MAX_ESSAIS_CODE_PERSO = 5;

function brouillerCode_(sel, code) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sel + ':' + code, Utilities.Charset.UTF_8));
}

/** Enregistre (ou remplace) le code capitaine du capitaine connecté. */
function definirCodePerso(jeton, code) {
  var email = verifierCapitaine_(jeton);
  code = String(code || '');
  if (!/^\d{6}$/.test(code)) throw new Error('Le code doit faire 6 chiffres.');
  if (/^(\d)\1{5}$/.test(code) || code === '123456' || code === '654321') {
    throw new Error('Code trop facile à deviner : choisis-en un autre.');
  }
  var sel = Utilities.getUuid();
  PropertiesService.getScriptProperties()
    .setProperty('code_perso_' + email, JSON.stringify({ sel: sel, empreinte: brouillerCode_(sel, code), essais: 0 }));
  return 'Code capitaine enregistré.';
}

/** Connexion avec l'adresse et le code capitaine choisi. Renvoie { jeton }. */
function connexionCodePerso(adresse, code) {
  var email = String(adresse || '').trim().toLowerCase();
  if (!email) throw new Error('Tape ton adresse e-mail.');
  if (adressesCapitaines_().indexOf(email) === -1) {
    throw new Error('L\'adresse ' + email + ' n\'est pas dans la liste des capitaines. Vérifie l\'orthographe.');
  }
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var brut = props.getProperty('code_perso_' + email);
    if (!brut) throw new Error('PAS_DE_CODE: Pas encore de code capitaine pour cette adresse : reçois d\'abord un code par mail.');
    var info = JSON.parse(brut);
    if (brouillerCode_(info.sel, String(code || '').replace(/\D/g, '')) !== info.empreinte) {
      info.essais++;
      if (info.essais >= MAX_ESSAIS_CODE_PERSO) {
        props.deleteProperty('code_perso_' + email);
        throw new Error('PAS_DE_CODE: Trop d\'erreurs : ton code capitaine est effacé. Reçois un code par mail pour en choisir un nouveau.');
      }
      props.setProperty('code_perso_' + email, JSON.stringify(info));
      var reste = MAX_ESSAIS_CODE_PERSO - info.essais;
      throw new Error('Code incorrect. Encore ' + reste + ' essai' + (reste > 1 ? 's' : '') + ' avant de devoir repasser par le mail.');
    }
    if (info.essais) { info.essais = 0; props.setProperty('code_perso_' + email, JSON.stringify(info)); }
  } finally {
    verrou.releaseLock();
  }
  return { jeton: creerJeton_(email) };
}

/**
 * Classement d'une case de la Sheet. Une saisie à la main comme « 15/4 » a pu être
 * transformée en date (15 avril) par la Sheet : on la remet en « 15/4 ».
 */
function lireClassement_(valeur, tz) {
  var texte = valeur instanceof Date ? Utilities.formatDate(valeur, tz, 'd/M') : String(valeur === undefined ? '' : valeur).trim();
  return CLASSEMENTS.indexOf(texte) !== -1 ? texte : '';
}

/**
 * Onglet Joueurs avec ses colonnes Classement (en texte, sinon « 15/4 » devient une date),
 * Classement vérifié le et Licence, créées à la 1re utilisation.
 */
function colonnesClassement_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_JOUEURS);
  if (sheet.getRange(1, 6).getValue() !== ENTETES_JOUEURS[5]) {
    sheet.getRange(1, 3, 1, 4).setValues([ENTETES_JOUEURS.slice(2)]).setFontWeight('bold');
    sheet.getRange('D:D').setNumberFormat('@');
    sheet.getRange('E:E').setNumberFormat('dd/mm/yyyy');
    sheet.getRange('F:F').setNumberFormat('@');
    ajouterListe_(sheet, 'D2:D', CLASSEMENTS);
  }
  return sheet;
}

/**
 * Import de la liste des licenciés (export FFT lu dans la page : seuls nom, licence et
 * classement arrivent ici). joueurs = [{ nom, ancien, licence, classement }] :
 * « ancien » = nom actuel dans la Sheet à renommer (garde ses réponses), sinon le joueur
 * est retrouvé par son nom, ou ajouté. supprimer = noms à retirer de la liste.
 */
function importerJoueurs(jeton, joueurs, supprimer) {
  verifierCapitaine_(jeton);
  if (!Array.isArray(joueurs) || joueurs.length > 300) throw new Error('Liste invalide.');
  var bilan = { ajoutes: [], renommes: [], classements: [], supprimes: [] };
  var verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    var sheet = colonnesClassement_();
    var maintenant = new Date();
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var equipes = GROUPES_INSCRIPTION[0].equipes.join(', ');
    joueurs.forEach(function (j) {
      var nom = nettoyerNom_(j.nom);
      if (nom.length < 2 || nom.length > 40 || !/^[\p{L} .'-]+$/u.test(nom)) throw new Error('Nom invalide : ' + j.nom);
      var classement = CLASSEMENTS.indexOf(String(j.classement || '')) !== -1 ? String(j.classement) : '';
      var licence = String(j.licence || '').toUpperCase().replace(/\s+/g, ' ').trim();
      if (licence && !/^\d{7} ?[A-Z]$/.test(licence)) throw new Error('Licence invalide pour ' + nom + ' : ' + j.licence);
      var lignes = lireLignes_(ONGLET_JOUEURS);
      var noms = lignes.map(function (l) { return String(l[0]).trim(); });
      var i = j.ancien ? noms.indexOf(j.ancien) : -1;
      if (j.ancien && i === -1) throw new Error('Joueur introuvable : ' + j.ancien + '. Rechargez la page.');
      if (i === -1) i = noms.map(cleNom_).indexOf(cleNom_(nom));
      if (i === -1) {
        sheet.appendRow([nom, equipes, maintenant, classement, classement ? maintenant : '', licence]);
        bilan.ajoutes.push(nom);
        return;
      }
      if (noms[i] !== nom) {
        renommerSansVerrou_(noms[i], nom);
        bilan.renommes.push({ avant: noms[i], apres: nom });
      }
      var avant = lireClassement_(lignes[i][3], tz);
      if (avant !== classement) bilan.classements.push({ nom: nom, avant: avant, apres: classement });
      sheet.getRange(i + 2, 4, 1, 3).setValues([[classement, classement ? maintenant : '', licence]]);
    });
    (Array.isArray(supprimer) ? supprimer : []).forEach(function (nom) {
      supprimerSansVerrou_(String(nom));
      bilan.supprimes.push(String(nom));
    });
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return bilan;
}

/**
 * Classement d'un joueur, saisi par un capitaine ('' pour l'effacer).
 * Remet aussi la date de vérification à aujourd'hui (même classement = « toujours bon »).
 */
function definirClassement(jeton, nom, classement) {
  verifierCapitaine_(jeton);
  classement = String(classement || '');
  if (classement && CLASSEMENTS.indexOf(classement) === -1) throw new Error('Classement inconnu : ' + classement);
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var sheet = colonnesClassement_();
    var noms = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); });
    var i = noms.indexOf(nom);
    if (i === -1) throw new Error('Joueur introuvable. Rechargez la page.');
    var maintenant = new Date();
    sheet.getRange(i + 2, 4).setNumberFormat('@');
    sheet.getRange(i + 2, 4, 1, 2).setValues([[classement, classement ? maintenant : '']]);
    SpreadsheetApp.flush();
    return { classement: classement, classementLe: classement ? Utilities.formatDate(maintenant, 'Europe/Paris', 'yyyy-MM-dd') : '' };
  } finally {
    verrou.releaseLock();
  }
}

/** Équipes d'une ligne de l'onglet Joueurs (colonne Équipe(s)). */
function equipesDe_(ligne) {
  return String(ligne[1]).split(',').map(function (e) { return e.trim(); }).filter(String);
}

/**
 * Figer un joueur dans une équipe (il ne peut plus donner de dispo pour l'autre),
 * ou '' pour le rendre libre (toutes les équipes). Écrit dans la colonne Équipe(s).
 */
function definirFige(jeton, nom, equipe) {
  verifierCapitaine_(jeton);
  equipe = String(equipe || '');
  if (equipe && EQUIPES.indexOf(equipe) === -1) throw new Error('Équipe inconnue : ' + equipe);
  var equipes = equipe ? [equipe] : EQUIPES.slice();
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var i = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); }).indexOf(nom);
    if (i === -1) throw new Error('Joueur introuvable. Rechargez la page.');
    SpreadsheetApp.getActive().getSheetByName(ONGLET_JOUEURS).getRange(i + 2, 2).setValue(equipes.join(', '));
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return { equipes: equipes };
}

/** 'N°1' … 'N°<NB_POSITIONS>' ou 'Remplaçant'. */
function roleValide_(role) {
  var m = /^N°(\d)$/.exec(role);
  return role === 'Remplaçant' || (m && +m[1] >= 1 && +m[1] <= NB_POSITIONS);
}

/**
 * Retenir un joueur pour une rencontre : role 'N°1'…'N°4', 'Remplaçant' ou '' pour le retirer.
 * Une position n'appartient qu'à un joueur : la donner à un autre la retire au précédent.
 */
function definirSelection(jeton, idRencontre, nom, role) {
  verifierCapitaine_(jeton);
  if (role && !roleValide_(role)) throw new Error('Position inconnue.');
  if (!ligneRencontre_(idRencontre)) throw new Error('Rencontre introuvable. Rechargez la page.');
  var noms = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); });
  if (noms.indexOf(nom) === -1) throw new Error('Joueur inconnu : ' + nom);

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var sheet = ongletSelection_();
    var lignes = lireLignes_(ONGLET_SELECTION);
    var index = -1;
    for (var i = 0; i < lignes.length; i++) {
      if (String(lignes[i][0]) === idRencontre && String(lignes[i][1]) === nom) { index = i; break; }
    }
    if (!role) {
      if (index !== -1) sheet.deleteRow(index + 2);
    } else if (index !== -1) {
      sheet.getRange(index + 2, 3, 1, 2).setValues([[role, new Date()]]);
    } else {
      sheet.appendRow([idRencontre, nom, role, new Date()]);
    }
    if (role && role !== 'Remplaçant') {
      supprimerLignesSelection_(function (l) {
        return String(l[0]) === idRencontre && String(l[1]) !== nom && String(l[2]) === role;
      });
    }
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return lireSelection_();
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
  var terrains = String(r.terrains || '');
  if (terrains && TERRAINS.indexOf(terrains) === -1) throw new Error('Nombre de terrains invalide.');
  if (STATUTS.indexOf(r.statut) === -1) throw new Error('Statut inconnu.');
  var valeurs = [
    new Date(+m[1], +m[2] - 1, +m[3]),
    formaterHeure_(r.heure || ''),
    r.equipe,
    String(r.adversaire || '').trim(),
    r.lieu || '',
    r.statut,
    String(r.infos || '').trim(),
    terrains,
  ];

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_RENCONTRES);
    // Colonne Terrains ajoutée après coup : en-tête posé au premier enregistrement.
    if (!sheet.getRange(1, 9).getValue()) sheet.getRange(1, 9).setValue('Terrains').setFontWeight('bold');
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

    supprimerLignesSelection_(function (l) { return String(l[0]) === id; });
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
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    return { nom: renommerSansVerrou_(ancien, nouveauSaisi) };
  } finally {
    verrou.releaseLock();
  }
}

/** Renomme un joueur partout (Joueurs, Réponses, Sélection). À appeler sous verrou. */
function renommerSansVerrou_(ancien, nouveauSaisi) {
  var nouveau = nettoyerNom_(nouveauSaisi);
  if (nouveau.length < 2 || nouveau.length > 40 || !/^[\p{L} .'-]+$/u.test(nouveau)) throw new Error('Nom invalide : ' + nouveauSaisi);
  var ss = SpreadsheetApp.getActive();
  var noms = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); });
  var i = noms.indexOf(ancien);
  if (i === -1) throw new Error('Joueur introuvable : ' + ancien + '. Rechargez la page.');
  var doublon = noms.filter(function (n, j) { return j !== i && cleNom_(n) === cleNom_(nouveau); })[0];
  if (doublon) throw new Error('« ' + doublon + ' » existe déjà : supprime plutôt le doublon.');
  ss.getSheetByName(ONGLET_JOUEURS).getRange(i + 2, 1).setValue(nouveau);
  if (ss.getSheetByName(ONGLET_SELECTION)) {
    var selection = ss.getSheetByName(ONGLET_SELECTION);
    lireLignes_(ONGLET_SELECTION).forEach(function (l, j) {
      if (String(l[1]).trim() === ancien) selection.getRange(j + 2, 2).setValue(nouveau);
    });
  }
  var reponses = ss.getSheetByName(ONGLET_REPONSES);
  lireLignes_(ONGLET_REPONSES).forEach(function (l, j) {
    if (String(l[1]).trim() === ancien) reponses.getRange(j + 2, 2).setValue(nouveau);
  });
  SpreadsheetApp.flush();
  return nouveau;
}

/** Supprime un joueur et ses réponses. */
function supprimerJoueur(jeton, nom) {
  verifierCapitaine_(jeton);
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    supprimerSansVerrou_(nom);
  } finally {
    verrou.releaseLock();
  }
  return { nom: nom };
}

/** Supprime un joueur, ses réponses et sa sélection. À appeler sous verrou. */
function supprimerSansVerrou_(nom) {
  var ss = SpreadsheetApp.getActive();
  var i = lireLignes_(ONGLET_JOUEURS).map(function (l) { return String(l[0]).trim(); }).indexOf(nom);
  if (i === -1) throw new Error('Joueur introuvable : ' + nom + '. Rechargez la page.');
  ss.getSheetByName(ONGLET_JOUEURS).deleteRow(i + 2);
  supprimerLignesSelection_(function (l) { return String(l[1]).trim() === nom; });
  var reponses = ss.getSheetByName(ONGLET_REPONSES);
  lireLignes_(ONGLET_REPONSES)
    .map(function (l, j) { return String(l[1]).trim() === nom ? j + 2 : 0; })
    .filter(Boolean).reverse()
    .forEach(function (n) { reponses.deleteRow(n); });
  SpreadsheetApp.flush();
}

function supprimerLignesSelection_(condition) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(ONGLET_SELECTION);
  if (!sheet) return;
  lireLignes_(ONGLET_SELECTION)
    .map(function (l, i) { return condition(l) ? i + 2 : 0; })
    .filter(Boolean).reverse()
    .forEach(function (n) { sheet.deleteRow(n); });
}

function ligneRencontre_(id) {
  var ids = lireLignes_(ONGLET_RENCONTRES).map(function (l) { return String(l[0]); });
  var i = ids.indexOf(String(id));
  return i === -1 ? 0 : i + 2;
}

// ---------------------------------------------------------------------------
// Résultats des rencontres
// ---------------------------------------------------------------------------

/** Onglet Résultats, créé au premier besoin. */
function ongletResultats_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(ONGLET_RESULTATS);
  if (!sheet) {
    sheet = ss.insertSheet(ONGLET_RESULTATS);
    preparerEntetes_(sheet, ENTETES_RESULTATS);
    sheet.getRange('B:B').setNumberFormat('dd/mm/yyyy');
    // Texte : sinon la Sheet transforme « 30/1 » ou « 6-3 » en date.
    sheet.getRange('H:H').setNumberFormat('@');
    sheet.getRange('J:K').setNumberFormat('@');
    sheet.getRange('M:M').setNumberFormat('dd/mm/yyyy hh:mm');
  }
  return sheet;
}

/** Texte d'une cellule « a / b » → ['a', 'b']. */
function listeDe_(valeur) {
  return String(valeur == null ? '' : valeur).split('/').map(function (x) { return x.trim(); }).filter(String);
}

/**
 * Résultats saisis, la rencontre la plus récente en premier :
 * [{ id, date, equipe, adversaire, lieu, parties: [{ partie, nous, cltNous, eux, cltEux, score, resultat }] }]
 */
function lireResultats_() {
  var ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(ONGLET_RESULTATS)) return [];
  var tz = ss.getSpreadsheetTimeZone();
  var parId = {}, liste = [];
  lireLignes_(ONGLET_RESULTATS).forEach(function (l) {
    var id = String(l[0]).trim();
    if (!id) return;
    if (!parId[id]) {
      parId[id] = {
        id: id,
        date: l[1] instanceof Date ? Utilities.formatDate(l[1], tz, 'yyyy-MM-dd') : String(l[1]).trim(),
        equipe: String(l[2]).trim(),
        adversaire: String(l[3]).trim(),
        lieu: String(l[4]).trim(),
        parties: [],
      };
      liste.push(parId[id]);
    }
    // Classement : une seule valeur par joueur, le « / » de « 30/1 » ne sépare pas.
    var nous = listeDe_(l[6]), eux = listeDe_(l[8]);
    parId[id].parties.push({
      partie: String(l[5]).trim(),
      nous: nous,
      cltNous: classementsDe_(l[7], nous.length),
      eux: eux,
      cltEux: classementsDe_(l[9], eux.length),
      score: String(l[10]).trim(),
      resultat: RESULTATS.indexOf(String(l[11]).trim()) !== -1 ? String(l[11]).trim() : '',
    });
  });
  liste.forEach(function (r) {
    r.parties.sort(function (a, b) { return rangPartie_(a.partie) - rangPartie_(b.partie); });
  });
  return liste.sort(function (a, b) { return b.date.localeCompare(a.date) || a.equipe.localeCompare(b.equipe); });
}

function rangPartie_(partie) {
  var i = PARTIES.indexOf(partie);
  return i === -1 ? PARTIES.length : i;
}

/** « 30/1 » (1 joueur) ou « 13 ; 18 » (double) → liste de classements. */
function classementsDe_(valeur, nb) {
  var texte = String(valeur == null ? '' : valeur).trim();
  if (nb <= 1) return [texte];
  return texte.split(';').map(function (x) { return x.trim(); });
}

/**
 * Enregistre (remplace) le résultat d'une rencontre. parties : [{ partie, nous: [noms],
 * cltNous: [..], eux: [noms], cltEux: [..], score, resultat }]. Liste vide = effacer le résultat.
 */
function enregistrerResultat(jeton, idRencontre, parties) {
  verifierCapitaine_(jeton);
  var ligne = lireLignes_(ONGLET_RENCONTRES).filter(function (l) { return String(l[0]) === String(idRencontre); })[0];
  if (!ligne) throw new Error('Rencontre introuvable. Rechargez la page.');
  var texte = function (x, max) { return String(x == null ? '' : x).trim().slice(0, max); };
  var noms = function (x) { return [].concat(x || []).map(function (n) { return texte(n, 60).replace(/\//g, '-'); }).filter(String).slice(0, 2); };
  var vues = {};
  var lignes = [].concat(parties || []).map(function (p) {
    if (PARTIES.indexOf(p.partie) === -1) throw new Error('Partie inconnue : ' + p.partie);
    if (vues[p.partie]) throw new Error(p.partie + ' en double.');
    vues[p.partie] = true;
    var resultat = String(p.resultat || '');
    if (resultat && RESULTATS.indexOf(resultat) === -1) throw new Error('Résultat inconnu : ' + resultat);
    var nous = noms(p.nous), eux = noms(p.eux);
    var clt = function (liste, nb) { return [].concat(liste || []).slice(0, nb).map(function (c) { return texte(c, 10).replace(/;/g, ''); }).join(' ; '); };
    return [String(idRencontre), ligne[1], String(ligne[3]).trim(), String(ligne[4]).trim(), String(ligne[5]).trim(), p.partie,
      nous.join(' / '), clt(p.cltNous, Math.max(nous.length, 1)), eux.join(' / '), clt(p.cltEux, Math.max(eux.length, 1)),
      texte(p.score, 40), resultat, new Date()];
  });

  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var sheet = ongletResultats_();
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var cleRencontre = cleResultat_([idRencontre, ligne[1], ligne[3]], tz);
    // Remplace aussi un résultat de la même date et de la même équipe enregistré sous un autre ID.
    lireLignes_(ONGLET_RESULTATS)
      .map(function (l, i) { return String(l[0]) === String(idRencontre) || cleResultat_(l, tz) === cleRencontre ? i + 2 : 0; })
      .filter(Boolean).reverse()
      .forEach(function (n) { sheet.deleteRow(n); });
    if (lignes.length) sheet.getRange(sheet.getLastRow() + 1, 1, lignes.length, ENTETES_RESULTATS.length).setValues(lignes);
    SpreadsheetApp.flush();
  } finally {
    verrou.releaseLock();
  }
  return lireResultats_();
}

// Résultat déjà joué au moment de la mise en ligne de l'écran Résultats (feuille de match Ten'Up).
var RESULTATS_INITIAUX = [
  {
    date: '2026-10-18', equipe: 'Hommes 1', adversaire: 'TC Les Achards 2', lieu: 'Extérieur',
    parties: [
      ['Simple 1', 'Anthony P', '30/1', 'Grégory Supiot', '30', '5-7 6-7(4)', 'Perdu'],
      ['Simple 2', 'Julian C', '30/1', 'Nicolas Ferre', '30/2', '6-3 1-6 5-7', 'Perdu'],
      ['Simple 3', 'Julien M', '30/2', 'David Vaillant', '30/2', '6-2 6-7(3) 3-6', 'Perdu'],
      ['Simple 4', 'Alexandre Y', '40', 'Romain Joubert', '30/3', '7-6(5) 0-6 1-6', 'Perdu'],
      ['Double 1', 'Julian C / Alexandre Y', '13 ; 18', 'David Vaillant / Romain Joubert', '14 ; 15', '3-6 3-6', 'Perdu'],
    ],
  },
  {
    date: '2026-10-18', equipe: 'Hommes 2', adversaire: 'St Etienne Palluau 1', lieu: 'Extérieur',
    parties: [
      ['Simple 1', 'Adrien G', '30/3', 'Quentin Le Gouedec', '30/1', '0-6 0-6', 'Perdu'],
      ['Simple 2', 'Adem K', '40', 'Stéphane Arnoult', '30/3', '1-6 4-6', 'Perdu'],
      ['Simple 3', 'Jonathan R', 'NC', 'Alexis Musset', '30/5', '0-6 4-6', 'Perdu'],
      ['Simple 4', 'Sofiane M', 'NC', 'Olivier Beaudeau', '40', '4-6 0-6', 'Perdu'],
      ['Double 1', 'Jonathan R / Sofiane M', '19 ; 19', 'Quentin Le Gouedec / Stéphane Arnoult', '13 ; 15', '5-7 5-7', 'Perdu'],
    ],
  },
];

/** « 2026-10-18|Hommes 1 » pour une ligne de l'onglet Résultats. */
function cleResultat_(l, tz) {
  return (l[1] instanceof Date ? Utilities.formatDate(l[1], tz, 'yyyy-MM-dd') : String(l[1]).trim()) + '|' + String(l[2]).trim();
}

/**
 * Supprime les résultats en double (même date, même équipe, ID différent) : garde le premier saisi.
 * Corrige le doublon créé par l'import des résultats initiaux. Ne s'exécute qu'une fois.
 */
function dedoublonnerResultatsUneFois_() {
  var props = PropertiesService.getScriptProperties();
  var CLE = 'resultats_dedoublonnes_2026_10';
  if (props.getProperty(CLE) || !SpreadsheetApp.getActive().getSheetByName(ONGLET_RESULTATS)) return;
  var verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    if (props.getProperty(CLE)) return;
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    var sheet = ongletResultats_();
    var premierId = {};
    lireLignes_(ONGLET_RESULTATS)
      .map(function (l, i) {
        var cle = cleResultat_(l, tz), id = String(l[0]);
        if (!(cle in premierId)) premierId[cle] = id;
        return premierId[cle] !== id ? i + 2 : 0;
      })
      .filter(Boolean).reverse()
      .forEach(function (n) { sheet.deleteRow(n); });
    SpreadsheetApp.flush();
    props.setProperty(CLE, new Date().toISOString());
  } finally {
    verrou.releaseLock();
  }
}

/** Ajoute une fois chaque résultat de RESULTATS_INITIAUX (sauf si la rencontre a déjà un résultat). */
function importerResultatsUneFois_() {
  var props = PropertiesService.getScriptProperties();
  var cle = function (r) { return 'resultat_initial_' + r.date + '_' + r.equipe; };
  var aFaire = function () { return RESULTATS_INITIAUX.filter(function (r) { return !props.getProperty(cle(r)); }); };
  if (!aFaire().length) return;
  var verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    var restants = aFaire();
    if (!restants.length) return;
    var ss = SpreadsheetApp.getActive();
    var tz = ss.getSpreadsheetTimeZone();
    var sheet = ongletResultats_();
    // Déjà saisi = même date et même équipe (l'ID peut différer si la rencontre n'est pas dans l'onglet Rencontres).
    var dejaSaisis = {};
    lireLignes_(ONGLET_RESULTATS).forEach(function (l) { dejaSaisis[cleResultat_(l, tz)] = true; });
    var rencontres = lireLignes_(ONGLET_RENCONTRES);
    restants.forEach(function (r) {
      var trouvee = rencontres.filter(function (l) {
        return l[1] instanceof Date && Utilities.formatDate(l[1], tz, 'yyyy-MM-dd') === r.date && String(l[3]).trim() === r.equipe;
      })[0];
      var id = trouvee && String(trouvee[0]).trim() ? String(trouvee[0]).trim() : nouvelId_();
      if (dejaSaisis[r.date + '|' + r.equipe]) return;
      var p = r.date.split('-'), date = new Date(+p[0], +p[1] - 1, +p[2]);
      var lignes = r.parties.map(function (x) {
        return [id, date, r.equipe, r.adversaire, r.lieu].concat(x).concat([new Date()]);
      });
      sheet.getRange(sheet.getLastRow() + 1, 1, lignes.length, ENTETES_RESULTATS.length).setValues(lignes);
    });
    SpreadsheetApp.flush();
    restants.forEach(function (r) { props.setProperty(cle(r), new Date().toISOString()); });
  } finally {
    verrou.releaseLock();
  }
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
 * Porte d'entrée pour la page hébergée hors de Google (GitHub Pages) :
 * corps JSON { fn, args }, réponse JSON { ok, result } ou { ok: false, error }.
 * Seules les fonctions listées ici sont appelables.
 */
function doPost(e) {
  var fonctions = {
    getDonnees: getDonnees,
    repondre: repondre,
    inscrire: inscrire,
    demanderLienCapitaine: demanderLienCapitaine,
    infoCapitaine: infoCapitaine,
    deconnecterCapitaine: deconnecterCapitaine,
    getDonneesCapitaines: getDonneesCapitaines,
    enregistrerRencontre: enregistrerRencontre,
    supprimerRencontre: supprimerRencontre,
    renommerJoueur: renommerJoueur,
    supprimerJoueur: supprimerJoueur,
    validerCodeCapitaine: validerCodeCapitaine,
    definirCodePerso: definirCodePerso,
    definirClassement: definirClassement,
    importerJoueurs: importerJoueurs,
    definirFige: definirFige,
    connexionCodePerso: connexionCodePerso,
    definirSelection: definirSelection,
    enregistrerResultat: enregistrerResultat,
  };
  var sortie;
  try {
    var demande = JSON.parse(e.postData.contents);
    var fonction = Object.prototype.hasOwnProperty.call(fonctions, demande.fn) ? fonctions[demande.fn] : null;
    if (!fonction) throw new Error('Fonction inconnue.');
    var resultat = fonction.apply(null, Array.isArray(demande.args) ? demande.args : []);
    sortie = { ok: true, result: resultat === undefined ? null : resultat };
  } catch (err) {
    sortie = { ok: false, error: err && err.message ? err.message : String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(sortie)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Données envoyées à la page : joueurs, rencontres à venir (à partir d'hier)
 * et réponses déjà données.
 */
function getDonnees() {
  importerCalendrierUneFois_();
  nettoyerJoueursUneFois_();
  dedoublonnerResultatsUneFois_();
  importerResultatsUneFois_();
  var ss = SpreadsheetApp.getActive();
  var tz = ss.getSpreadsheetTimeZone();

  var joueurs = lireLignes_(ONGLET_JOUEURS)
    .filter(function (l) { return String(l[0]).trim(); })
    .map(function (l) {
      return {
        nom: String(l[0]).trim(),
        equipes: String(l[1]).split(',').map(function (e) { return e.trim(); }).filter(String),
        classement: lireClassement_(l[3], tz),
        classementLe: l[4] instanceof Date ? Utilities.formatDate(l[4], tz, 'yyyy-MM-dd') : '',
      };
    })
    .sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });

  var rencontres = lireRencontres_();

  return {
    equipes: EQUIPES,
    groupes: GROUPES_INSCRIPTION.map(function (g) { return g.libelle; }),
    nbTerrains: NB_TERRAINS,
    nbPositions: NB_POSITIONS,
    classements: CLASSEMENTS,
    maxDomicileParJour: MAX_DOMICILE_PAR_JOUR,
    joueurs: joueurs,
    rencontres: rencontres,
    reponses: lireReponses_(),
    selection: lireSelection_(),
    parties: PARTIES,
    // Toute la saison (matchs passés compris) : saisie des résultats par les capitaines.
    calendrier: lireRencontres_(true),
    resultats: lireResultats_(),
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

  var ligneJoueur = lireLignes_(ONGLET_JOUEURS).filter(function (l) { return String(l[0]).trim() === nom; })[0];
  if (!ligneJoueur) throw new Error('Joueur inconnu : ' + nom);
  var sesEquipes = equipesDe_(ligneJoueur);

  var rencontres = lireLignes_(ONGLET_RENCONTRES);
  var idsConnus = rencontres.map(function (l) { return String(l[0]); });
  ids.forEach(function (id) {
    var i = idsConnus.indexOf(id);
    if (i === -1) throw new Error('Rencontre introuvable. Rechargez la page.');
    // Joueur figé dans une équipe : pas de dispo pour les matchs de l'autre (annuler reste possible).
    var equipe = String(rencontres[i][3]).trim();
    if (reponse && sesEquipes.length && sesEquipes.indexOf(equipe) === -1) {
      throw new Error(nom + ' est figé en ' + sesEquipes.join(', ') + ' : pas de dispo possible pour un match de ' + equipe + '.');
    }
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

/** Rencontres à venir (à partir d'hier), ou toutes avec toutes = true, triées par date, heure et équipe. */
function lireRencontres_(toutes) {
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
        terrains: TERRAINS.indexOf(String(l[8] == null ? '' : l[8]).trim()) !== -1 ? String(l[8]).trim() : '',
      };
    })
    .filter(function (r) { return (toutes || r.date >= depuis) && EQUIPES.indexOf(r.equipe) !== -1; })
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
/** Onglet Sélection, créé au premier besoin. */
function ongletSelection_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(ONGLET_SELECTION);
  if (!sheet) {
    sheet = ss.insertSheet(ONGLET_SELECTION);
    preparerEntetes_(sheet, ENTETES_SELECTION);
    sheet.getRange('D:D').setNumberFormat('dd/mm/yyyy hh:mm');
  }
  return sheet;
}

/** { idRencontre: { nom: 'N°1' … | 'Remplaçant' } } */
function lireSelection_() {
  var selection = {};
  if (!SpreadsheetApp.getActive().getSheetByName(ONGLET_SELECTION)) return selection;
  lireLignes_(ONGLET_SELECTION).forEach(function (l) {
    var id = String(l[0]);
    if (!id) return;
    selection[id] = selection[id] || {};
    selection[id][String(l[1])] = String(l[2]);
  });
  return selection;
}

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
