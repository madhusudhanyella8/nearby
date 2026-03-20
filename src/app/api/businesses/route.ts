import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Business from "@/models/Business";
import Category from "@/models/Category";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const area = searchParams.get("area");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const owner = searchParams.get("owner");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { isActive: true };

    // Dashboard: show current user's businesses (including inactive)
    if (owner === "me") {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        filter.owner = session.user.id;
        delete filter.isActive;
      }
    }

    // Admin: view all businesses including inactive
    const all = searchParams.get("all");
    if (all === "true") {
      const session = await getServerSession(authOptions);
      if (session?.user?.role === "admin") {
        delete filter.isActive;
      }
    }

    if (q) {
      filter.$text = { $search: q };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    if (city) filter.city = city.toLowerCase();
    if (area) filter.area = area.toLowerCase();

    let query = Business.find(filter).populate("category").populate("owner", "name");

    if (q) {
      query = query.sort({ score: { $meta: "textScore" } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const [businesses, total] = await Promise.all([
      query.skip(skip).limit(limit),
      Business.countDocuments(filter),
    ]);

    return NextResponse.json({
      businesses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["agent", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, phone, address, city, area, latitude, longitude } = body;

    if (!name || !category || !phone || !address || !city || !area) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const business = await Business.create({
      name,
      description: description || "",
      category,
      owner: session.user.id,
      phone,
      address,
      city: city.toLowerCase(),
      area: area.toLowerCase(),
      location: {
        type: "Point",
        coordinates: [
          parseFloat(longitude) || 0,
          parseFloat(latitude) || 0,
        ],
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
