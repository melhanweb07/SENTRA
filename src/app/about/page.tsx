import { PublicPage } from "@/components/PublicChrome";

export default function About() {
  return (
    <PublicPage
      title="About FLOWMINDS'26"
      subtitle="AI-powered decision support for first-contact grievance handling — Smart India Hackathon 2026, SIH26093."
    >
      <h2>The problem</h2>
      <p>
        Grievance redressal helplines and support desks receive complainants in acute distress. Frontline
        staff must quickly understand who needs urgent help, what kind of support is appropriate, and how
        to prioritise limited human resources — often across languages, at scale.
      </p>

      <h2>What FLOWMINDS&rsquo;26 does</h2>
      <p>
        FLOWMINDS&rsquo;26 adds an AI-powered assessment layer to first-contact grievance handling. During a
        conversation it analyses voice, speech and text for observable distress and vulnerability signals,
        computes an explainable Stress Vulnerability Index, recommends support actions, and flags critical
        safety indicators for immediate human attention.
      </p>

      <h2>What it is not</h2>
      <ul>
        <li>It does not diagnose mental-health conditions.</li>
        <li>It does not autonomously make legal, medical or police decisions.</li>
        <li>It does not replace trained counsellors — it supports them.</li>
      </ul>
      <p>
        Every recommendation requires human verification. Every consequential action is taken by trained
        personnel, and every action is auditable.
      </p>

      <h2>Prototype status</h2>
      <p>
        This build is a demonstration prototype. When live AI inference (Whisper ASR, prosodic analysis,
        transformer NLP) is unavailable, a deterministic Demo AI Simulation Layer produces clearly
        structured, explainable results. Simulated outputs are never presented as clinically validated.
      </p>

      <h2>Intended production architecture</h2>
      <ul>
        <li><strong>Frontend:</strong> Next.js / React with WebSockets for streaming analysis.</li>
        <li><strong>AI service:</strong> Python FastAPI with Whisper, Librosa, NumPy/SciPy, Hugging Face Transformers and Scikit-learn/XGBoost.</li>
        <li><strong>SVI engine:</strong> explainable scoring with per-dimension contribution breakdown.</li>
        <li><strong>Backend:</strong> Firebase Authentication, Firestore and Storage — swappable via the modular data layer.</li>
      </ul>
    </PublicPage>
  );
}
