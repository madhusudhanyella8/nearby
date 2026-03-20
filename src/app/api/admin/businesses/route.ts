import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const businesses = await Business.find()
      .populate("category")
      .populate("owner", "name phone")
      .sort({ createdAt: -1 });

    return NextResponse.json({ businesses });
  } catch (err) {
    console.error("Admin businesses GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
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

    const business = await Business.findByIdAndDelete(businessId);
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Business deleted permanently" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, isActive } = await req.json();
    if (!businessId || isActive === undefined) {
      return NextResponse.json(
        { error: "businessId and isActive are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    business.isActive = isActive;
    await business.save();

    return NextResponse.json({
      message: isActive ? "Business activated" : "Business deactivated",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}
