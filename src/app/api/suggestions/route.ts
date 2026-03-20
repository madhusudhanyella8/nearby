import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Business from "@/models/Business";
import Category from "@/models/Category";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q");
    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    await connectDB();

    const regex = new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");

    const [categories, businesses] = await Promise.all([
      Category.find({ name: regex }).limit(4).lean(),
      Business.find({ name: regex, isActive: true })
        .select("name category city area")
        .populate("category", "name slug")
        .limit(4)
        .lean(),
    ]);

    const suggestions = [
      ...categories.map((c) => ({
        type: "category" as const,
        text: c.name,
        slug: c.slug,
      })),
      ...businesses.map((b) => ({
        type: "business" as const,
        text: b.name,
        id: b._id.toString(),
        city: b.city,
        area: b.area,
      })),
    ];

    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
