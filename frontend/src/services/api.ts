import {
  EventConfig,
  ValidationSummary,
  GenerateResponse,
  DeliveryReport,
  EmailConfigStatus
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export async function fetchEvents(): Promise<EventConfig[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error('Failed to load events');
  return res.json();
}

export async function uploadExcelFile(file: File, eventName: string): Promise<ValidationSummary> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('event_name', eventName);

  const res = await fetch(`${API_BASE}/upload/excel`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'Failed to upload and validate spreadsheet');
  }

  return res.json();
}

export function getTemplateDownloadUrl(eventName?: string): string {
  const param = eventName ? `?event_name=${encodeURIComponent(eventName)}` : "";
  return `${API_BASE}/upload/template${param}`;
}

export function getErrorReportDownloadUrl(sessionId: string): string {
  return `${API_BASE}/upload/error-report/${sessionId}`;
}

export async function generateCertificatesApi(
  sessionId: string,
  eventName: string,
  overlayEventDetails: boolean = false
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      event_name: eventName,
      overlay_event_details: overlayEventDetails
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Generation failed' }));
    throw new Error(errorData.detail || 'Failed to generate certificates');
  }

  return res.json();
}

export function getPreviewImageUrl(
  sessionId: string,
  participantId: string,
  overlayEvent: boolean = false,
  eventName?: string,
  version?: number | string
): string {
  const v = version ? `&v=${version}` : '';
  const ev = eventName ? `&event_name=${encodeURIComponent(eventName)}` : '';
  return `${API_BASE}/certificates/preview/${sessionId}/${participantId}?overlay_event=${overlayEvent}${ev}${v}`;
}

export function getPreviewPdfUrl(
  sessionId: string,
  participantId: string,
  overlayEvent: boolean = false,
  eventName?: string
): string {
  const ev = eventName ? `&event_name=${encodeURIComponent(eventName)}` : '';
  return `${API_BASE}/certificates/preview-pdf/${sessionId}/${participantId}?overlay_event=${overlayEvent}${ev}`;
}

export function getZipDownloadUrl(sessionId: string, eventName?: string): string {
  const ev = eventName ? `?event_name=${encodeURIComponent(eventName)}` : '';
  return `${API_BASE}/certificates/download-zip/${sessionId}${ev}`;
}

export async function selectSessionEventApi(sessionId: string, eventName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/certificates/select-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, event_name: eventName }),
  });
  if (!res.ok) {
    console.warn('Notice updating session event:', res.statusText);
  }
}

export async function sendCertificatesEmailApi(
  sessionId: string,
  eventName: string
): Promise<DeliveryReport> {
  const res = await fetch(`${API_BASE}/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      event_name: eventName
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Email dispatch failed' }));
    throw new Error(errorData.detail || 'Failed to dispatch certificates via email');
  }

  return res.json();
}

export async function retryFailedEmailsApi(
  sessionId: string,
  eventName: string
): Promise<DeliveryReport> {
  const res = await fetch(`${API_BASE}/email/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      event_name: eventName
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Retry failed' }));
    throw new Error(errorData.detail || 'Failed to retry failed emails');
  }

  return res.json();
}

export async function fetchEmailConfigStatus(): Promise<EmailConfigStatus> {
  const res = await fetch(`${API_BASE}/email/config-status`);
  if (!res.ok) throw new Error('Failed to fetch email status');
  return res.json();
}

export async function testEmailConnectionApi(): Promise<{ success: boolean; message: string; status: EmailConfigStatus }> {
  const res = await fetch(`${API_BASE}/email/test`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Connection check failed' }));
    throw new Error(errorData.detail || errorData.message || 'SMTP connection check failed');
  }
  return res.json();
}

export async function addSingleRecipientApi(
  name: string,
  mailId: string,
  eventName: string,
  classSection?: string,
  collegeName?: string
): Promise<ValidationSummary> {
  const res = await fetch(`${API_BASE}/upload/single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mail_id: mailId,
      event_name: eventName,
      class_section: classSection || null,
      college_name: collegeName || null
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to add recipient' }));
    throw new Error(errorData.detail || 'Validation failed for recipient');
  }

  return res.json();
}
