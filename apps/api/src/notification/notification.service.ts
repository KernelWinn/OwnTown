import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import axios from 'axios'
import { DB } from '../database/database.module'
import { fcmTokens } from '../database/schema'

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    @Inject(DB) private readonly db: any,
    private readonly config: ConfigService,
  ) {}

  async sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
    const tokens = await this.db.select().from(fcmTokens).where(eq(fcmTokens.userId, userId))
    if (!tokens.length) return

    const fcmKey = this.config.get('FCM_SERVER_KEY')
    if (!fcmKey) {
      this.logger.debug(`[DEV] Push to ${userId}: ${title} — ${body}`)
      return
    }

    await Promise.allSettled(
      tokens.map((t: any) =>
        axios.post(
          'https://fcm.googleapis.com/fcm/send',
          { to: t.token, notification: { title, body }, data },
          { headers: { Authorization: `key=${fcmKey}` } },
        ),
      ),
    )
  }

  async sendSms(phone: string, message: string) {
    const authKey = this.config.get('MSG91_AUTH_KEY')
    if (!authKey) {
      this.logger.debug(`[DEV] SMS to ${phone}: ${message}`)
      return
    }
    await axios.post(
      'https://control.msg91.com/api/sendhttp.php',
      null,
      { params: { authkey: authKey, mobiles: `91${phone}`, message, route: 4, country: 91 } },
    )
  }

  async saveFcmToken(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
    await this.db.insert(fcmTokens)
      .values({ userId, token, platform })
      .onConflictDoNothing()
  }
}
