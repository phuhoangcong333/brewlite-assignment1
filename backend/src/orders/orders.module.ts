import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [AuthModule, InventoryModule, PrismaModule],
  providers: [OrderService],
  exports: [OrderService],
  controllers: [OrdersController],
})
export class OrdersModule { }

import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
