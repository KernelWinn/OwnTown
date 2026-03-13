import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, ParseUUIDPipe, ParseIntPipe,
  DefaultValuePipe, HttpCode, HttpStatus, UseGuards, Request,
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { StorageService } from '../storage/storage.service'
import { AdminJwtGuard } from '../admin/admin-jwt.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateStockDto } from './dto/update-stock.dto'
import { CreateVariantDto } from './products.service'
import { IsString, IsIn, IsOptional, IsUUID } from 'class-validator'

class SearchEventDto {
  @IsUUID() productId!: string
  @IsIn(['search_click', 'add_to_cart', 'purchase']) eventType!: 'search_click' | 'add_to_cart' | 'purchase'
  @IsOptional() @IsString() query?: string
}

// ─── Customer routes (/products) ─────────────────────────────────────────────

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('featured') featured?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll({ featured: featured === 'true', limit: limit!, categoryId })
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories()
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('userId') userId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.search(q ?? '', userId, categoryId)
  }

  @Post('search-event')
  @UseGuards(JwtAuthGuard)
  recordEvent(@Body() dto: SearchEventDto, @Request() req: any) {
    return this.productsService.recordSearchEvent(
      dto.productId,
      dto.eventType,
      req.user?.id,
      dto.query,
    )
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id)
  }
}

// ─── Admin routes (/admin/products) ──────────────────────────────────────────
// Note: mounted under /admin in AdminProductsController below
// StorageService is injected here to keep product + image concerns together

@Controller('admin/products')
@UseGuards(AdminJwtGuard)
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  // GET /admin/products
  @Get()
  findAll(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.productsService.findAllAdmin(limit, offset)
  }

  // GET /admin/products/low-stock
  @Get('low-stock')
  findLowStock() {
    return this.productsService.findLowStock()
  }

  // GET /admin/products/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id)
  }

  // POST /admin/products
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  // PUT /admin/products/:id
  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto)
  }

  // DELETE /admin/products/:id  (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id)
  }

  // PATCH /admin/products/:id/stock
  @Patch(':id/stock')
  updateStock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStockDto) {
    return this.productsService.updateStock(id, dto.stockQuantity)
  }

  // ─── Variant routes ───────────────────────────────────────────────────

  // GET /admin/products/:id/variants
  @Get(':id/variants')
  listVariants(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.listVariants(id)
  }

  // POST /admin/products/:id/variants
  @Post(':id/variants')
  createVariant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.createVariant(id, dto)
  }

  // PATCH /admin/products/:id/variants/:variantId
  @Patch(':id/variants/:variantId')
  updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: Partial<CreateVariantDto>,
  ) {
    return this.productsService.updateVariant(id, variantId, dto)
  }

  // DELETE /admin/products/:id/variants/:variantId
  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.OK)
  deleteVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.productsService.deleteVariant(id, variantId)
  }

  // ─── Image upload (S3 presigned URL flow) ─────────────────────────────
  //
  // Flow:
  //  1. Client calls POST /admin/products/upload-url?mime=image/jpeg
  //     → gets { url, key } — presigned S3 PUT URL valid for 5 min
  //  2. Client PUTs image directly to S3 using that url
  //  3. Client calls POST /admin/products/:id/images with { keys: [key] }
  //     → appends public CDN URLs to product.images
  //  4. Client calls DELETE /admin/products/:id/images/:key to remove

  // GET /admin/products/upload-url?mime=image/jpeg
  @Get('upload-url')
  getUploadUrl(@Query('mime') mime: string) {
    return this.storageService.getUploadUrl('products', mime ?? 'image/jpeg')
  }

  // POST /admin/products/:id/images  body: { keys: string[] }
  @Post(':id/images')
  addImages(@Param('id', ParseUUIDPipe) id: string, @Body('keys') keys: string[]) {
    const urls = keys.map(k => this.storageService.getPublicUrl(k))
    return this.productsService.addImages(id, urls)
  }

  // DELETE /admin/products/:id/images  body: { imageUrl: string }
  @Delete(':id/images')
  @HttpCode(HttpStatus.OK)
  async removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    // Extract S3 key from CDN url and delete from S3 too
    const key = this.extractKey(imageUrl)
    if (key) await this.storageService.delete(key)
    return this.productsService.removeImage(id, imageUrl)
  }

  // ─── Category admin routes ─────────────────────────────────────────────

  // GET /admin/products/categories/all
  @Get('categories/all')
  getAllCategories() {
    return this.productsService.getAllCategories()
  }

  // GET /admin/products/categories/upload-url?mime=image/jpeg
  @Get('categories/upload-url')
  getCategoryUploadUrl(@Query('mime') mime: string) {
    return this.storageService.getUploadUrl('categories', mime ?? 'image/jpeg')
  }

  // POST /admin/products/categories
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(dto)
  }

  // PUT /admin/products/categories/:id
  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.productsService.updateCategory(id, dto)
  }

  // DELETE /admin/products/categories/:id  (soft delete)
  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.removeCategory(id)
  }

  private extractKey(url: string): string | null {
    try {
      const { pathname } = new URL(url)
      return pathname.startsWith('/') ? pathname.slice(1) : pathname
    } catch {
      return null
    }
  }
}
