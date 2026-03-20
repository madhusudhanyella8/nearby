import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { normalizePhone, isValidIndianPhone } from "@/lib/phone";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const role = new URL(req.url).searchParams.get("role");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .populate("createdBy", "name phone")
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
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, password, role } = await req.json();

    if (!name || !phone || !password || !role) {
      return NextResponse.json(
        { error: "Name, phone, password, and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "agent"].includes(role)) {
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

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      phone: normalizedPhone,
      password: hashed,
      role,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        message: `${role} account created`,
        user: { _id: user._id, name: user.name, phone: user.phone, role: user.role },
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
