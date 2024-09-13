import mongoose, { Document, Schema } from 'mongoose';

export interface OrderPerson extends Document {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  country?: string;
  extensionFields?: object;
}

export interface OrderItem extends Document {
  itemID: string;
  productID: string;
  quantity: number;
  itemPrice: number;
}

const OrderPersonSchema: Schema = new Schema<OrderPerson>(
  {
    firstName: { type: String },
    lastName: { type: String },
    streetAddress: { type: String },
    houseNumber: { type: String },
    zip: { type: String },
    city: { type: String },
    country: { type: String },
    extensionFields: { type: Schema.Types.Mixed },
  },
  { id: false },
);

const OrderItemSchema: Schema = new Schema<OrderItem>(
  {
    itemID: { type: String },
    productID: { type: String },
    quantity: { type: Number },
    itemPrice: { type: Number },
  },
  { id: false },
);

export interface Order extends Document {
  soldTo: OrderPerson;
  billTo: OrderPerson;
  shipTo: OrderPerson;
  orderValue: number;
  taxValue?: number;
  currencyCode?: string;
  items: OrderItem[];
}

const OrderSchema: Schema = new Schema<Order>(
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

const Order = mongoose.model<Order>('Order', OrderSchema);
export default Order;
