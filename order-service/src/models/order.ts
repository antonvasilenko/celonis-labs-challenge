import mongoose, { Schema, Types, Document } from 'mongoose';

export interface OrderPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  country?: string;
  extensionFields?: Record<string, unknown>;
}

export interface OrderItem {
  itemID: string;
  productID: string;
  quantity: number;
  itemPrice: number;
}

export interface Order extends Document<Types.ObjectId> {
  soldTo: OrderPerson;
  billTo: OrderPerson;
  shipTo: OrderPerson;
  orderValue: number;
  taxValue: number;
  currencyCode: string;
  items: OrderItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

const OrderPersonSchema: Schema = new Schema<OrderPerson>(
  {
    id: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    streetAddress: { type: String },
    houseNumber: { type: String },
    zip: { type: String },
    city: { type: String },
    country: { type: String },
    extensionFields: { type: Schema.Types.Mixed },
  },
  { _id: false, id: true },
);

const OrderItemSchema: Schema = new Schema<OrderItem>(
  {
    itemID: { type: String },
    productID: { type: String },
    quantity: { type: Number },
    itemPrice: { type: Number },
  },
  { _id: false, id: false },
);

export type OrderDocument = Order & { _id: mongoose.Types.ObjectId };

const OrderSchema = new Schema<Order>(
  {
    soldTo: { type: OrderPersonSchema },
    billTo: { type: OrderPersonSchema },
    shipTo: { type: OrderPersonSchema },
    orderValue: { type: Number },
    taxValue: { type: Number },
    currencyCode: { type: String },
    items: [OrderItemSchema],
  },
  { timestamps: true },
);

// add indices for fields soldTo.id, billTo.id, shipTo.id, skill null values
OrderSchema.index({ 'soldTo.personId': 1 });
OrderSchema.index({ 'billTo.personId': 1 });
OrderSchema.index({ 'shipTo.personId': 1 });

const Order = mongoose.model<Order>('Order', OrderSchema, 'orders');
export default Order;
