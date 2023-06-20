import { Axios } from 'axios';

export class EventAwareMixin {
  client: Axios;
  clientReady: Promise<boolean>;

  public async getEvents(): Promise<Record<string, any>> {
    await this.clientReady;
    const response = await this.client.get('/event/', { transformResponse: [data => data] });
    return JSON.parse(response.data);
  }

  public async getEventRegistrants(eventId: string): Promise<Record<string, any>> {
    await this.clientReady;
    const response = await this.client.get(`/event/${eventId}/get_event_registrants/`, { transformResponse: [data => data] });
    return JSON.parse(response.data);
  }

  public async getEventMembers(eventId: string): Promise<Record<string, any>> {
    await this.clientReady;
    const response = await this.client.get(`/event/event-members/${eventId}/`, { transformResponse: [data => data] });
    return JSON.parse(response.data);
  }
}
