import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('order/:orderId')
  @UseGuards(JwtAuthGuard)
  createForOrder(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() body: { items: Array<{ productId: string; rating: number; comment?: string }> },
  ) {
    return this.reviewsService.createForOrder(user.id, orderId, body.items)
  }

  @Get('order/:orderId/submitted')
  @UseGuards(JwtAuthGuard)
  hasReviewed(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.reviewsService.hasReviewedOrder(user.id, orderId)
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId)
  }
}
