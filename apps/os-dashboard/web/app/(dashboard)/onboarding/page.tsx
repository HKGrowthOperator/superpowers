import { listOnboarding } from "@/lib/onboarding";
import { smtpConfigured } from "@/lib/email";
import { OnboardingView } from "@/components/onboarding-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [items, smtp] = [await listOnboarding(), smtpConfigured()];
  return (
    <>
      <p className="text-muted-foreground mb-6 text-sm">
        Jeder gewonnene Kunde durchläuft 6 Schritte – von der Vereinbarung bis zum ersten Update. Gewonnene
        Angebote landen automatisch hier. Pro Schritt kannst du die passende E-Mail direkt verschicken.
      </p>
      {!smtp ? (
        <div className="border-border bg-amber-500/10 mb-6 rounded-lg border px-4 py-3 text-sm">
          ⚠️ <strong>E-Mail-Versand ist noch nicht eingerichtet.</strong> Trage in der Server-<code>.env</code> die
          SMTP-Werte ein (<code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>MAIL_FROM</code>),
          dann werden die E-Mails wirklich versendet. Ohne das kannst du die Schritte trotzdem als erledigt markieren.
        </div>
      ) : null}
      <OnboardingView initial={items} smtpReady={smtp} />
    </>
  );
}
