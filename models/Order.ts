import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus =
  | 'pending_payment'
  | 'verification_pending'
  | 'paid'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export interface IOrderItem {
  productId: string;
  name_en: string;
  name_pa?: string;
  size: 'full' | 'half';
  sizeLabel_en: string;
  sizeLabel_pa?: string;
  unitPrice: number;
  quantity: number;
  price: number;
  image: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  houseStreet?: string;
  areaMohalla?: string;
  landmark?: string;
  city?: string;
  state?: string;
  deliveryAddress: string;
  pincode?: string;
  orderNotes?: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  screenshotUrl?: string;
  paymentMethod: string;
  verifiedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    altPhone: { type: String, trim: true, default: '' },
    houseStreet: { type: String, trim: true, default: '' },
    areaMohalla: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: 'Kotkapura' },
    state: { type: String, trim: true, default: 'Punjab' },
    deliveryAddress: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true, default: '' },
    orderNotes: { type: String, trim: true, default: '' },
    items: [
      {
        productId: { type: String, required: true },
        name_en: { type: String, required: true },
        name_pa: { type: String, default: '' },
        size: { type: String, enum: ['full', 'half'], required: true },
        sizeLabel_en: { type: String, required: true },
        sizeLabel_pa: { type: String, default: '' },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'verification_pending',
        'paid',
        'preparing',
        'out_for_delivery',
        'delivered',
        'rejected',
        'cancelled',
      ],
      default: 'pending_payment',
      index: true,
    },
    screenshotUrl: {
      type: String,
      default: '',
    },
    paymentMethod: { type: String, default: 'UPI QR' },
    verifiedAt: { type: Date },
    rejectedReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
