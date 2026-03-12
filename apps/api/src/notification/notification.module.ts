import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { NotificationService } from './notification.service'
import { NotificationProcessor } from './notification.processor'

export const NOTIFICATION_QUEUE = 'notifications'

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService, BullModule],
})
export class NotificationModule {}
