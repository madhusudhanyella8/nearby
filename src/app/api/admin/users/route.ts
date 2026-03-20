import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { normalizePhone, isValidIndianPhone } from "@/lib/phone";
import User from "@/models/User";
import Permission from "@/models/Permission";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const permFilter = new URL(req.url).searchParams.get("permission");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (permFilter) {
      const perm = await Permission.findOne({ key: permFilter });
      if (perm) {
        filter.permissions = perm._id;
      }
    }

    const users = await User.find(filter)
      .populate("createdBy", "name phone")
      .populate("permissions")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch users" },
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

    const { name, phone, permissionKey } = await req.json();

    if (!name || !phone || !permissionKey) {
      return NextResponse.json(
        { error: "Name, phone, and permission are required" },
        { status: 400 }
      );
    }

    if (!["admin_panel", "agent_panel"].includes(permissionKey)) {
      return NextResponse.json(
        { error: "Can only create admin or agent accounts via this route" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidIndianPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ phone: normalizedPhone });
    if (existing) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409 }
      );
    }

    // Find the permission to assign
    const perm = await Permission.findOne({ key: permissionKey });
    if (!perm) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 400 }
      );
    }

    const user = await User.create({
      name,
      phone: normalizedPhone,
      permissions: [perm._id],
      createdBy: session.user.id,
    });

    const label = permissionKey === "admin_panel" ? "Admin" : "Field Agent";

    return NextResponse.json(
      {
        message: `${label} account created`,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
