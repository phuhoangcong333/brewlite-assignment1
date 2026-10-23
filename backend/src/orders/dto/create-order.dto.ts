import { Size } from '@prisma/client';

export class CreateOrderItemDto {
  productId: number;
  qty: number;
  size: Size;
  toppings?: string[];
}

export class CreateOrderDto {
  userId: number;
  items: CreateOrderItemDto[];
}
