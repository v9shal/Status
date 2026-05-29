import axios from 'axios';
import type { Service, Incident, StatusPayload, HistoryPayload } from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  // Public
  async getStatus(): Promise<StatusPayload> {
    const { data } = await client.get('/status');
    return data;
  },

  async getHistory(): Promise<HistoryPayload> {
    const { data } = await client.get('/history');
    return data;
  },

  async getIncidentById(id: number): Promise<Incident> {
    const { data } = await client.get(`/incident/${id}`);
    return data;
  },

  // Admin — Incidents
  async createIncident(payload: { service_id: number; title: string; description: string }): Promise<{ incident: Incident; update: unknown }> {
    const { data } = await client.post('/incident', payload);
    return data;
  },

  async patchIncident(id: number, payload: Record<string, unknown>): Promise<Incident> {
    const { data } = await client.patch(`/incident/${id}`, payload);
    return data;
  },

  // Admin — Services
  async createService(payload: { name: string; description: string }): Promise<Service> {
    const { data } = await client.post('/services', payload);
    return data;
  },

  async updateService(id: number, payload: Record<string, unknown>): Promise<Service> {
    const { data } = await client.patch(`/service/${id}`, payload);
    return data;
  },

  // Subscribers
  async subscribe(email: string, service_id: number): Promise<{ message: string }> {
    const { data } = await client.post('/subscriber', { email, service_id });
    return data;
  },

  async unsubscribe(email: string, service_id: number): Promise<{ message: string }> {
    const { data } = await client.delete('/subscriber/unsubscribe', { data: { email, service_id } });
    return data;
  },
};
