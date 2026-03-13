import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseUUIDPipe,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common'
import { AdminJwtGuard } from '../admin/admin-jwt.guard'
import { ProcurementService } from './procurement.service'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { CreatePoDto } from './dto/create-po.dto'
import { UpdatePoStatusDto } from './dto/update-po-status.dto'
import { CreateGrnDto } from './dto/create-grn.dto'

@Controller('admin/procurement')
@UseGuards(AdminJwtGuard)
export class ProcurementController {
  constructor(private readonly svc: ProcurementService) {}

  // ─── Suppliers ────────────────────────────────────────────────────────────

  @Get('suppliers')
  listSuppliers() { return this.svc.listSuppliers() }

  @Get('suppliers/:id')
  getSupplier(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getSupplier(id)
  }

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.svc.createSupplier(dto)
  }

  @Put('suppliers/:id')
  updateSupplier(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateSupplierDto) {
    return this.svc.updateSupplier(id, dto)
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  removeSupplier(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.removeSupplier(id)
  }

  // ─── Purchase Orders ──────────────────────────────────────────────────────

  @Get('purchase-orders')
  listPos() { return this.svc.listPurchaseOrders() }

  @Get('purchase-orders/:id')
  getPo(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getPurchaseOrder(id)
  }

  @Post('purchase-orders')
  createPo(@Body() dto: CreatePoDto, @Request() req: any) {
    return this.svc.createPurchaseOrder(dto, req.user?.id)
  }

  @Put('purchase-orders/:id/status')
  updatePoStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePoStatusDto,
    ) {
    return this.svc.updatePoStatus(id, dto)
  }

  @Delete('purchase-orders/:id')
  @HttpCode(HttpStatus.OK)
  deletePo(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deletePurchaseOrder(id)
  }

  // ─── GRNs ─────────────────────────────────────────────────────────────────

  @Get('grns')
  listGrns(@Query('purchaseOrderId') poId?: string) {
    return this.svc.listGrns(poId)
  }

  @Get('grns/:id')
  getGrn(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getGrn(id)
  }

  @Post('grns')
  createGrn(@Body() dto: CreateGrnDto, @Request() req: any) {
    return this.svc.createGrn(dto, req.user?.id)
  }
}
