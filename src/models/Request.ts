import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequest extends Document {
  type: "new_business" | "role_upgrade";
  requestedBy: Types.ObjectId;
  businessDetails?: {
    name: string;
    description: string;
    category: string;
    phone: string;
    address: string;
    city: string;
    area: string;
    latitude?: number;
    longitude?: number;
  };
  upgradeReason?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    type: {
      type: String,
      enum: ["new_business", "role_upgrade"],
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessDetails: {
      name: String,
      description: String,
      category: String,
      phone: String,
      address: String,
      city: { type: String, lowercase: true },
      area: { type: String, lowercase: true },
      latitude: Number,
      longitude: Number,
    },
    upgradeReason: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: String,
  },
  { timestamps: true }
);

RequestSchema.index({ requestedBy: 1, status: 1 });
RequestSchema.index({ status: 1, type: 1 });

export default mongoose.models.Request ||
  mongoose.model<IRequest>("Request", RequestSchema);
