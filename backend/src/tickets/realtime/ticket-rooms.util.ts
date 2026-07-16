export const TICKET_PUBLIC_ROOM_PREFIX = 'ticket';
export const TICKET_INTERNAL_ROOM_SUFFIX = 'internal';
export const APP_ONLINE_ROOM = 'app:online';
export const APP_PRESENCE_WATCHERS_ROOM = 'app:presence:watchers';

export function ticketPublicRoom(ticketId: string): string {
  return `${TICKET_PUBLIC_ROOM_PREFIX}:${ticketId}:public`;
}

export function ticketInternalRoom(ticketId: string): string {
  return `${TICKET_PUBLIC_ROOM_PREFIX}:${ticketId}:${TICKET_INTERNAL_ROOM_SUFFIX}`;
}

export function appOnlineRoom(): string {
  return APP_ONLINE_ROOM;
}

export function appPresenceWatchersRoom(): string {
  return APP_PRESENCE_WATCHERS_ROOM;
}
