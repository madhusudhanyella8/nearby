import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { normalizePhone, isValidIndianPhone } from "@/lib/phone";
import User from "@/models/User";
import Business from "@/models/Business";
import Permission from "@/models/Permission";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions?.includes("agent_panel")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      ownerName,
      ownerPhone,
      businessName,
      businessDescription,
      businessCategory,
      businessPhone,
      businessAddress,
      businessCity,
      businessArea,
      latitude,
      longitude,
    } = body;

    if (
      !ownerName ||
      !ownerPhone ||
      !businessName ||
      !businessCategory ||
      !businessPhone ||
      !businessAddress ||
      !businessCity ||
      !businessArea
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedOwnerPhone = normalizePhone(ownerPhone);
    if (!isValidIndianPhone(normalizedOwnerPhone)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid 10-digit Indian mobile number for the owner",
        },
        { status: 400 }
      );
    }

    const normalizedBizPhone = normalizePhone(businessPhone);

    await connectDB();

    const bizPerm = await Permission.findOne({ key: "business_panel" });

    // Check if owner phone already exists
    let owner = await User.findOne({ phone: normalizedOwnerPhone }).populate("permissions");

    if (owner) {
      const ownerPermKeys = owner.permissions.map((p: { key: string }) => p.key);
      const hasBusinessPanel = ownerPermKeys.includes("business_panel");
      const hasAdminOrAgent = ownerPermKeys.includes("admin_panel") || ownerPermKeys.includes("agent_panel");

      if (hasBusinessPanel) {
        // Already a business owner — just create the business under them
      } else if (hasAdminOrAgent) {
        return NextResponse.json(
          {
            error: "This phone number belongs to an admin or agent account",
          },
          { status: 409 }
        );
      } else {
        // End user — upgrade by adding business_panel permission
        owner.createdBy =
          session.user.id as unknown as typeof owner.createdBy;
        owner.name = ownerName;

        if (bizPerm && !owner.permissions.some((p: { _id: { toString(): string } }) => p._id.toString() === bizPerm._id.toString())) {
          owner.permissions.push(bizPerm._id);
        }

        await owner.save();
      }
    } else {
      // Create new business owner user
      owner = await User.create({
        name: ownerName,
        phone: normalizedOwnerPhone,
        permissions: bizPerm ? [bizPerm._id] : [],
        createdBy: session.user.id,
      });
    }

    // Create the business
    const business = await Business.create({
      name: businessName,
      description: businessDescription || "",
      category: businessCategory,
      owner: owner._id,
      phone: normalizedBizPhone,
      address: businessAddress,
      city: businessCity.toLowerCase(),
      area: businessArea.toLowerCase(),
      location: {
        type: "Point",
        coordinates: [
          parseFloat(longitude) || 0,
          parseFloat(latitude) || 0,
        ],
      },
    });

    return NextResponse.json(
      {
        message: "Business and owner account created successfully",
        business: { _id: business._id, name: business.name },
        owner: { _id: owner._id, phone: owner.phone },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to register business" },
      { status: 500 }
    );
  }
}
