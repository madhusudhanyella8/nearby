import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  description: string;
  category: Types.ObjectId;
  owner: Types.ObjectId;
  phone: string;
  address: string;
  city: string;
  area: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, lowercase: true },
    area: { type: String, required: true, lowercase: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: "2dsphere" });
BusinessSchema.index({ name: "text", description: "text" });
BusinessSchema.index({ city: 1, area: 1 });
BusinessSchema.index({ category: 1 });

export default mongoose.models.Business ||
  mongoose.model<IBusiness>("Business", BusinessSchema);
