export interface Service {
  id: number;
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'major_outage' | 'maintenance';
  created_at: string;
}

export interface Incident {
  id: number;
  service_id: number;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface Update {
  id: number;
  incident_id: number;
  description: string;
  status: string;
  created_at: string;
}

export interface StatusPayload {
  services: Service[];
  activeIncidents: Incident[];
  generatedAt: string;
}

export interface HistoryPayload {
  incidents: Incident[];
  generatedAt: string;
}

export interface IncidentUpdateEvent {
  incidentId: number;
  message: string;
  status: string;
  timestamp: number;
}
