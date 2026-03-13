import { IsIn } from 'class-validator'

export class UpdatePoStatusDto {
  @IsIn(['sent', 'confirmed', 'partial', 'received', 'cancelled'])
  status!: string
}
