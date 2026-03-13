import {
  IsUUID, IsArray, IsInt, IsMin, IsOptional,
  ValidateNested, IsString, IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class GrnLineDto {
  @IsUUID()              purchaseOrderItemId!: string
  @IsInt() @IsMin(0)     receivedQty!: number
  @IsInt() @IsPositive() unitCost!: number        // paise — actual received cost
}

function IsPositive() { return IsMin(1) }

export class CreateGrnDto {
  @IsUUID()                     purchaseOrderId!: string
  @IsOptional() @IsString()     invoiceNumber?: string
  @IsOptional() @IsDateString() invoiceDate?: string
  @IsOptional() @IsString()     notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrnLineDto)
  lines!: GrnLineDto[]
}
