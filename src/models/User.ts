import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  phone: string;
  password: string;
  role: "admin" | "agent" | "business_owner" | "user";
  mustChangePassword: boolean;
  createdBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => /^[6-9]\d{9}$/.test(v),
        message: "Phone must be a valid 10-digit Indian mobile number",
      },
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "agent", "business_owner", "user"],
      default: "user",
    },
    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
