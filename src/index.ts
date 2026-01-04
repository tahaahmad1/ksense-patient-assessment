import 'dotenv/config';
import { fetchAllPatients } from './utils/apiClient';
import { calculateRiskScore, hasFever } from './utils/riskCalculator';
import { AlertLists, Patient, RiskScore } from './types/patient';

async function main() {
  try {
    console.log('=== DemoMed Risk Scoring System ===\n');

    // Fetch all patients
    const patients = await fetchAllPatients(20); 

    if (patients.length === 0) {
      console.log('No patients found.');
      return;
    }
    console.log('\n=== Calculating Risk Scores ===\n');
    const riskScores: RiskScore[] = patients.map(patient => calculateRiskScore(patient));
    const alerts: AlertLists = {
      highRiskPatients: [],
      feverPatients: [],
      dataQualityIssues: [],
    };

    patients.forEach((patient, index) => {
      const riskScore = riskScores[index];

      // High-risk patients 
      if (riskScore.totalScore >= 4) {
        alerts.highRiskPatients.push(patient.patient_id);
      }
      // Fever patients
      if (hasFever(patient)) {
        alerts.feverPatients.push(patient.patient_id);
      }
      // Data quality issues
      if (riskScore.hasDataQualityIssues) {
        alerts.dataQualityIssues.push(patient.patient_id);
      }
    });

    console.log('\n=== Risk Score Summary ===\n');
    console.log('Patient ID | BP Score | Temp Score | Age Score | Total Score | Data Issues');
    
    riskScores.forEach(score => {
      const issues = score.hasDataQualityIssues ? 'Yes' : 'No';
      console.log(
        `${score.patient_id.padEnd(10)} | ${String(score.bpScore).padEnd(8)} | ${String(score.tempScore).padEnd(10)} | ${String(score.ageScore).padEnd(9)} | ${String(score.totalScore).padEnd(11)} | ${issues}`
      );
    });

    console.log('\n=== Alert Lists ===\n');
    console.log(`High-Risk Patients (Total Risk Score ≥ 4): ${alerts.highRiskPatients.length} patients`);
    console.log(alerts.highRiskPatients.length > 0 ? alerts.highRiskPatients.join(', ') : 'None');
    
    console.log(`\nFever Patients (Temperature ≥ 99.6°F): ${alerts.feverPatients.length} patients`);
    console.log(alerts.feverPatients.length > 0 ? alerts.feverPatients.join(', ') : 'None');
    
    console.log(`\nData Quality Issues: ${alerts.dataQualityIssues.length} patients`);
    console.log(alerts.dataQualityIssues.length > 0 ? alerts.dataQualityIssues.join(', ') : 'None');

  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}
main();

