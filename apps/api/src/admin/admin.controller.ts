import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common'
import { AdminService } from './admin.service'
import { ProductsService } from '../products/products.service'
import { OrdersService } from '../orders/orders.service'
import { ShippingService } from '../shipping/shipping.service'

@Controller('admin')
// TODO: Add AdminJwtGuard
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly shippingService: ShippingService,
  ) {}

  @Post('auth/login')
  login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password)
  }

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats()
  }

  @Get('orders')
  getOrders(@Query('limit') limit?: string) {
    return this.adminService.getOrders(Number(limit) || 20)
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrderWithItems(id)
  }

  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status)
  }

  @Post('orders/:id/ship')
  createShipment(@Param('id') id: string) {
    return this.shippingService.createShipment(id)
  }

  @Get('products/low-stock')
  getLowStock() {
    return this.productsService.findLowStock()
  }
}
