import { Axios } from 'axios';

export class EventAwareMixin {
  client: Axios;
  clientReady: Promise<boolean>;

  public async getEvents(eventId: Record<string, any>): Promise<Record<string, any>> {
    await this.clientReady;
    return await this.client.get(`/events/`, { transformResponse: [data => data] });
  }

  public async getEventRegistrants(eventId: string): Promise<Record<string, any>> {
    await this.clientReady;
    return await this.client.get(`/event/${eventId}/get_event_registrants/`, { transformResponse: [data => data] });
  }

  public async getEventMembers(eventId: string): Promise<Record<string, any>> {
    await this.clientReady;
    return await this.client.get(`/event/event-members/${eventId}/`, { transformResponse: [data => data] });
  }
}