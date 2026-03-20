import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFavorite extends Document {
  user: Types.ObjectId;
  business: Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ user: 1, business: 1 }, { unique: true });
FavoriteSchema.index({ user: 1 });

export default mongoose.models.Favorite ||
  mongoose.model<IFavorite>("Favorite", FavoriteSchema);
