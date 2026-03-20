import { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      mustChangePassword: boolean;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    mustChangePassword: boolean;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    mustChangePassword: boolean;
    phone?: string;
  }
}

export interface IBusiness {
  _id: string;
  name: string;
  description: string;
  category: { _id: string; name: string; slug: string; icon: string };
  owner: { _id: string; name: string; phone?: string };
  phone: string;
  address: string;
  city: string;
  area: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  photos: { url: string; publicId: string }[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface IRequest {
  _id: string;
  type: "new_business" | "role_upgrade";
  requestedBy: { _id: string; name: string; phone: string };
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
  reviewedBy?: { _id: string; name: string };
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFavorite {
  _id: string;
  user: string;
  business: IBusiness;
  createdAt: string;
}

export interface IUserItem {
  _id: string;
  name: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdBy?: { _id: string; name: string };
  createdAt: string;
}
