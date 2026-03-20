import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Request from "@/models/Request";
import User from "@/models/User";
import Permission from "@/models/Permission";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("agent_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, reviewNote } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be approved or rejected" },
        { status: 400 }
      );
    }

    if (!reviewNote || !reviewNote.trim()) {
      return NextResponse.json(
        { error: "A comment is required when approving or rejecting" },
        { status: 400 }
      );
    }

    await connectDB();

    const request = await Request.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { error: "Request already processed" },
        { status: 400 }
      );
    }

    request.status = status;
    request.reviewedBy = session.user.id as unknown as typeof request.reviewedBy;
    request.reviewNote = reviewNote.trim();

    // Handle role_upgrade approval: grant business_panel permission
    if (status === "approved" && request.type === "role_upgrade") {
      const user = await User.findById(request.requestedBy).populate("permissions");
      if (user) {
        const hasBizPanel = user.permissions.some(
          (p: { key: string }) => p.key === "business_panel"
        );
        if (!hasBizPanel) {
          const bizPerm = await Permission.findOne({ key: "business_panel" });
          if (bizPerm) {
            user.permissions.push(bizPerm._id);
            await user.save();
          }
        }
      }
    }

    await request.save();

    return NextResponse.json({
      message: `Request ${status}`,
      request,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
