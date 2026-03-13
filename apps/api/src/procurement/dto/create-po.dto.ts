import {
  IsUUID, IsArray, IsInt, IsPositive, IsOptional,
  ValidateNested, IsString, IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class PoItemDto {
  @IsUUID()                  productId!: string
  @IsInt() @IsPositive()     orderedQty!: number
  @IsInt() @IsPositive()     unitCost!: number   // paise
}

export class CreatePoDto {
  @IsUUID()                  supplierId!: string
  @IsOptional() @IsDateString() expectedDate?: string
  @IsOptional() @IsString()  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoItemDto)
  items!: PoItemDto[]
}
