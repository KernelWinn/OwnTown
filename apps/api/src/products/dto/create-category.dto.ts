import { IsString, IsOptional, IsInt, IsBoolean, Length, Min, IsUUID } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @Length(1, 100)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUUID()
  parentId?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @IsString()
  imageUrl?: string
}
