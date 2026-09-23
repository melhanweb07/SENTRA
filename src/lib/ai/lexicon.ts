// FLOWMINDS'26 — multilingual prototype signal lexicon.
// Rule-based keyword/phrase detection for DEMONSTRATION purposes only.
// This is NOT a clinically validated instrument and must not be presented as one.

import { EvidenceCategory, Language } from "../types";

export interface LexEntry {
  phrase: string;
  weight: number; // 1–10 signal strength
  category: EvidenceCategory;
}

export const LEXICON: Record<Language, LexEntry[]> = {
  en: [
    // Safety / threat
    { phrase: "in danger", weight: 10, category: "SAFETY" },
    { phrase: "threatened me", weight: 9, category: "SAFETY" },
    { phrase: "receiving threats", weight: 8, category: "SAFETY" },
    { phrase: "threats", weight: 6, category: "SAFETY" },
    { phrase: "afraid they will hurt me", weight: 10, category: "SAFETY" },
    { phrase: "would hurt me", weight: 9, category: "SAFETY" },
    { phrase: "hurt me", weight: 8, category: "SAFETY" },
    { phrase: "cannot go home", weight: 9, category: "SAFETY" },
    { phrase: "can't go home", weight: 9, category: "SAFETY" },
    { phrase: "don't feel safe", weight: 7, category: "SAFETY" },
    { phrase: "do not feel safe", weight: 7, category: "SAFETY" },
    { phrase: "following me", weight: 8, category: "SAFETY" },
    { phrase: "not safe", weight: 7, category: "SAFETY" },
    // Fear
    { phrase: "terrified", weight: 7, category: "FEAR" },
    { phrase: "scared all the time", weight: 6, category: "FEAR" },
    { phrase: "scared", weight: 5, category: "FEAR" },
    { phrase: "afraid", weight: 5, category: "FEAR" },
    { phrase: "live in fear", weight: 7, category: "FEAR" },
    // Distress
    { phrase: "crying", weight: 5, category: "DISTRESS" },
    { phrase: "stressed", weight: 4, category: "DISTRESS" },
    { phrase: "can't sleep", weight: 5, category: "DISTRESS" },
    { phrase: "cannot sleep", weight: 5, category: "DISTRESS" },
    { phrase: "haven't been able to sleep", weight: 6, category: "DISTRESS" },
    { phrase: "hopeless", weight: 6, category: "DISTRESS" },
    { phrase: "helpless", weight: 5, category: "DISTRESS" },
    { phrase: "breaking down", weight: 5, category: "DISTRESS" },
    { phrase: "shaking", weight: 4, category: "DISTRESS" },
    { phrase: "nightmares", weight: 5, category: "DISTRESS" },
    // Anxiety
    { phrase: "panic", weight: 6, category: "ANXIETY" },
    { phrase: "anxious", weight: 5, category: "ANXIETY" },
    { phrase: "worried", weight: 3, category: "ANXIETY" },
    { phrase: "on edge", weight: 4, category: "ANXIETY" },
    { phrase: "constant worry", weight: 5, category: "ANXIETY" },
    { phrase: "worried all the time", weight: 5, category: "ANXIETY" },
    { phrase: "restless", weight: 3, category: "ANXIETY" },
    // Trauma-related distress
    { phrase: "flashbacks", weight: 7, category: "TRAUMA" },
    { phrase: "reliving", weight: 6, category: "TRAUMA" },
    { phrase: "can't stop thinking about what happened", weight: 6, category: "TRAUMA" },
    { phrase: "thinking about what happened", weight: 6, category: "TRAUMA" },
    { phrase: "since the incident", weight: 5, category: "TRAUMA" },
    { phrase: "since it happened", weight: 5, category: "TRAUMA" },
    // Social isolation
    { phrase: "no one to talk to", weight: 6, category: "ISOLATION" },
    { phrase: "nobody believes me", weight: 6, category: "ISOLATION" },
    { phrase: "feel so alone", weight: 6, category: "ISOLATION" },
    { phrase: "all alone", weight: 5, category: "ISOLATION" },
    { phrase: "no support", weight: 5, category: "ISOLATION" },
    { phrase: "isolated", weight: 5, category: "ISOLATION" },
    // Depression indicators
    { phrase: "nothing matters", weight: 6, category: "DEPRESSION" },
    { phrase: "no point", weight: 5, category: "DEPRESSION" },
    { phrase: "give up", weight: 6, category: "DEPRESSION" },
    { phrase: "exhausted all the time", weight: 5, category: "DEPRESSION" },
    { phrase: "feel empty", weight: 5, category: "DEPRESSION" },
    // Medical
    { phrase: "injured", weight: 6, category: "MEDICAL" },
    { phrase: "bleeding", weight: 7, category: "MEDICAL" },
    { phrase: "hospital", weight: 5, category: "MEDICAL" },
    { phrase: "bruises", weight: 5, category: "MEDICAL" },
    { phrase: "chest pain", weight: 6, category: "MEDICAL" },
    { phrase: "in pain", weight: 5, category: "MEDICAL" },
    // Legal
    { phrase: "police", weight: 3, category: "LEGAL" },
    { phrase: "complaint", weight: 3, category: "LEGAL" },
    { phrase: "court", weight: 3, category: "LEGAL" },
    { phrase: "legal", weight: 3, category: "LEGAL" },
  ],
  ta: [
    { phrase: "ஆபத்தில் இருக்கிறேன்", weight: 10, category: "SAFETY" },
    { phrase: "ஆபத்து", weight: 8, category: "SAFETY" },
    { phrase: "ஆபத்தா", weight: 8, category: "SAFETY" },
    { phrase: "மிரட்டு", weight: 8, category: "SAFETY" },
    { phrase: "மிரட்டினார்கள்", weight: 9, category: "SAFETY" },
    { phrase: "மிரட்டி", weight: 8, category: "SAFETY" },
    { phrase: "மிரட்டுகிறார்கள்", weight: 9, category: "SAFETY" },
    { phrase: "வீட்டுக்கு போக முடியவில்லை", weight: 9, category: "SAFETY" },
    { phrase: "என்னை பின்தொடர்கிறார்கள்", weight: 8, category: "SAFETY" },
    { phrase: "எனக்கு தீங்கு செய்வார்கள்", weight: 10, category: "SAFETY" },
    { phrase: "பாதுகாப்பாக இல்லை", weight: 7, category: "SAFETY" },
    { phrase: "பயமாக இருக்கிறது", weight: 6, category: "FEAR" },
    { phrase: "பயமாக", weight: 5, category: "FEAR" },
    { phrase: "பயந்து", weight: 5, category: "FEAR" },
    { phrase: "நடுங்குகிறது", weight: 5, category: "FEAR" },
    { phrase: "அழுது", weight: 5, category: "DISTRESS" },
    { phrase: "தூங்க முடியவில்லை", weight: 6, category: "DISTRESS" },
    { phrase: "நம்பிக்கை இல்லை", weight: 5, category: "DISTRESS" },
    { phrase: "உடைந்து போனேன்", weight: 6, category: "DISTRESS" },
    { phrase: "கவலையாக இருக்கிறது", weight: 5, category: "ANXIETY" },
    { phrase: "பதற்றம்", weight: 5, category: "ANXIETY" },
    { phrase: "அமைதியில்லை", weight: 4, category: "ANXIETY" },
    { phrase: "அந்த சம்பவத்திற்கு பிறகு", weight: 6, category: "TRAUMA" },
    { phrase: "நினைவுகள் திரும்ப திரும்ப", weight: 7, category: "TRAUMA" },
    { phrase: "தனிமையில் இருக்கிறேன்", weight: 6, category: "ISOLATION" },
    { phrase: "சொல்ல யாரும் இல்லை", weight: 6, category: "ISOLATION" },
    { phrase: "யாரும் நம்புவதில்லை", weight: 6, category: "ISOLATION" },
    { phrase: "தனிமை", weight: 5, category: "ISOLATION" },
    { phrase: "வாழ்க்கையில் ஆர்வம் இல்லை", weight: 6, category: "DEPRESSION" },
    { phrase: "சோர்வாக", weight: 4, category: "DEPRESSION" },
    { phrase: "காயம்", weight: 6, category: "MEDICAL" },
    { phrase: "ரத்தம்", weight: 6, category: "MEDICAL" },
    { phrase: "மருத்துவமனை", weight: 5, category: "MEDICAL" },
    { phrase: "வலி", weight: 5, category: "MEDICAL" },
    { phrase: "புகார்", weight: 3, category: "LEGAL" },
    { phrase: "காவல்", weight: 3, category: "LEGAL" },
    { phrase: "நீதிமன்றம்", weight: 3, category: "LEGAL" },
  ],
  hi: [
    { phrase: "खतरे में हूँ", weight: 10, category: "SAFETY" },
    { phrase: "खतरे में", weight: 8, category: "SAFETY" },
    { phrase: "धमकी दी", weight: 9, category: "SAFETY" },
    { phrase: "धमकी", weight: 8, category: "SAFETY" },
    { phrase: "धमकाया", weight: 9, category: "SAFETY" },
    { phrase: "घर नहीं जा सकती", weight: 9, category: "SAFETY" },
    { phrase: "घर नहीं जा सकता", weight: 9, category: "SAFETY" },
    { phrase: "मुझे नुकसान पहुँचाएंगे", weight: 10, category: "SAFETY" },
    { phrase: "पीछा करते हैं", weight: 8, category: "SAFETY" },
    { phrase: "सुरक्षित नहीं", weight: 7, category: "SAFETY" },
    { phrase: "सुरक्षित महसूस नहीं", weight: 7, category: "SAFETY" },
    { phrase: "डर लग रहा है", weight: 6, category: "FEAR" },
    { phrase: "डर लगता है", weight: 5, category: "FEAR" },
    { phrase: "बहुत डर", weight: 6, category: "FEAR" },
    { phrase: "कांप रही हूँ", weight: 5, category: "FEAR" },
    { phrase: "रो रही हूँ", weight: 5, category: "DISTRESS" },
    { phrase: "नींद नहीं आती", weight: 6, category: "DISTRESS" },
    { phrase: "निराश हूँ", weight: 5, category: "DISTRESS" },
    { phrase: "टूट गई हूँ", weight: 6, category: "DISTRESS" },
    { phrase: "घबराहट होती है", weight: 5, category: "ANXIETY" },
    { phrase: "चिंता", weight: 4, category: "ANXIETY" },
    { phrase: "बेचैन", weight: 4, category: "ANXIETY" },
    { phrase: "घटना के बाद से", weight: 6, category: "TRAUMA" },
    { phrase: "वो दृश्य बार", weight: 7, category: "TRAUMA" },
    { phrase: "अकेला हूँ", weight: 6, category: "ISOLATION" },
    { phrase: "अकेली हूँ", weight: 6, category: "ISOLATION" },
    { phrase: "कोई नहीं है मेरे साथ", weight: 6, category: "ISOLATION" },
    { phrase: "कोई विश्वास नहीं करता", weight: 6, category: "ISOLATION" },
    { phrase: "जीने का मन नहीं", weight: 6, category: "DEPRESSION" },
    { phrase: "थकान", weight: 4, category: "DEPRESSION" },
    { phrase: "चोट", weight: 6, category: "MEDICAL" },
    { phrase: "दर्द", weight: 5, category: "MEDICAL" },
    { phrase: "अस्पताल", weight: 5, category: "MEDICAL" },
    { phrase: "शिकायत", weight: 3, category: "LEGAL" },
    { phrase: "पुलिस", weight: 3, category: "LEGAL" },
    { phrase: "कोर्ट", weight: 3, category: "LEGAL" },
  ],
};

// Help-seeking words used to tag "Support request" timeline events.
export const SUPPORT_REQUEST_MARKERS: Record<Language, string[]> = {
  en: ["help", "what should i do", "please", "need advice"],
  ta: ["உதவி", "என்ன செய்வது", "தயவு"],
  hi: ["मदद", "क्या करूँ", "कृपया"],
};

export function detectSupportRequest(transcript: string, language: Language): boolean {
  const markers = SUPPORT_REQUEST_MARKERS[language] || SUPPORT_REQUEST_MARKERS.en;
  return markers.some((m) => transcript.includes(m));
}
