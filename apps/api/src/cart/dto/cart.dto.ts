import { IsUUID, IsInt, Min } from 'class-validator'

export class AddToCartDto {
  @IsUUID()
  productId!: string

  @IsInt()
  @Min(1)
  quantity!: number
}

export class UpdateCartItemDto {
  @IsUUID()
  productId!: string

  @IsInt()
  @Min(0)
  quantity!: number   // 0 = remove
}
