import { PublicPage } from "@/components/PublicChrome";

export default function HowItWorks() {
  return (
    <PublicPage
      title="How FLOWMINDS'26 works"
      subtitle="From first contact to follow-up — with a human decision at every consequential step."
    >
      <h2>1. Intake & consent</h2>
      <p>
        A complainant reaches the system through the NHAA 14566 helpline, web portal, chatbot, mobile app
        or IVRS. A case is created with a generalised location and explicit consent: analysis is used to
        support prioritisation and human assistance — nothing is processed without it.
      </p>

      <h2>2. Multilingual interaction</h2>
      <p>
        The counsellor selects the complainant&rsquo;s preferred language. Conversations run in text or voice
        mode. In voice mode, speech-to-text produces a live transcript (Whisper ASR in production; a
        clearly labelled simulation in this prototype), and important phrases are highlighted by category —
        threat, fear, safety concern — without ever attaching a psychiatric label to the person.
      </p>

      <h2>3. Real-time analysis</h2>
      <p>
        As each segment arrives, the prototype signal-detection engine updates observable indicators:
        distress, fear, anxiety, trauma-related distress, depression indicators, safety concerns, social
        isolation, medical and legal context. Speech features (tremor, pauses, volume variability) add
        prosodic evidence when voice is used.
      </p>

      <h2>4. Stress Vulnerability Index (SVI)</h2>
      <p>
        Indicators are combined into a transparent weighted SVI from 0 to 100 with four levels:
        Low (0–24), Moderate (25–49), High (50–74), Critical (75–100). Every point of the score is
        traceable to a dimension, and every dimension to matched evidence. The SVI is a
        decision-support indicator — human verification is always required.
      </p>

      <h2>5. Dynamic Distress Mapping</h2>
      <p>
        A live timeline tracks how distress changes across the conversation, with markers for threats,
        safety concerns, emotional escalation and support requests.
      </p>

      <h2>6. Safety alerts & escalation</h2>
      <p>
        When the safety-concern score crosses a configurable threshold, a safety alert is raised for
        immediate human attention. The system never contacts police or emergency services on its own.
      </p>

      <h2>7. Recommendations & human verification</h2>
      <p>
        The recommendation engine proposes support actions — counselling, legal aid, medical assistance,
        police intervention, witness protection, emergency support — each with a reason, evidence and
        strength. A trained reviewer accepts, modifies or rejects the recommendation, with notes.
      </p>

      <h2>8. Referral, follow-up & audit</h2>
      <p>
        Verified recommendations become referrals to service providers, follow-ups are scheduled, and
        every action — logins, segments, alerts, verifications, referrals — is written to an
        append-only audit log.
      </p>
    </PublicPage>
  );
}
