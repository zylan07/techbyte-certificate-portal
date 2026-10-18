export type CertificateTemplateType = 'standard' | 'geeksforgeeks' | 'recognition';

export type ParticipantStatus = 'ready' | 'invalid' | 'duplicate' | 'generated' | 'sent' | 'failed';

export interface Participant {
  id: string;
  row_num: number;
  name: string;
  college_name: string;
  class_section?: string | null;
  mail_id: string;
  status: ParticipantStatus;
  error_detail?: string | null;
  certificate_filename?: string | null;
  certificate_path?: string | null;
  certificate_event?: string | null;
}

export interface EventConfig {
  id: string;
  name: string;
  template: CertificateTemplateType;
  template_filename?: string;
  date: string;
  department: string;
  institution: string;
  description: string;
  category?: 'participation' | 'recognition';
}

export interface ValidationErrorItem {
  row: number;
  name: string;
  college: string;
  email: string;
  error: string;
  type: 'error' | 'duplicate';
}

export interface ValidationSummary {
  session_id: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_records: number;
  participants: Participant[];
  errors: ValidationErrorItem[];
}

export interface GenerateResponse {
  session_id: string;
  total_generated: number;
  zip_download_url?: string | null;
  participants: Participant[];
}

export interface DeliveryReportItem {
  id: string;
  name: string;
  email: string;
  certificate: string;
  status: 'SENT' | 'FAILED';
  error?: string | null;
}

export interface DeliveryReport {
  session_id: string;
  total_participants: number;
  certificates_generated: number;
  emails_sent: number;
  failed: number;
  items: DeliveryReportItem[];
}

export interface EmailConfigStatus {
  configured: boolean;
  test_mode: boolean;
  sender_email?: string;
  smtp_host?: string;
  smtp_port?: number;
  authentication?: string;
  from_name?: string;
  from_email?: string;
  notice?: string;
}
