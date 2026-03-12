import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common'
import { AddressesService } from './addresses.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { CreateAddressDto } from './dto/create-address.dto'
import { UpdateAddressDto } from './dto/update-address.dto'

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /** GET /addresses — list all addresses for the authenticated user */
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.addressesService.findAll(user.id)
  }

  /** GET /addresses/:id */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.addressesService.findOne(id, user.id)
  }

  /** POST /addresses */
  @Post()
  create(@Body() dto: CreateAddressDto, @CurrentUser() user: any) {
    return this.addressesService.create(user.id, dto)
  }

  /** PUT /addresses/:id */
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: any,
  ) {
    return this.addressesService.update(id, user.id, dto)
  }

  /** PATCH /addresses/:id/default — set as default address */
  @Patch(':id/default')
  setDefault(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.addressesService.setDefault(id, user.id)
  }

  /** DELETE /addresses/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.addressesService.remove(id, user.id)
  }
}
