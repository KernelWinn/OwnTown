import { Module } from '@nestjs/common'
import { ProductsController, AdminProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [StorageModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
