import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { CouponsService } from './coupons.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(
    @Body() body: { code: string; orderAmount: number },
    @CurrentUser() _user: any,
  ) {
    return this.couponsService.validate(body.code, body.orderAmount)
  }
}
