import { Controller, Post, Body, Get, Query, Headers, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ShippingService } from './shipping.service'

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

  @Post('webhook')
  handleWebhook(
    @Body() payload: any,
    @Headers('x-shiprocket-token') token: string,
  ) {
    const secret = this.config.get('SHIPROCKET_WEBHOOK_SECRET')
    if (secret && token !== secret) {
      throw new UnauthorizedException('Invalid webhook token')
    }
    return this.shippingService.handleWebhook(payload)
  }
}
