import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    StorageModule,
    AuthModule,
    AddressesModule,
    ProductsModule,
    OrdersModule,
    PaymentModule,
    ShippingModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
