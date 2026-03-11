import { IsString, Length, Matches } from 'class-validator'

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone: string

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^\d{6}$/)
  otp: string
}
