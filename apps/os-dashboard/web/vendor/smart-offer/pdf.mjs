// Minimaler PDF-Generator ohne Dependencies (PDF 1.4, Helvetica, WinAnsi).
// Reicht vollständig für Text-Angebote mit Positionstabelle aus.

const PAGE_W = 595; // A4 in pt
const PAGE_H = 842;

// Unicode → WinAnsi-Sonderzeichen (Rest: Latin-1 direkt, Unbekanntes → '?')
const WINANSI = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x201e, 0x84], [0x2026, 0x85],
  [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93], [0x201d, 0x94],
  [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97]
]);

function winAnsi(str) {
  let out = '';
  for (const ch of String(str)) {
    const code = ch.codePointAt(0);
    if (WINANSI.has(code)) out += String.fromCharCode(WINANSI.get(code));
    else if (code <= 0xff) out += ch;
    else out += '?';
  }
  return out;
}

function escapePdf(str) {
  return winAnsi(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export class PdfBuilder {
  constructor() {
    this.pages = [];
    this.addPage();
  }

  addPage() {
    this.current = [];
    this.pages.push(this.current);
  }

  text(x, y, str, { size = 10, bold = false } = {}) {
    this.current.push(`BT /F${bold ? 2 : 1} ${size} Tf ${x} ${y} Td (${escapePdf(str)}) Tj ET`);
  }

  line(x1, y1, x2, y2, width = 0.5) {
    this.current.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  build() {
    const n = this.pages.length;
    const fontObj1 = 3 + 2 * n;
    const fontObj2 = 4 + 2 * n;
    const objects = [];

    const pageRefs = this.pages.map((_, i) => `${3 + 2 * i} 0 R`).join(' ');
    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${n} >>\nendobj\n`);

    this.pages.forEach((ops, i) => {
      const pageNum = 3 + 2 * i;
      const contentNum = pageNum + 1;
      objects.push(
        `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Contents ${contentNum} 0 R /Resources << /Font << /F1 ${fontObj1} 0 R /F2 ${fontObj2} 0 R >> >> >>\nendobj\n`
      );
      const stream = ops.join('\n');
      objects.push(`${contentNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
    });

    objects.push(`${fontObj1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);
    objects.push(`${fontObj2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);

    let body = '%PDF-1.4\n';
    const offsets = [];
    for (const obj of objects) {
      offsets.push(body.length);
      body += obj;
    }

    const xrefStart = body.length;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      xref += `${String(off).padStart(10, '0')} 00000 n \n`;
    }
    body += xref;
    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return Buffer.from(body, 'latin1');
  }
}

// ------------------------------------------------------------ Angebots-Layout

export function formatEUR(betrag) {
  const wert = Number(betrag) || 0;
  const [ganz, dez] = wert.toFixed(2).split('.');
  const gruppiert = ganz.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${gruppiert},${dez} €`;
}

function wrap(text, maxChars) {
  const zeilen = [];
  for (const absatz of String(text).split('\n')) {
    if (!absatz.trim()) { zeilen.push(''); continue; }
    let zeile = '';
    for (const wort of absatz.split(/\s+/)) {
      if ((zeile + ' ' + wort).trim().length > maxChars) {
        if (zeile) zeilen.push(zeile);
        zeile = wort;
      } else {
        zeile = (zeile ? zeile + ' ' : '') + wort;
      }
    }
    if (zeile) zeilen.push(zeile);
  }
  return zeilen;
}

export function renderOfferPdf(offer, settings) {
  const pdf = new PdfBuilder();
  const left = 50;
  const right = PAGE_W - 50;
  let y = PAGE_H - 60;

  const ensureSpace = (needed) => {
    if (y - needed < 60) {
      pdf.addPage();
      y = PAGE_H - 60;
    }
  };

  const paragraph = (text, { size = 10, bold = false, lineHeight = 14, maxChars = 95 } = {}) => {
    for (const zeile of wrap(text, maxChars)) {
      ensureSpace(lineHeight);
      if (zeile) pdf.text(left, y, zeile, { size, bold });
      y -= lineHeight;
    }
  };

  // Kopf
  pdf.text(left, y, settings.firma, { size: 16, bold: true });
  pdf.text(right - 180, y, `Angebot ${offer.nummer}`, { size: 11, bold: true });
  y -= 16;
  const kontakt = [settings.email, settings.telefon].filter(Boolean).join('  ·  ');
  if (kontakt) pdf.text(left, y, kontakt, { size: 9 });
  pdf.text(right - 180, y, `Datum: ${new Date(offer.erstelltAm).toLocaleDateString('de-DE')}`, { size: 9 });
  y -= 10;
  pdf.line(left, y, right, y);
  y -= 28;

  // Kunde
  pdf.text(left, y, 'Angebot für:', { size: 9 });
  y -= 14;
  for (const zeile of [offer.kunde.firma, offer.kunde.ansprechpartner, offer.kunde.email].filter(Boolean)) {
    pdf.text(left, y, zeile, { size: 10 });
    y -= 13;
  }
  y -= 16;

  // Titel + Intro
  pdf.text(left, y, offer.extraktion.leistung || 'Angebot', { size: 13, bold: true });
  y -= 22;
  paragraph(offer.texte.intro);
  y -= 8;

  if (offer.extraktion.zusammenfassung) {
    paragraph('Ihre Anforderungen:', { bold: true });
    paragraph(offer.extraktion.zusammenfassung);
    y -= 8;
  }

  // Positionstabelle
  ensureSpace(60);
  pdf.text(left, y, 'Pos.', { size: 9, bold: true });
  pdf.text(left + 35, y, 'Beschreibung', { size: 9, bold: true });
  pdf.text(left + 320, y, 'Menge', { size: 9, bold: true });
  pdf.text(left + 390, y, 'Einzelpreis', { size: 9, bold: true });
  pdf.text(left + 470, y, 'Gesamt', { size: 9, bold: true });
  y -= 6;
  pdf.line(left, y, right, y);
  y -= 16;

  let summe = 0;
  offer.positionen.forEach((pos, i) => {
    ensureSpace(20);
    const gesamt = (Number(pos.menge) || 0) * (Number(pos.einzelpreis) || 0);
    summe += gesamt;
    pdf.text(left, y, String(i + 1), { size: 10 });
    const beschreibungZeilen = wrap(pos.beschreibung, 55);
    pdf.text(left + 35, y, beschreibungZeilen[0] || '', { size: 10 });
    pdf.text(left + 320, y, String(pos.menge), { size: 10 });
    pdf.text(left + 390, y, formatEUR(pos.einzelpreis), { size: 10 });
    pdf.text(left + 470, y, formatEUR(gesamt), { size: 10 });
    y -= 14;
    for (const extra of beschreibungZeilen.slice(1)) {
      ensureSpace(14);
      pdf.text(left + 35, y, extra, { size: 10 });
      y -= 14;
    }
  });

  y -= 2;
  pdf.line(left, y, right, y);
  y -= 18;
  ensureSpace(20);
  pdf.text(left + 320, y, 'Gesamtsumme (netto):', { size: 11, bold: true });
  pdf.text(left + 470, y, formatEUR(summe), { size: 11, bold: true });
  y -= 14;
  pdf.text(left + 320, y, settings.ustHinweis, { size: 8 });
  y -= 30;

  // Konditionen
  const konditionen = [
    ['Zahlungsbedingungen', offer.texte.zahlungsbedingungen],
    ['Umsetzung', offer.texte.lieferzeit],
    ['Gültigkeit', offer.texte.gueltigkeit]
  ];
  for (const [titel, text] of konditionen) {
    ensureSpace(34);
    paragraph(titel + ':', { bold: true });
    paragraph(text);
    y -= 6;
  }

  y -= 8;
  paragraph(offer.texte.schluss);
  y -= 20;
  paragraph('Mit freundlichen Grüßen');
  paragraph(settings.inhaber || settings.firma);

  return pdf.build();
}
