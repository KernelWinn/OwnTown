import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator'

export class CreateOrderDto {
  @IsUUID()
  addressId!: string

  @IsUUID()
  deliverySlotId!: string

  @IsEnum(['upi', 'card', 'wallet', 'netbanking', 'cod'])
  paymentMethod!: string

  @IsOptional()
  @IsString()
  couponCode?: string

  @IsOptional()
  @IsString()
  notes?: string
}
