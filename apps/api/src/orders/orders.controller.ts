import { Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { CreateOrderDto } from './dto/create-order.dto'

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.ordersService.findByUser(user.id)
  }

  @Get('slots')
  getAvailableSlots() {
    return this.ordersService.getAvailableSlots()
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(user.id, dto)
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user.id)
  }

  /** PATCH /orders/:id/cancel */
  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.ordersService.cancel(id, user.id)
  }
}
