import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common'
import { CartService } from './cart.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto'

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** GET /cart */
  @Get()
  get(@CurrentUser() user: any) {
    return this.cartService.get(user.id)
  }

  /** POST /cart/items — add item (merges if exists) */
  @Post('items')
  add(@Body() dto: AddToCartDto, @CurrentUser() user: any) {
    return this.cartService.add(user.id, dto)
  }

  /** PATCH /cart/items — update quantity (0 = remove) */
  @Patch('items')
  update(@Body() dto: UpdateCartItemDto, @CurrentUser() user: any) {
    return this.cartService.update(user.id, dto)
  }

  /** DELETE /cart/items/:productId */
  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  remove(@Param('productId', ParseUUIDPipe) productId: string, @CurrentUser() user: any) {
    return this.cartService.remove(user.id, productId)
  }

  /** DELETE /cart — clear entire cart */
  @Delete()
  @HttpCode(HttpStatus.OK)
  clear(@CurrentUser() user: any) {
    return this.cartService.clear(user.id)
  }
}
