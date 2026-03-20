import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Permission from "@/models/Permission";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const user = await User.findById(id).populate("permissions");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ permissions: user.permissions });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user permissions" },
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
    if (!session || !session.user.permissions?.includes("admin_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { permissionIds } = await req.json();

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "permissionIds must be an array" },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate all permission IDs exist
    const perms = await Permission.find({ _id: { $in: permissionIds } });
    if (perms.length !== permissionIds.length) {
      return NextResponse.json(
        { error: "One or more invalid permission IDs" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { permissions: permissionIds },
      { new: true }
    ).populate("permissions");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Permissions updated",
      permissions: user.permissions,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
