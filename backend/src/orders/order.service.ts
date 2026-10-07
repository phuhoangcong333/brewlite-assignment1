import { Injectable, NotFoundException } from '@nestjs/common';
import { Size } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  InventoryConcurrencyException,
  OrderTransitionConflictException,
} from '../common/errors';
import { PrismaInventoryRepository } from '../inventory/prisma-inventory.repository';
import {
  InventorySnapshot,
  InventoryUpdate,
  InventoryWant,
} from '../inventory/inventory.plan';
import { planReserve } from '../inventory/inventory.plan';
import { planCancel } from './order-cancel.plan';
import { assertTransition, OrderStatus } from './order-state';

const MAX_CREATE_ATTEMPTS = 3;
const SIZE_PRICE: Record<Size, number> = {
  S: 0,
  M: 5_000,
  L: 10_000,
};
const TOPPING_PRICE = 5_000;
const VALID_TOPPINGS = new Set(['Trân châu', 'Kem']);

export interface CreateOrderItemInput extends InventoryWant {
  size: Size;
  toppings?: string[];
}

class RetryOrderTransactionError extends Error {}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryRepository: PrismaInventoryRepository,
  ) {}

  async createOrder(
    userId: number,
    items: readonly CreateOrderItemInput[],
  ): Promise<{ id: number; status: OrderStatus; total: number }> {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new RangeError('User id must be a positive integer');
    }
    if (items.length === 0) {
      throw new RangeError('An order must contain at least one item');
    }
    for (const item of items) {
      for (const topping of item.toppings ?? []) {
        if (!VALID_TOPPINGS.has(topping)) {
          throw new RangeError(`Unsupported topping: ${topping}`);
        }
      }
    }

    const productIds = [...new Set(items.map(({ productId }) => productId))];

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (transaction) => {
          const products = await transaction.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, price: true, stock: true, version: true },
          });
          const snapshots: InventorySnapshot[] = products.map(
            ({ id, stock, version }) => ({
              productId: id,
              stock,
              version,
            }),
          );
          const updates = planReserve(items, snapshots);

          const applied =
            await this.inventoryRepository.applyUpdatesInTransaction(
              transaction,
              updates,
            );
          if (!applied) {
            throw new RetryOrderTransactionError();
          }

          const productPrices = new Map(
            products.map(({ id, price }) => [id, price]),
          );
          const orderItems = items.map((item) => {
            const productPrice = productPrices.get(item.productId);
            if (productPrice === undefined) {
              throw new RangeError(`Product ${item.productId} was not found`);
            }
            const toppings = item.toppings ?? [];
            const unitPrice =
              productPrice +
              SIZE_PRICE[item.size] +
              TOPPING_PRICE * toppings.length;
            const lineTotal = unitPrice * item.qty;
            if (!Number.isSafeInteger(lineTotal)) {
              throw new RangeError(
                `Line total for product ${item.productId} exceeds the safe integer range`,
              );
            }

            return {
              productId: item.productId,
              size: item.size,
              qty: item.qty,
              toppings,
              lineTotal,
            };
          });
          const total = orderItems.reduce(
            (sum, item) => sum + item.lineTotal,
            0,
          );
          if (!Number.isSafeInteger(total)) {
            throw new RangeError(
              'Order total exceeds the safe integer range',
            );
          }

          const order = await transaction.order.create({
            data: {
              userId,
              total,
              items: { create: orderItems },
            },
            select: { id: true, status: true, total: true },
          });

          return order;
        });
      } catch (error) {
        if (!(error instanceof RetryOrderTransactionError)) {
          throw error;
        }
      }
    }

    throw new InventoryConcurrencyException();
  }

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
