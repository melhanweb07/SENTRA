import { PublicPage } from "@/components/PublicChrome";

export default function Privacy() {
  return (
    <PublicPage
      title="Privacy-first design"
      subtitle="The solution's mitigation requirements — data minimisation, consent, role-based access and auditability — are built into the prototype."
    >
      <h2>Data minimisation</h2>
      <ul>
        <li>Names are optional; complainants can remain anonymous (demo identifier only).</li>
        <li>Locations are generalised (city / zone), never precise coordinates, unless strictly necessary.</li>
        <li>Only age <em>ranges</em> are collected.</li>
        <li>No biometric data is stored; voice is analysed in-session and only the derived transcript and features are kept for the case record.</li>
      </ul>

      <h2>Explicit consent</h2>
      <p>
        Analysis cannot begin until the complainant has been informed and has consented:
        &ldquo;I understand that this interaction may be analyzed to support case prioritization and human
        assistance.&rdquo; Consent is recorded in the audit log.
      </p>

      <h2>Role-based access</h2>
      <ul>
        <li><strong>Counsellors</strong> create cases, conduct assessments, verify recommendations, refer and schedule follow-ups.</li>
        <li><strong>Support officers</strong> handle assigned cases, referrals and follow-ups.</li>
        <li><strong>Admins</strong> view analytics, audit logs and system activity.</li>
      </ul>

      <h2>Auditability</h2>
      <p>
        Every consequential action — login, consent, segment analysis, safety alert, verification,
        referral, follow-up, escalation — is appended to a tamper-evident audit trail with actor,
        timestamp and details.
      </p>

      <h2>Boundaries of the system</h2>
      <p>
        FLOWMINDS&rsquo;26 is decision support. It does not diagnose mental-health conditions, does not
        contact police or emergency services autonomously, and never acts without human verification.
        This prototype stores demo data locally in your browser only.
      </p>
    </PublicPage>
  );
}
