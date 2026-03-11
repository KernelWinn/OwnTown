import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import { DB } from '../database/database.module'
import { users } from '../database/schema'
import { OtpService } from './otp.service'

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: any,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async sendOtp(phone: string) {
    await this.otpService.send(phone)
    return { message: 'OTP sent successfully' }
  }

  async verifyOtp(phone: string, otp: string) {
    const valid = await this.otpService.verify(phone, otp)
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP')

    let [user] = await this.db.select().from(users).where(eq(users.phone, phone))
    const isNewUser = !user

    if (!user) {
      const [created] = await this.db.insert(users).values({ phone }).returning()
      user = created
    }

    const tokens = await this.generateTokens(user.id, user.phone)
    return { user, tokens, isNewUser }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      })
      const [user] = await this.db.select().from(users).where(eq(users.id, payload.sub))
      if (!user || !user.isActive) throw new UnauthorizedException()
      return this.generateTokens(user.id, user.phone)
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  private async generateTokens(userId: string, phone: string) {
    const payload = { sub: userId, phone }
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
    ])
    return { accessToken, refreshToken }
  }
}
