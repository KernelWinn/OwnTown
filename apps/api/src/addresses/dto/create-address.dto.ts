import { IsString, IsOptional, IsBoolean, Matches, Length, IsNumber } from 'class-validator'

export class CreateAddressDto {
  @IsString()
  @Length(1, 50)
  label!: string

  @IsString()
  @Length(1, 100)
  name!: string

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit mobile number' })
  phone!: string

  @IsString()
  @Length(1, 255)
  line1!: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  line2?: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  landmark?: string

  @IsString()
  @Length(1, 100)
  city!: string

  @IsString()
  @Length(1, 100)
  state!: string

  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter a valid 6-digit pincode' })
  pincode!: string

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  @IsNumber()
  latitude?: number

  @IsOptional()
  @IsNumber()
  longitude?: number
}
