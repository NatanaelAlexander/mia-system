/** Mock mínimo para poder importar NotificationsService en unit tests. */
export const Cron = () => () => undefined;
export const CronExpression = { EVERY_DAY_AT_3AM: '0 3 * * *' };
export const SchedulerRegistry = class SchedulerRegistry {};
