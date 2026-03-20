import mongoose, { Schema, Document } from "mongoose";

export interface IPermission extends Document {
  key: string;
  name: string;
  description: string;
  navLink: { label: string; href: string };
  isSystem: boolean;
  isActive: boolean;
}

const PermissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    navLink: {
      label: { type: String, required: true },
      href: { type: String, required: true },
    },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Permission ||
  mongoose.model<IPermission>("Permission", PermissionSchema);
