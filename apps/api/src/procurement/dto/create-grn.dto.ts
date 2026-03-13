import {
  IsUUID, IsArray, IsInt, IsPositive, Min, IsOptional,
  ValidateNested, IsString, IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class GrnLineDto {
  @IsUUID()               purchaseOrderItemId!: string
  @IsInt() @Min(1)        receivedQty!: number
  @IsInt() @IsPositive()  unitCost!: number        // paise — actual received cost
}

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
