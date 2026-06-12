// lib/onboarding-emails.ts — die 6 Onboarding-E-Mails als HTML-Vorlagen.
// Jede Funktion bekommt die Onboarding-Daten und liefert Betreff + HTML.
// Bewusst e-mail-sicher (Tabellen-Layout, Inline-CSS, max. 600px).

export type OnboardingEmailData = {
  kundeName: string; // Ansprechpartner oder Firma
  firma: string;
  projekt: string;
  absender: string; // Absender-Name
  firmaName: string; // eigene Firma
  portalUrl?: string;
};

const ACCENT = "#b8893a"; // HK-Gold
const HEADER = "#1c1c1c";

function layout(opts: {
  step: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
  d: OnboardingEmailData;
}): string {
  const { d } = opts;
  const cta = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 24px 0;"><tr><td style="border-radius:8px;background:${ACCENT};"><a href="${opts.cta.href}" style="display:inline-block;padding:13px 30px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">${opts.cta.label}</a></td></tr></table>`
    : "";
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f2f3f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3f5;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
<tr><td style="background:${HEADER};padding:26px 32px;">
<span style="color:#fff;font-size:18px;font-weight:700;">${d.firmaName}</span>
<span style="color:#9a9a9a;font-size:12px;float:right;padding-top:5px;">${opts.step}</span>
</td></tr>
<tr><td style="padding:34px 32px 8px 32px;">
<p style="margin:0 0 4px 0;color:${ACCENT};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${opts.eyebrow}</p>
<h1 style="margin:0 0 16px 0;color:#1c1c1c;font-size:23px;line-height:1.3;">${opts.title}</h1>
${opts.bodyHtml}
${cta}
</td></tr>
<tr><td style="padding:18px 32px 28px 32px;border-top:1px solid #ececef;">
<p style="margin:0;color:#3c3f45;font-size:14px;line-height:1.5;">${d.absender}<br><span style="color:#8b8d94;">${d.firmaName}</span></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (t: string) => `<p style="margin:0 0 16px 0;color:#3c3f45;font-size:15px;line-height:1.6;">${t}</p>`;

export type OnboardingEmail = { subject: string; html: string };
export type EmailBuilder = (d: OnboardingEmailData) => OnboardingEmail;

export const ONBOARDING_EMAILS: Record<string, EmailBuilder> = {
  vereinbarung: (d) => ({
    subject: `Ihre Vereinbarung zur Unterschrift – ${d.projekt}`,
    html: layout({
      step: "SCHRITT 1 VON 6 · VEREINBARUNG",
      eyebrow: "Bevor wir starten",
      title: "Ihre Vereinbarung zur Unterschrift",
      d,
      bodyHtml:
        p(`Hallo ${d.kundeName},`) +
        p(`wir freuen uns auf die Zusammenarbeit an <strong>${d.projekt}</strong>. Bevor es losgeht, klären wir die Rahmenbedingungen schriftlich – Leistungsumfang, Zeitplan und Revisionen. Das schützt uns beide und sorgt für einen sauberen Start.`),
    }),
  }),
  rechnung: (d) => ({
    subject: `Rechnung & Zahlung – ${d.projekt}`,
    html: layout({
      step: "SCHRITT 2 VON 6 · ZAHLUNG",
      eyebrow: "Vereinbarung erhalten",
      title: "Rechnung & Zahlung",
      d,
      bodyHtml:
        p(`Hallo ${d.kundeName},`) +
        p(`danke für die Unterschrift! Anbei die Rechnung zu <strong>${d.projekt}</strong>. Wählen Sie einfach die Zahlungsart, die Ihnen am liebsten ist – per Überweisung oder Zahlungslink.`),
    }),
  }),
  willkommen: (d) => ({
    subject: `Willkommen an Bord – so geht es weiter`,
    html: layout({
      step: "SCHRITT 3 VON 6 · WILLKOMMEN",
      eyebrow: "Zahlung erhalten",
      title: `Willkommen an Bord, ${d.kundeName}!`,
      d,
      bodyHtml:
        p(`Alles ist bereit – wir starten jetzt mit <strong>${d.projekt}</strong>. Sie bekommen Zugang zu Ihrem Projekt-Portal, wir stimmen den Kickoff ab, und Sie sehen jeden Fortschritt live.`),
      cta: d.portalUrl ? { href: d.portalUrl, label: "Zum Projekt-Portal →" } : undefined,
    }),
  }),
  portal: (d) => ({
    subject: `Ihr Projekt-Portal ist bereit`,
    html: layout({
      step: "SCHRITT 4 VON 6 · PORTAL",
      eyebrow: "Project HQ",
      title: "Ihr Projekt-Portal ist bereit",
      d,
      bodyHtml:
        p(`Hallo ${d.kundeName},`) +
        p(`Schluss mit verstreuten E-Mails. Alles zu <strong>${d.projekt}</strong> finden Sie ab jetzt an einem Ort: Überblick, Timeline, Deliverables, Dokumente und Updates.`),
      cta: d.portalUrl ? { href: d.portalUrl, label: "Portal öffnen →" } : undefined,
    }),
  }),
  kickoff: (d) => ({
    subject: `Kickoff – ${d.projekt} startet`,
    html: layout({
      step: "SCHRITT 5 VON 6 · KICKOFF",
      eyebrow: "Es geht los",
      title: `Unser Kickoff für ${d.projekt}`,
      d,
      bodyHtml:
        p(`Hallo ${d.kundeName},`) +
        p(`jetzt wird es konkret. Im Kickoff gehen wir gemeinsam Ziele, Ablauf und die wichtigsten Eckpunkte durch – damit alle auf einer Linie sind.`),
    }),
  }),
  update: (d) => ({
    subject: `Erstes Update – Ihr Projekt läuft`,
    html: layout({
      step: "SCHRITT 6 VON 6 · ERSTES UPDATE",
      eyebrow: "Schon in Bewegung",
      title: "Ihr Projekt läuft bereits",
      d,
      bodyHtml:
        p(`Hallo ${d.kundeName},`) +
        p(`kurzes Update zu <strong>${d.projekt}</strong> – damit Sie von Anfang an sehen, dass es vorangeht. Den vollen Fortschritt sehen Sie jederzeit im Portal.`),
      cta: d.portalUrl ? { href: d.portalUrl, label: "Fortschritt ansehen →" } : undefined,
    }),
  }),
};

// Reihenfolge + Anzeigenamen der 6 Schritte.
export const ONBOARDING_STEPS: { key: string; label: string }[] = [
  { key: "vereinbarung", label: "Vereinbarung" },
  { key: "rechnung", label: "Rechnung & Zahlung" },
  { key: "willkommen", label: "Willkommen" },
  { key: "portal", label: "Portal-Zugang" },
  { key: "kickoff", label: "Kickoff" },
  { key: "update", label: "Erstes Update" },
];
