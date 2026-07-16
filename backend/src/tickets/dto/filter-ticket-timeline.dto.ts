import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const TICKET_TIMELINE_RANGES = ['day', 'month', 'year'] as const;
export type TicketTimelineRange = (typeof TICKET_TIMELINE_RANGES)[number];

export class FilterTicketTimelineDto {
  @ApiProperty({
    enum: TICKET_TIMELINE_RANGES,
    example: 'month',
    description: 'Último día (por hora), último mes (por día) o último año (por mes)',
  })
  @IsIn(TICKET_TIMELINE_RANGES, {
    message: 'El rango debe ser day, month o year',
  })
  range!: TicketTimelineRange;
}
