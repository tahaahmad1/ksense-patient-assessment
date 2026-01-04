export interface Patient {
  patient_id: string;
  name: string;
  age: number | string | null | undefined;
  gender: string;
  blood_pressure: string | null | undefined;
  temperature: number | string | null | undefined;
  visit_date: string;
  diagnosis: string;
  medications: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse {
  data: Patient[];
  pagination: PaginationInfo;
  metadata: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface RiskScore {
  patient_id: string;
  bpScore: number;
  tempScore: number;
  ageScore: number;
  totalScore: number;
  hasDataQualityIssues: boolean;
}

export interface AlertLists {
  highRiskPatients: string[];
  feverPatients: string[];
  dataQualityIssues: string[];
}

