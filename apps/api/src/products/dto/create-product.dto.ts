import {
  IsString, IsInt, IsOptional, IsBoolean, IsEnum,
  IsArray, Length, Min, IsPositive,
} from 'class-validator'

export class CreateProductDto {
  @IsString()
  @Length(1, 255)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  categoryId!: string

  @IsInt()
  @IsPositive()
  price!: number      // paise

  @IsInt()
  @IsPositive()
  mrp!: number        // paise

  @IsString()
  @Length(1, 50)
  unit!: string       // "500g", "1L"

  @IsInt()
  @Min(0)
  stockQuantity!: number

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number

  @IsString()
  @Length(1, 100)
  sku!: string

  @IsOptional()
  @IsString()
  barcode?: string

  @IsEnum(['exempt', 'five', 'twelve', 'eighteen'])
  gstCategory!: string

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]   // S3 keys, set after upload
}
