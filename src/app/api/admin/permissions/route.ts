import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Permission from "@/models/Permission";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const permissions = await Permission.find({ key: { $ne: "favorites_panel" } }).sort({ key: 1 });
    return NextResponse.json({ permissions });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, name, description, navLink } = await req.json();

    if (!key || !name || !navLink?.label || !navLink?.href) {
      return NextResponse.json(
        { error: "key, name, and navLink (label, href) are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Permission.findOne({ key });
    if (existing) {
      return NextResponse.json(
        { error: "Permission key already exists" },
        { status: 409 }
      );
    }

    const permission = await Permission.create({
      key,
      name,
      description: description || "",
      navLink,
      isSystem: false,
      isActive: true,
    });

    return NextResponse.json({ permission }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}
