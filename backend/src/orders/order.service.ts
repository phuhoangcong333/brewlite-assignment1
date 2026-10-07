import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InventoryConcurrencyException,
  OrderTransitionConflictException,
} from '../common/errors';
import { PrismaInventoryRepository } from '../inventory/prisma-inventory.repository';
import {
  InventorySnapshot,
  InventoryUpdate,
} from '../inventory/inventory.plan';
import { planCancel } from './order-cancel.plan';
import { assertTransition, OrderStatus } from './order-state';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryRepository: PrismaInventoryRepository,
  ) {}

  async transitionOrder(orderId: number, to: OrderStatus): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          items: { select: { productId: true, qty: true } },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} was not found`);
      }

      const from = order.status as OrderStatus;
      assertTransition(from, to);

      let releaseUpdates: InventoryUpdate[] = [];
      if (to === 'CANCELLED') {
        const productIds = [
          ...new Set(order.items.map(({ productId }) => productId)),
        ];
        const products = await transaction.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true, version: true },
        });
        const current: InventorySnapshot[] = products.map(
          ({ id, stock, version }) => ({
            productId: id,
            stock,
            version,
          }),
        );
        releaseUpdates = planCancel(from, order.items, current);
      }

      const changed = await transaction.order.updateMany({
        where: { id: orderId, status: from },
        data: { status: to },
      });

      if (changed.count !== 1) {
        throw new OrderTransitionConflictException(orderId);
      }

      if (
        releaseUpdates.length > 0 &&
        !(await this.inventoryRepository.applyUpdatesInTransaction(
          transaction,
          releaseUpdates,
        ))
      ) {
        throw new InventoryConcurrencyException();
      }
    });
  }
}
