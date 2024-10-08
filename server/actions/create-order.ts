"use server";

import { createOrderSchema } from "@/types/order-schema";
import { createSafeActionClient } from "next-safe-action";
import { auth } from "../auth";
import { db } from "@/server";
import { orderProduct, orders } from "../schema";
import { revalidatePath } from "next/cache";

const action = createSafeActionClient();

export const createOrder = action
  .schema(createOrderSchema)
  .action(
    async ({ parsedInput: { products, status, total, paymentIntentID } }) => {
      const user = await auth();
      if (!user) return { error: "user not found" };

      const order = await db
        .insert(orders)
        .values({
          status,
          paymentIntentID,
          total,
          userID: user.user.id,
        })
        .returning();
      const orderProducts = products.map(
        async ({ productID, quantity, variantID }) => {
          const newOrderProduct = await db.insert(orderProduct).values({
            quantity,
            orderID: order[0].id,
            productID: productID,
            productVariantID: variantID,
          });
        }
      );

      revalidatePath("/dashboard/orders");
      return { success: "Order has been added" };
    }
  );
