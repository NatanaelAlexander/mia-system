export const USER_NOTIFICATION_ROOM_PREFIX = 'user';

export function userNotificationRoom(userId: string): string {
  return `${USER_NOTIFICATION_ROOM_PREFIX}:${userId}:notifications`;
}
