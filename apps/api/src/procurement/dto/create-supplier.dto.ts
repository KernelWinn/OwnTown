import { IsString, IsOptional, IsEmail, Length } from 'class-validator'

export class CreateSupplierDto {
  @IsString() @Length(1, 255) name!: string
  @IsOptional() @IsString() contactName?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsString() gstNumber?: string
  @IsOptional() @IsString() paymentTerms?: string
  @IsOptional() @IsString() notes?: string
}
