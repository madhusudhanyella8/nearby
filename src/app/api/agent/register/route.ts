import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Business from "@/models/Business";

function generatePassword(length = 8): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "agent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      ownerName,
      ownerEmail,
      ownerPhone,
      oneTimePassword,
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
      !ownerEmail ||
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

    await connectDB();

    const tempPassword = oneTimePassword || generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Check if owner email already exists
    let owner = await User.findOne({ email: ownerEmail.toLowerCase() });

    if (owner) {
      if (owner.role === "business_owner") {
        // Already a business owner — just create the business under them
      } else if (owner.role === "user") {
        // Upgrade Type4 to Type3
        owner.role = "business_owner";
        owner.password = hashedPassword;
        owner.mustChangePassword = true;
        owner.createdBy = session.user.id as unknown as typeof owner.createdBy;
        owner.name = ownerName;
        if (ownerPhone) owner.phone = ownerPhone;
        await owner.save();
      } else {
        return NextResponse.json(
          { error: "This email belongs to an admin or agent account" },
          { status: 409 }
        );
      }
    } else {
      // Create new Type3 user
      owner = await User.create({
        name: ownerName,
        email: ownerEmail.toLowerCase(),
        phone: ownerPhone || "",
        password: hashedPassword,
        role: "business_owner",
        mustChangePassword: true,
        createdBy: session.user.id,
      });
    }

    // Create the business
    const business = await Business.create({
      name: businessName,
      description: businessDescription || "",
      category: businessCategory,
      owner: owner._id,
      phone: businessPhone,
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
        owner: { _id: owner._id, email: owner.email },
        temporaryPassword: tempPassword,
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
