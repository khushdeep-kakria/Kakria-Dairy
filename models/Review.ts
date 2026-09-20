import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  name: string;
  rating: number;
  comment: string;
  photo?: string;
  status: 'pending' | 'approved' | 'hidden';
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    photo: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'approved',
      index: true,
    },
    ip: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ status: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
