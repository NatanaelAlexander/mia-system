export const TICKET_PUBLIC_ROOM_PREFIX = 'ticket';
export const TICKET_INTERNAL_ROOM_SUFFIX = 'internal';

export function ticketPublicRoom(ticketId: string): string {
  return `${TICKET_PUBLIC_ROOM_PREFIX}:${ticketId}:public`;
}

export function ticketInternalRoom(ticketId: string): string {
  return `${TICKET_PUBLIC_ROOM_PREFIX}:${ticketId}:${TICKET_INTERNAL_ROOM_SUFFIX}`;
}
