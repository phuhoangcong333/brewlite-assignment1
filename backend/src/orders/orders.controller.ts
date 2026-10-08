import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../auth/jwt.guard';

@Controller('orders')
export class OrdersController {
  @UseGuards(JwtGuard)
  @Get()
  getOrders() {
    return {
      message: 'Bạn đã đăng nhập',
    };
  }
}