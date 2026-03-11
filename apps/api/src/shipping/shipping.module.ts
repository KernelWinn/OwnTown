import { Module } from '@nestjs/common'
import { ShippingController } from './shipping.controller'
import { ShippingService } from './shipping.service'
import { OrdersModule } from '../orders/orders.module'

@Module({
  imports: [OrdersModule],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
