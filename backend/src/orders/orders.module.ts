import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderService } from './order.service';

@Module({
  imports: [InventoryModule, PrismaModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
