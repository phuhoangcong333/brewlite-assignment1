import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [InventoryModule, PrismaModule],
  providers: [OrderService],
  exports: [OrderService],
  controllers: [OrdersController],
})
export class OrdersModule { }
