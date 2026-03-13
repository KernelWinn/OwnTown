import { IsString, IsOptional, IsEmail, IsBoolean, Length } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'

export class CreateSupplierDto {
  @IsString() @Length(1, 255) name!: string
  @IsOptional() @IsString() contactName?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsString() gstNumber?: string
  @IsOptional() @IsString() paymentTerms?: string
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsBoolean() isActive?: boolean
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
