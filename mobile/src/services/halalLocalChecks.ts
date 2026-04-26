import { findEcodesInText } from "../content/halalEcodeDb";

export type HalalLocalChecks = {
  suspiciousTerms: string[];
  highRiskTerms: string[];
  matchedEcodes: string[];
  summaryKk: string;
};

const HIGH_RISK_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "шошқа/доңыз компоненті", re: /\b(шошқа|доңыз|pork|porcine|lard|бекон)\b/i },
  { label: "спирт/этанол", re: /\b(спирт|алкоголь|ethanol|alcohol|wine|beer)\b/i },
  { label: "харам ет компоненті", re: /\b(ham|pepperoni|gelatine porcine)\b/i },
  { label: "кармин/кошениль", re: /\b(carmin|carmine|cochineal|кармин|кошениль|e120)\b/i },
  { label: "шеллак (жәндік шайыры)", re: /\b(shellac|шеллак|e904)\b/i },
  { label: "қанықпаған ет ферменті (реннет)", re: /\b(rennet|сычужный фермент|фермент телячий)\b/i },
];

const SUSPICIOUS_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "желатин", re: /\b(желатин|gelatin|gelatine)\b/i },
  { label: "глицерин", re: /\b(глицерин|glycerin|glycerol)\b/i },
  { label: "эмульгатор", re: /\b(эмульгатор|emulsifier)\b/i },
  { label: "табиғи ароматизатор", re: /\b(ароматизатор|flavor|flavour)\b/i },
  { label: "фермент", re: /\b(фермент|enzyme)\b/i },
  { label: "моно/диглицерид", re: /\b(monoglyceride|diglyceride|mono- and diglycerides|e471|e472)\b/i },
  { label: "сүт сарысуы/казеин", re: /\b(whey|casein|казеин|сыворотка)\b/i },
  { label: "лецитин", re: /\b(lecithin|лецитин|e322)\b/i },
  { label: "полисорбат", re: /\b(polysorbate|полисорбат|e432|e433|e434|e435)\b/i },
  { label: "стеарат", re: /\b(stearate|magnesium stearate|стеарат|e572)\b/i },
  { label: "лактат", re: /\b(lactate|лактат|e325|e326|e327)\b/i },
];

function collectMatches(text: string, rules: Array<{ label: string; re: RegExp }>): string[] {
  const out: string[] = [];
  for (const rule of rules) {
    if (rule.re.test(text)) out.push(rule.label);
  }
  return out;
}

export function runHalalLocalChecks(rawText: string): HalalLocalChecks {
  const text = rawText.trim();
  if (!text) {
    return {
      suspiciousTerms: [],
      highRiskTerms: [],
      matchedEcodes: [],
      summaryKk: "Мәтін бос — алдымен құрамды жазыңыз.",
    };
  }
  const highRiskTerms = collectMatches(text, HIGH_RISK_PATTERNS);
  const suspiciousTerms = collectMatches(text, SUSPICIOUS_PATTERNS);
  const matchedEcodes = findEcodesInText(text).map((e) => e.code);
  const lines: string[] = [];
  if (highRiskTerms.length) lines.push(`Жоғары тәуекел: ${highRiskTerms.join(", ")}`);
  if (suspiciousTerms.length) lines.push(`Күмәнді терминдер: ${suspiciousTerms.join(", ")}`);
  if (matchedEcodes.length) lines.push(`Табылған E-кодтар: ${matchedEcodes.join(", ")}`);
  if (!lines.length) {
    lines.push("Күшті қауіп маркерлері табылмады. Бұл толық үкім емес — AI/сертификатпен тексеріңіз.");
  }
  return {
    suspiciousTerms,
    highRiskTerms,
    matchedEcodes,
    summaryKk: lines.join("\n"),
  };
}
