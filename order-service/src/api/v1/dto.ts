import { z } from 'zod';

const PersonDtoSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    city: z.string(),
    country: z.string(),
    houseNumber: z.string(),
    streetAddress: z.string(),
    zip: z.string(),
    extensionFields: z.object({}).partial().passthrough(),
  })
  .partial();

const OrderItemDtoSchema = z
  .object({
    itemID: z.string(),
    productID: z.string(),
    quantity: z.number(),
    itemPrice: z.number(),
  })
  .partial();

const OrderDtoSchema = z.object({
  orderID: z.string(),
  orderDate: z.string(),
  soldTo: PersonDtoSchema,
  billTo: PersonDtoSchema,
  shipTo: PersonDtoSchema,
  orderValue: z.number(),
  taxValue: z.number(),
  currencyCode: z.string(),
  items: z.array(OrderItemDtoSchema),
});

const InputOrderDtoSchema = z.object({
  soldToID: z.string(),
  billToID: z.string(),
  shipToID: z.string(),
  orderValue: z.number(),
  taxValue: z.number(),
  currencyCode: z.string(),
  items: z.array(OrderItemDtoSchema),
});

const UpdateOrderDtoSchema = z.object({
  orderValue: z.number(),
  taxValue: z.number(),
  currencyCode: z.string(),
  items: z.array(OrderItemDtoSchema),
});

export const dto = {
  Person: PersonDtoSchema,
  OrderItem: OrderItemDtoSchema,
  Order: OrderDtoSchema,
  InputOrder: InputOrderDtoSchema,
  UpdateOrder: UpdateOrderDtoSchema,
};

export type PersonDto = z.infer<typeof PersonDtoSchema>;
export type OrderItemdDto = z.infer<typeof OrderItemDtoSchema>;
export type OrderDto = z.infer<typeof OrderDtoSchema>;
export type InputOrderDto = z.infer<typeof InputOrderDtoSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderDtoSchema>;
