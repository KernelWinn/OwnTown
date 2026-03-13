import {
  IsString, IsInt, IsOptional, IsBoolean, IsEnum,
  IsArray, Length, Min, IsPositive, IsNumber,
} from 'class-validator'

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(1, 255) name?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsString() categoryId?: string
  @IsOptional() @IsNumber() @IsPositive() price?: number
  @IsOptional() @IsNumber() @IsPositive() mrp?: number
  @IsOptional() @IsString() @Length(1, 50) unit?: string
  @IsOptional() @IsInt() @Min(0) stockQuantity?: number
  @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number
  @IsOptional() @IsString() @Length(1, 100) sku?: string
  @IsOptional() @IsString() barcode?: string
  @IsOptional() @IsEnum(['exempt', 'five', 'twelve', 'eighteen']) gstCategory?: string
  @IsOptional() @IsBoolean() isFeatured?: boolean
  @IsOptional() @IsBoolean() isActive?: boolean
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) optionNames?: string[]
}
