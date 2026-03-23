import { Controller, Get, Post, Put, Patch, Delete, HttpCode, HttpStatus, Body, Param, Query, UseGuards, SetMetadata } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { IsEnum } from 'class-validator'

class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'])
  status!: string
}
import { AdminService } from './admin.service'
import { ProductsService } from '../products/products.service'
import { OrdersService } from '../orders/orders.service'
import { ShippingService } from '../shipping/shipping.service'
import { CouponsService } from '../coupons/coupons.service'
import { BannersService } from '../banners/banners.service'
import { ReviewsService } from '../reviews/reviews.service'
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
    private readonly couponsService: CouponsService,
    private readonly bannersService: BannersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post('auth/login')
  @Public()
  @Throttle({ default: { ttl: 900000, limit: 5 } })  // 5 attempts per 15 min
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
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status)
  }

  @Post('orders/:id/ship')
  createShipment(@Param('id') id: string) {
    return this.shippingService.createShipment(id)
  }

  @Delete('orders/:id/ship')
  @HttpCode(HttpStatus.OK)
  cancelShipment(@Param('id') id: string) {
    return this.shippingService.cancelShipment(id)
  }

  @Get('orders/:id/track')
  trackShipment(@Param('id') id: string) {
    return this.shippingService.trackShipment(id)
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

  // ─── Coupons ────────────────────────────────────────────────────────────

  @Get('coupons')
  getCoupons() {
    return this.couponsService.findAll()
  }

  @Post('coupons')
  createCoupon(@Body() body: any) {
    return this.couponsService.create(body)
  }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body)
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.couponsService.delete(id)
  }

  // ─── Banners ─────────────────────────────────────────────────────────────

  @Get('banners')
  getBanners() {
    return this.bannersService.findAll()
  }

  @Post('banners')
  createBanner(@Body() body: any) {
    return this.bannersService.create(body)
  }

  @Patch('banners/:id')
  updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.bannersService.update(id, body)
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.bannersService.delete(id)
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────

  @Get('reviews')
  getReviews(@Query('approved') approved?: string) {
    const filter = approved === 'true' ? true : approved === 'false' ? false : undefined
    return this.reviewsService.findAll(filter)
  }

  @Patch('reviews/:id/approve')
  approveReview(@Param('id') id: string) {
    return this.reviewsService.approve(id)
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.reviewsService.delete(id)
  }
}
