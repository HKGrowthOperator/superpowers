// Standardisierte Textbausteine und Voreinstellungen für Angebote.
// Alles, was sich in Angeboten wiederholt, lebt hier an einer Stelle.

export const DEFAULT_SETTINGS = {
  firma: 'HK Growth Operator',
  inhaber: 'HK Growth Operator',
  email: 'info@hkgrowth-operator.de',
  telefon: '',
  adresse: '',
  ustHinweis: 'Alle Preise zzgl. der gesetzlichen Umsatzsteuer.',
  angebotGueltigTage: 14,
  zahlungsmodellStandard: '50/50',
  followUpErinnerungTage: 3,
  followUpVertriebTage: 7
};

export const TEXTBAUSTEINE = {
  intro: ({ ansprechpartner }) =>
    `Guten Tag${ansprechpartner ? ' ' + ansprechpartner : ''},\n\n` +
    `vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot.`,

  zahlungsbedingungen: ({ zahlungsmodell }) => {
    if (zahlungsmodell === '50/50') {
      return '50 % Anzahlung bei Auftragserteilung, 50 % bei Fertigstellung.';
    }
    if (/anzahlung/i.test(zahlungsmodell || '')) {
      return zahlungsmodell;
    }
    return zahlungsmodell || 'Zahlbar innerhalb von 14 Tagen nach Rechnungsstellung.';
  },

  lieferzeit: ({ lieferzeit }) =>
    lieferzeit
      ? `Die voraussichtliche Umsetzungsdauer beträgt ${lieferzeit} ab Auftragserteilung.`
      : 'Die Umsetzungsdauer stimmen wir gemeinsam nach Auftragserteilung ab.',

  gueltigkeit: ({ tage }) =>
    `Dieses Angebot ist ${tage} Tage ab Ausstellungsdatum gültig.`,

  schluss: () =>
    'Wir freuen uns auf die Zusammenarbeit. Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.',

  followUpErinnerung: ({ ansprechpartner, angebotNummer, leistung }) =>
    `Guten Tag${ansprechpartner ? ' ' + ansprechpartner : ''},\n\n` +
    `vor einigen Tagen haben wir Ihnen unser Angebot ${angebotNummer}` +
    `${leistung ? ' für "' + leistung + '"' : ''} zugesendet.\n\n` +
    `Gibt es von Ihrer Seite noch offene Fragen? Gerne besprechen wir Details auch kurz telefonisch.\n\n` +
    `Viele Grüße`
};

// Erkennbare Leistungen für die Heuristik-Extraktion (Reihenfolge = Priorität).
export const LEISTUNGS_KEYWORDS = [
  ['website relaunch', 'Website Relaunch'],
  ['relaunch', 'Website Relaunch'],
  ['onlineshop', 'Onlineshop'],
  ['online-shop', 'Onlineshop'],
  ['webshop', 'Onlineshop'],
  ['shop', 'Onlineshop'],
  ['landingpage', 'Landingpage'],
  ['landing page', 'Landingpage'],
  ['website', 'Website'],
  ['webseite', 'Website'],
  ['homepage', 'Website'],
  ['logo', 'Logo & Branding'],
  ['branding', 'Logo & Branding'],
  ['seo', 'SEO-Optimierung'],
  ['suchmaschinen', 'SEO-Optimierung'],
  ['automatisierung', 'Prozess-Automatisierung'],
  ['automation', 'Prozess-Automatisierung'],
  ['crm', 'CRM-Einrichtung'],
  ['newsletter', 'Newsletter-Setup'],
  ['app', 'App-Entwicklung'],
  ['wartung', 'Wartung & Betreuung'],
  ['betreuung', 'Wartung & Betreuung']
];

export const STATUS = {
  ENTWURF: 'entwurf',
  GEPRUEFT: 'geprueft',
  VERSENDET: 'versendet',
  GEWONNEN: 'gewonnen',
  VERLOREN: 'verloren'
};

export const STATUS_LABELS = {
  entwurf: 'Entwurf',
  geprueft: 'Geprüft',
  versendet: 'Versendet',
  gewonnen: 'Gewonnen',
  verloren: 'Verloren'
};
