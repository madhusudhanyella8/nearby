"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface Photo {
  url: string;
  publicId: string;
}

interface PhotoUploaderProps {
  businessId: string;
  photos: Photo[];
  onUpdate: (photos: Photo[]) => void;
}

export default function PhotoUploader({
  businessId,
  photos,
  onUpdate,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = 5 - photos.length;

  async function handleFiles(files: FileList) {
    setError("");

    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) return;

    // Client-side validation
    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed (JPEG, PNG, WebP)");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setError(`${file.name} exceeds 3MB limit`);
        return;
      }
    }

    setUploading(true);

    // Convert to base64
    const images = await Promise.all(
      selected.map(
        (file) =>
          new Promise<{ dataUri: string; mimeType: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                dataUri: reader.result as string,
                mimeType: file.type,
              });
            reader.readAsDataURL(file);
          })
      )
    );

    try {
      const res = await fetch(`/api/businesses/${businessId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.photos);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed. Please try again.");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(publicId: string) {
    setDeleting(publicId);
    setError("");
    try {
      const res = await fetch(`/api/businesses/${businessId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data.photos);
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Delete failed. Please try again.");
    }
    setDeleting(null);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Photos ({photos.length}/5)
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
        {photos.map((photo) => (
          <div key={photo.publicId} className="relative group aspect-square">
            <Image
              src={photo.url}
              alt="Business photo"
              fill
              className="object-cover rounded-lg"
              sizes="120px"
            />
            <button
              onClick={() => handleDelete(photo.publicId)}
              disabled={deleting === photo.publicId}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
            >
              {deleting === photo.publicId ? "..." : "X"}
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <span className="text-2xl">+</span>
                <span className="text-xs">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-gray-400">
        Max 5 photos. JPEG, PNG, or WebP. Up to 3MB each.
      </p>
    </div>
  );
}
