// Local heuristic PCOS risk scoring used as a fallback and to guarantee that
// assessment data always transfers to the dashboard, even if the AI analysis
// fails or returns 0.

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export interface AssessmentLike {
  age?: number | string;
  height?: number | string;
  weight?: number | string;
  periodFrequency?: string;
  cycleLength?: number | string;
  flowIntensity?: string;
  symptoms?: string[];
  acneSeverity?: string;
  hairGrowth?: string;
  hairLoss?: string;
  weightChanges?: string;
  moodSymptoms?: string[];
  familyHistory?: string;
}

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

export function computeLocalRisk(data: AssessmentLike): { riskScore: number; riskLevel: RiskLevel } {
  let score = 0;

  // Cycle irregularity (Rotterdam criterion #1)
  const freq = (data.periodFrequency || '').toLowerCase();
  if (freq.includes('irregular')) score += 20;
  else if (freq.includes('absent') || freq.includes('missed')) score += 25;

  const cycleLen = num(data.cycleLength);
  if (cycleLen > 35 || (cycleLen > 0 && cycleLen < 21)) score += 10;

  // Hyperandrogenism signs (Rotterdam criterion #2)
  const acne = (data.acneSeverity || '').toLowerCase();
  if (acne.includes('severe')) score += 12;
  else if (acne.includes('moderate')) score += 8;
  else if (acne.includes('mild')) score += 3;

  const hair = (data.hairGrowth || '').toLowerCase();
  if (hair.includes('severe')) score += 15;
  else if (hair.includes('moderate')) score += 10;
  else if (hair.includes('mild')) score += 5;

  const loss = (data.hairLoss || '').toLowerCase();
  if (loss.includes('severe')) score += 10;
  else if (loss.includes('moderate')) score += 6;
  else if (loss.includes('mild')) score += 3;

  // Weight changes
  const wc = (data.weightChanges || '').toLowerCase();
  if (wc.includes('10plus') || wc.includes('20+')) score += 10;
  else if (wc.includes('5-10') || wc.includes('10-20')) score += 6;
  else if (wc.includes('difficulty')) score += 4;

  // BMI (imperial)
  const h = num(data.height);
  const w = num(data.weight);
  if (h > 0 && w > 0) {
    const bmi = (w / (h * h)) * 703;
    if (bmi >= 30) score += 8;
    else if (bmi >= 25) score += 4;
  }

  // Symptoms
  const sx = data.symptoms || [];
  score += Math.min(sx.length * 2, 12);

  const mood = data.moodSymptoms || [];
  score += Math.min(mood.length * 1, 5);

  // Family history
  const fam = (data.familyHistory || '').toLowerCase();
  if (fam.includes('yes') || fam.includes('mother') || fam.includes('sister')) score += 8;

  // Heavy or absent flow
  const flow = (data.flowIntensity || '').toLowerCase();
  if (flow.includes('heavy')) score += 3;
  if (flow.includes('none') || flow.includes('absent')) score += 5;

  const riskScore = Math.max(0, Math.min(100, Math.round(score)));
  const riskLevel: RiskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Moderate' : 'High';
  return { riskScore, riskLevel };
}