import { Patient, RiskScore } from '../types/patient';

function parseBloodPressure(bp: string | null | undefined): { systolic: number; diastolic: number } | null {
  if (!bp || typeof bp !== 'string') {
    return null;
  }

  const trimmed = bp.trim();
  if (trimmed === '' || trimmed === 'N/A' || trimmed === 'INVALID') {
    return null;
  }

  // Handle formats 
  const parts = trimmed.split('/');
  if (parts.length !== 2) {
    return null;
  }

  const systolic = parts[0].trim();
  const diastolic = parts[1].trim();

  // Check if either part is missing or invalid
  if (systolic === '' || diastolic === '' || 
      systolic === 'N/A' || diastolic === 'N/A' ||
      systolic === 'INVALID' || diastolic === 'INVALID') {
    return null;
  }

  const sysNum = parseFloat(systolic);
  const diaNum = parseFloat(diastolic);

  if (isNaN(sysNum) || isNaN(diaNum)) {
    return null;
  }

  return { systolic: sysNum, diastolic: diaNum };
}


 // Calculates blood pressure risk score
 //Returns 0 if invalid/missing data

export function calculateBPRisk(patient: Patient): { score: number; hasIssue: boolean } {
  const bp = parseBloodPressure(patient.blood_pressure);
  
  if (!bp) {
    return { score: 0, hasIssue: true };
  }

  const { systolic, diastolic } = bp;

  // Determine risk stage
  let riskStage = 0;

  if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
    riskStage = 2;
  }
  // Elevated
  else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
    riskStage = 1;
  }
  else if (systolic >= 140 || diastolic >= 90) {
    riskStage = 3;
  }
  // Normal
  else if (systolic < 120 && diastolic < 80) {
    riskStage = 0;
  }

  return { score: riskStage, hasIssue: false };
}


function parseTemperature(temp: number | string | null | undefined): number | null {
  if (temp === null || temp === undefined || temp === '') {
    return null;
  }

  if (typeof temp === 'number') {
    return isNaN(temp) ? null : temp;
  }

  if (typeof temp === 'string') {
    const trimmed = temp.trim();
    if (trimmed === '' || trimmed === 'N/A' || trimmed === 'INVALID' || 
        trimmed === 'TEMP_ERROR' || trimmed === 'invalid') {
      return null;
    }

    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }

  return null;
}


export function calculateTempRisk(patient: Patient): { score: number; hasIssue: boolean } {
  const temp = parseTemperature(patient.temperature);

  if (temp === null) {
    return { score: 0, hasIssue: true };
  }

  if (temp >= 101.0) {
    return { score: 2, hasIssue: false };
  } else if (temp >= 99.6 && temp <= 100.9) {
    return { score: 1, hasIssue: false };
  } else {
    return { score: 0, hasIssue: false };
  }
}

function parseAge(age: number | string | null | undefined): number | null {
  if (age === null || age === undefined || age === '') {
    return null;
  }

  if (typeof age === 'number') {
    return isNaN(age) ? null : age;
  }

  if (typeof age === 'string') {
    const trimmed = age.trim();
    if (trimmed === '' || trimmed === 'N/A' || trimmed === 'unknown' ||
        trimmed.toLowerCase().includes('fifty') || trimmed.toLowerCase().includes('unknown')) {
      return null;
    }

    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }

  return null;
}


// Calculates age risk score
//Returns 0 if invalid/missing data

export function calculateAgeRisk(patient: Patient): { score: number; hasIssue: boolean } {
  const age = parseAge(patient.age);

  if (age === null) {
    return { score: 0, hasIssue: true };
  }

  if (age > 65) {
    return { score: 2, hasIssue: false };
  } else if (age >= 40) {
    return { score: 1, hasIssue: false };
  } else {
    return { score: 0, hasIssue: false };
  }
}


//total risk score for a patient

export function calculateRiskScore(patient: Patient): RiskScore {
  const bpResult = calculateBPRisk(patient);
  const tempResult = calculateTempRisk(patient);
  const ageResult = calculateAgeRisk(patient);

  const hasDataQualityIssues = bpResult.hasIssue || tempResult.hasIssue || ageResult.hasIssue;

  return {
    patient_id: patient.patient_id,
    bpScore: bpResult.score,
    tempScore: tempResult.score,
    ageScore: ageResult.score,
    totalScore: bpResult.score + tempResult.score + ageResult.score,
    hasDataQualityIssues,
  };
}


//Checks if patient has fever (temperature ≥ 99.6°F)

export function hasFever(patient: Patient): boolean {
  const temp = parseTemperature(patient.temperature);
  return temp !== null && temp >= 99.6;
}

