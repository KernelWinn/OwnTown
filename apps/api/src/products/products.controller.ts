import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ProductsService } from './products.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('featured') featured?: string, @Query('limit') limit?: string) {
    return this.productsService.findAll({ featured: featured === 'true', limit: Number(limit) || 20 })
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories()
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.productsService.search(q)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }
}
