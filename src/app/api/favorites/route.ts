import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Favorite from "@/models/Favorite";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const favorites = await Favorite.find({ user: session.user.id })
      .populate({
        path: "business",
        populate: { path: "category" },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ favorites });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "user") {
      return NextResponse.json(
        { error: "Only end users can save favorites" },
        { status: 403 }
      );
    }

    const { businessId } = await req.json();
    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert to prevent duplicates
    const fav = await Favorite.findOneAndUpdate(
      { user: session.user.id, business: businessId },
      { user: session.user.id, business: businessId },
      { upsert: true, new: true }
    );

    return NextResponse.json(fav, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await req.json();
    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    await Favorite.findOneAndDelete({
      user: session.user.id,
      business: businessId,
    });

    return NextResponse.json({ message: "Favorite removed" });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
