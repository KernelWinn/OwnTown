import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { CurrentUser } from './current-user.decorator'
import { NotificationService } from '../notification/notification.service'
import { SendOtpDto } from './dto/send-otp.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('otp/send')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone)
  }

  @Post('otp/verify')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp)
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return user
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  saveFcmToken(
    @CurrentUser() user: any,
    @Body() body: { token: string; platform: 'ios' | 'android' | 'web' },
  ) {
    return this.notificationService.saveFcmToken(user.id, body.token, body.platform)
  }
}
