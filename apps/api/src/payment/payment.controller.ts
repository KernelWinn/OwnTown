import { Controller, Post, Body, Headers, RawBodyRequest, Req, UseGuards, HttpCode } from '@nestjs/common'
import { Request } from 'express'
import { PaymentService } from './payment.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  createRazorpayOrder(@Body() body: { orderId: string; amount: number }) {
    return this.paymentService.createRazorpayOrder(body.orderId, body.amount)
  }

  @Post('verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  verifyPayment(@Body() body: any, @CurrentUser() user: any) {
    return this.paymentService.verifyPayment(body, user.id)
  }

  @Post('webhook')
  handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') sig: string) {
    return this.paymentService.handleWebhook(req.rawBody!, sig)
  }
}
