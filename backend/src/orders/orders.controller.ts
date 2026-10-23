import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

type AuthenticatedRequest = Request & {
  user: { id: number; email: string };
};

@Controller(['orders', 'order'])
export class OrdersController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!createOrderDto) {
      throw new BadRequestException('Request body is required');
    }

    const { items } = createOrderDto;

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
      return await this.orderService.createOrder(
        request.user.id,
        items,
        createOrderDto.promoCode,
      );
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
        throw new BadRequestException(
          `User with id ${request.user.id} does not exist`,
        );
      }
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async listMyOrders(@Req() request: AuthenticatedRequest) {
    return this.orderService.listOrders(request.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.orderService.transitionOrder(
      orderId,
      'CANCELLED',
      request.user.id,
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.orderService.transitionOrder(
      orderId,
      dto.status,
      request.user.id,
    );
  }
}