import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Request from "@/models/Request";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const statusFilter = new URL(req.url).searchParams.get("status");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (["agent", "admin"].includes(session.user.role)) {
      // Agents and admins see all requests (optionally filtered by status)
      if (statusFilter) filter.status = statusFilter;
    } else {
      // Business owners and users see only their own requests
      filter.requestedBy = session.user.id;
      if (statusFilter) filter.status = statusFilter;
    }

    const requests = await Request.find(filter)
      .populate("requestedBy", "name phone")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body;

    await connectDB();

    if (type === "new_business") {
      if (session.user.role !== "business_owner") {
        return NextResponse.json(
          { error: "Only business owners can request new business registration" },
          { status: 403 }
        );
      }

      const { businessDetails } = body;
      if (
        !businessDetails?.name ||
        !businessDetails?.phone ||
        !businessDetails?.address ||
        !businessDetails?.city ||
        !businessDetails?.area
      ) {
        return NextResponse.json(
          { error: "Missing business details" },
          { status: 400 }
        );
      }

      const request = await Request.create({
        type: "new_business",
        requestedBy: session.user.id,
        businessDetails,
      });

      return NextResponse.json(request, { status: 201 });
    }

    if (type === "role_upgrade") {
      if (session.user.role !== "user") {
        return NextResponse.json(
          { error: "Only end users can request a role upgrade" },
          { status: 403 }
        );
      }

      const { upgradeReason } = body;

      const request = await Request.create({
        type: "role_upgrade",
        requestedBy: session.user.id,
        upgradeReason: upgradeReason || "",
      });

      return NextResponse.json(request, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
