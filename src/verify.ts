import { ZodEnum, ZodNumber, ZodObject, ZodOptional, ZodString, z } from "zod";

export const orderInputSchema: ZodObject<{
  baseAsset: ZodString;
  quoteAsset: ZodString;
  price: ZodNumber;
  quantity: ZodNumber;
  side: ZodEnum<["buy", "sell"]>;
  type: ZodEnum<["limit", "market"]>;
  kind: ZodOptional<ZodEnum<["ioc"]>>;
}> = z.object({
  baseAsset: z.string(),
  quoteAsset: z.string(),
  price: z.number(),
  quantity: z.number(),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["limit", "market"]),
  kind: z.enum(["ioc"]).optional(),
});

type OrderInput = z.infer<typeof orderInputSchema>;

export default OrderInput;
