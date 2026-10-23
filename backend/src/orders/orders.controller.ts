import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller(['orders', 'order'])
export class OrdersController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    if (!createOrderDto) {
      throw new BadRequestException('Request body is required');
    }

    const { userId, items } = createOrderDto;

    if (
      typeof userId !== 'number' ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      throw new BadRequestException('userId must be a positive integer');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) {
        throw new BadRequestException(`items[${i}] is invalid`);
      }
      if (
        typeof item.productId !== 'number' ||
        !Number.isSafeInteger(item.productId) ||
        item.productId <= 0
      ) {
        throw new BadRequestException(
          `items[${i}].productId must be a positive integer`,
        );
      }
      if (
        typeof item.qty !== 'number' ||
        !Number.isSafeInteger(item.qty) ||
        item.qty <= 0
      ) {
        throw new BadRequestException(
          `items[${i}].qty must be a positive integer`,
        );
      }
      if (!item.size || !['S', 'M', 'L'].includes(item.size)) {
        throw new BadRequestException(
          `items[${i}].size must be one of: S, M, L`,
        );
      }
      if (item.toppings !== undefined && !Array.isArray(item.toppings)) {
        throw new BadRequestException(
          `items[${i}].toppings must be an array of strings`,
        );
      }
    }

    try {
      return await this.orderService.createOrder(userId, items);
    } catch (error: unknown) {
      if (error instanceof RangeError) {
        throw new BadRequestException(error.message);
      }
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(`User with id ${userId} does not exist`);
      }
      throw error;
    }
  }
}