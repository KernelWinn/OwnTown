import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AdminJwtStrategy } from './admin-jwt.strategy'
import { AdminJwtGuard } from './admin-jwt.guard'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { ProductsModule } from '../products/products.module'
import { OrdersModule } from '../orders/orders.module'
import { ShippingModule } from '../shipping/shipping.module'
import { CouponsModule } from '../coupons/coupons.module'
import { BannersModule } from '../banners/banners.module'
import { ReviewsModule } from '../reviews/reviews.module'

@Module({
  imports: [
    PassportModule,
    ProductsModule,
    OrdersModule,
    ShippingModule,
    CouponsModule,
    BannersModule,
    ReviewsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtStrategy, AdminJwtGuard],
})
export class AdminModule {}
