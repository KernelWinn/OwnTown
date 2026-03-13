import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { ProductsModule } from './products/products.module'
import { OrdersModule } from './orders/orders.module'
import { PaymentModule } from './payment/payment.module'
import { ShippingModule } from './shipping/shipping.module'
import { NotificationModule } from './notification/notification.module'
import { AdminModule } from './admin/admin.module'
import { StorageModule } from './storage/storage.module'
import { AddressesModule } from './addresses/addresses.module'
import { CartModule } from './cart/cart.module'
import { CouponsModule } from './coupons/coupons.module'
import { BannersModule } from './banners/banners.module'
import { ReviewsModule } from './reviews/reviews.module'
import { ProcurementModule } from './procurement/procurement.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    AddressesModule,
    CartModule,
    ProductsModule,
    OrdersModule,
    PaymentModule,
    ShippingModule,
    NotificationModule,
    AdminModule,
    CouponsModule,
    BannersModule,
    ReviewsModule,
    ProcurementModule,
  ],
})
export class AppModule {}
