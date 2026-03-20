import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Business from "@/models/Business";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE_MB = 3;

// POST: Upload photos (base64 JSON body)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Access: owner, agent, or admin
    const isOwner = business.owner.toString() === session.user.id;
    const isStaff = session.user.permissions?.includes("agent_panel") || session.user.permissions?.includes("admin_panel");
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { images } = await req.json();
    // images: array of { dataUri: string, mimeType: string }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const currentCount = business.photos?.length || 0;
    if (currentCount + images.length > 5) {
      return NextResponse.json(
        { error: `Can upload at most ${5 - currentCount} more photo(s). Max 5 total.` },
        { status: 400 }
      );
    }

    // Validate each image
    for (const img of images) {
      if (!img.dataUri || !img.mimeType) {
        return NextResponse.json({ error: "Each image must have dataUri and mimeType" }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(img.mimeType)) {
        return NextResponse.json(
          { error: `Invalid image type: ${img.mimeType}. Allowed: JPEG, PNG, WebP` },
          { status: 400 }
        );
      }
      // Rough base64 size check (~3MB = ~4MB base64)
      const sizeInBytes = (img.dataUri.length * 3) / 4;
      if (sizeInBytes > MAX_SIZE_MB * 1024 * 1024 * 1.4) {
        return NextResponse.json(
          { error: `Image exceeds ${MAX_SIZE_MB}MB limit` },
          { status: 400 }
        );
      }
    }

    // Upload to Cloudinary
    const uploaded = [];
    for (const img of images) {
      const result = await uploadImage(img.dataUri, `vipani/businesses/${id}`);
      uploaded.push(result);
    }

    business.photos.push(...uploaded);
    await business.save();

    return NextResponse.json({ photos: business.photos });
  } catch (err) {
    console.error("Photo upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload photos" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a single photo by publicId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    await connectDB();

    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.owner.toString() === session.user.id;
    const isStaff = session.user.permissions?.includes("agent_panel") || session.user.permissions?.includes("admin_panel");
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from Cloudinary
    await deleteImage(publicId);

    // Remove from business document
    business.photos = business.photos.filter(
      (p: { publicId: string }) => p.publicId !== publicId
    );
    await business.save();

    return NextResponse.json({ photos: business.photos });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
