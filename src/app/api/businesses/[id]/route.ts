import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const business = await Business.findById(id)
      .populate("category")
      .populate("owner", "name email");

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.owner.toString() === session.user.id;
    const isAgentOrAdmin = ["agent", "admin"].includes(session.user.role);
    if (!isOwner && !isAgentOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, category, phone, address, city, area, latitude, longitude } = body;

    if (name) business.name = name;
    if (description !== undefined) business.description = description;
    if (category) business.category = category;
    if (phone) business.phone = phone;
    if (address) business.address = address;
    if (city) business.city = city.toLowerCase();
    if (area) business.area = area.toLowerCase();
    if (latitude && longitude) {
      business.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    await business.save();
    return NextResponse.json(business);
  } catch {
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.owner.toString() === session.user.id;
    const isAgentOrAdmin = ["agent", "admin"].includes(session.user.role);
    if (!isOwner && !isAgentOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    business.isActive = false;
    await business.save();
    return NextResponse.json({ message: "Business deactivated" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
