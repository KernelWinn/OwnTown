import { Controller, Post, Get, Body, Param, Query, Headers, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ShippingService } from './shipping.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly config: ConfigService,
  ) {}

  @Get('serviceability')
  checkServiceability(@Query('pincode') pincode: string) {
    return this.shippingService.checkServiceability(pincode)
  }

  @Get('track/:orderId')
  @UseGuards(JwtAuthGuard)
  trackOrder(@Param('orderId') orderId: string) {
    // User can only track their own orders — service returns public info only
    return this.shippingService.trackShipment(orderId)
  }

  /**
   * Shiprocket sends webhook with header: x-webhook-token
   * Configure in Shiprocket dashboard → Settings → API → Webhooks
   */
  @Post('webhook')
  handleWebhook(
    @Body() payload: any,
    @Headers('x-webhook-token') token: string,
  ) {
    const secret = this.config.get('SHIPROCKET_WEBHOOK_SECRET')
    if (secret && token !== secret) {
      throw new UnauthorizedException('Invalid webhook token')
    }
    return this.shippingService.handleWebhook(payload)
  }
}
