import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

const OTP_TTL_SECONDS = 300  // 5 minutes
const otpStore = new Map<string, { otp: string; expiresAt: number }>()

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)

  constructor(private readonly config: ConfigService) {}

  async send(phone: string): Promise<void> {
    const otp = this.generateOtp()
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 })

    const isDev = this.config.get('NODE_ENV') !== 'production'
    if (isDev) {
      this.logger.debug(`[DEV] OTP for ${phone}: ${otp}`)
      return
    }

    await this.sendViaMSG91(phone, otp)
  }

  async verify(phone: string, otp: string): Promise<boolean> {
    const entry = otpStore.get(phone)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone)
      return false
    }
    if (entry.otp !== otp) return false
    otpStore.delete(phone)
    return true
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private async sendViaMSG91(phone: string, otp: string): Promise<void> {
    const authKey = this.config.getOrThrow('MSG91_AUTH_KEY')
    const templateId = this.config.getOrThrow('MSG91_TEMPLATE_ID')
    try {
      await axios.post(
        'https://control.msg91.com/api/v5/otp',
        { template_id: templateId, mobile: `91${phone}`, otp },
        { headers: { authkey: authKey, 'Content-Type': 'application/json' } },
      )
    } catch (err) {
      this.logger.error('MSG91 OTP send failed', err)
      throw err
    }
  }
}
