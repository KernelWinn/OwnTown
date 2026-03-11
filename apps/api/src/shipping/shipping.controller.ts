import { Controller, Post, Body, Get, Query } from '@nestjs/common'
import { ShippingService } from './shipping.service'

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('serviceability')
  checkServiceability(@Query('pincode') pincode: string) {
    return this.shippingService.checkServiceability(pincode)
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.shippingService.handleWebhook(payload)
  }
}
