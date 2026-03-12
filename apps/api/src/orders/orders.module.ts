import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { ProductsModule } from '../products/products.module'
import { CartModule } from '../cart/cart.module'

@Module({
  imports: [ProductsModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
