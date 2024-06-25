import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import OrderInput, { orderInputSchema } from "./verify";
import { bookWithQuantity, orderbook } from "./order";

const app = new Hono();
const port: number = 3000;
let tradeId: number = 0;

const getOrderId = (): string =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const getFillAmt = (
  price: number,
  quantity: number,
  side: "buy" | "sell",
): number => {
  let filled: number = 0;
  if (side === "buy")
    orderbook.asks.forEach((o: Ask): void => {
      if (o.price < price) filled += Math.min(quantity, o.quantity);
    });
  else
    orderbook.bids.forEach((o: Bid): void => {
      if (o.price > price) filled += Math.min(quantity, o.quantity);
    });
  return filled;
};

const fillOrder = (
  orderId: string,
  price: number,
  quantity: number,
  side: "buy" | "sell",
  type?: "ioc",
): {
  status: "rejected" | "accepted";
  executedQty: number;
  fills: Fill[];
} => {
  const fills: Fill[] = [];
  const fillQty: number = getFillAmt(price, quantity, side);
  let executedQty: number = 0;

  //if Per stock rate increases for you with time, Reject order
  if (type === "ioc" && fillQty < quantity)
    return {
      status: "rejected",
      executedQty: fillQty,
      fills: [],
    };

  if (side === "buy") {
    orderbook.asks.forEach((o: Ask): void => {
      if (o.price <= price && quantity > 0) {
        console.log("filling ask");
        const filledQuantity = Math.min(quantity, o.quantity);
        console.log(filledQuantity);
        //Making transaction happen
        o.quantity -= filledQuantity;
        bookWithQuantity.asks[o.price] =
          (bookWithQuantity.asks[o.price] || 0) - filledQuantity;
        fills.push({
          price: o.price,
          qty: filledQuantity,
          tradeId: tradeId++,
        });
        executedQty += filledQuantity;
        quantity -= filledQuantity;
        if (o.quantity === 0)
          orderbook.asks.splice(orderbook.asks.indexOf(o), 1);
        if (bookWithQuantity.asks[price] === 0)
          delete bookWithQuantity.asks[price];
      }
    });
  } else {
    orderbook.bids.forEach((o: Bid): void => {
      if (o.price >= price && quantity > 0) {
        const filledQuantity = Math.min(quantity, o.quantity);
        o.quantity -= filledQuantity;
        bookWithQuantity.bids[price] =
          (bookWithQuantity.bids[price] || 0) - filledQuantity;
        fills.push({
          price: o.price,
          qty: filledQuantity,
          tradeId: tradeId++,
        });
        executedQty += filledQuantity;
        quantity -= filledQuantity;
        if (o.quantity === 0)
          orderbook.bids.splice(orderbook.bids.indexOf(o), 1);
        if (bookWithQuantity.bids[price] === 0)
          delete bookWithQuantity.bids[price];
      }
    });

    if (quantity !== 0) {
      orderbook.asks.push({
        price,
        quantity: quantity,
        side: "ask",
        orderId,
      });
      bookWithQuantity.asks[price] =
        (bookWithQuantity.asks[price] || 0) + quantity;
    }
  }
  return {
    status: "accepted",
    executedQty,
    fills,
  };
};

app.post("/api/v1/order", zValidator("json", orderInputSchema), (c) => {
  const validated = c.req.valid("json");
  const orderInput: OrderInput = validated;
  const orderId: string = getOrderId();

  if (orderInput.baseAsset !== "BTC" || orderInput.quoteAsset !== "USD")
    return c.json({ error: "Invalid asset pair" });

  const { executedQty, fills } = fillOrder(
    orderId,
    orderInput.price,
    orderInput.quantity,
    orderInput.side,
    orderInput.kind,
  );

  return c.json({
    orderId,
    executedQty,
    fills,
  });
});

export default {
  port,
  fetch: app.fetch,
};
