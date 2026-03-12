import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, SetMetadata } from '@nestjs/common'
import { AdminService } from './admin.service'
import { ProductsService } from '../products/products.service'
import { OrdersService } from '../orders/orders.service'
import { ShippingService } from '../shipping/shipping.service'
import { AdminJwtGuard, IS_PUBLIC_KEY } from './admin-jwt.guard'

const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly shippingService: ShippingService,
  ) {}

  @Post('auth/login')
  @Public()
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

  @Get('orders/:id/label')
  getShippingLabel(@Param('id') id: string) {
    return this.shippingService.generateLabel(id)
  }

  @Get('products/low-stock')
  getLowStock() {
    return this.productsService.findLowStock()
  }

  @Get('users')
  getUsers(@Query('limit') limit?: string) {
    return this.adminService.getUsers(Number(limit) || 100)
  }

  @Get('slots')
  getSlots(@Query('date') date?: string) {
    return this.adminService.getSlots(date)
  }

  @Post('slots')
  createSlot(@Body() body: { date: string; startTime: string; endTime: string; label: string; maxOrders: number }) {
    return this.adminService.createSlot(body)
  }

  @Patch('slots/:id')
  updateSlot(
    @Param('id') id: string,
    @Body() body: Partial<{ date: string; startTime: string; endTime: string; label: string; maxOrders: number; isActive: boolean }>,
  ) {
    return this.adminService.updateSlot(id, body)
  }

  @Delete('slots/:id')
  deleteSlot(@Param('id') id: string) {
    return this.adminService.deleteSlot(id)
  }
}
