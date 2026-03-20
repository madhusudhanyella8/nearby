import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Business from "@/models/Business";
import Category from "@/models/Category";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const maxDistance = parseInt(searchParams.get("maxDistance") || "5000");
    const category = searchParams.get("category");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng are required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      },
      isActive: true,
    };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    const businesses = await Business.find(filter)
      .populate("category")
      .populate("owner", "name")
      .limit(50);

    return NextResponse.json({ businesses, total: businesses.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch nearby businesses" },
      { status: 500 }
    );
  }
}
