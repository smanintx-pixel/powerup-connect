import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/initials-avatar";
import { useAuth } from "@/lib/auth-context";
import { MAX_PHOTO_BYTES } from "@shared/event";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a photo."));
    };
    img.src = url;
  });
}

// Crop to a centred square and shrink it, so every photo is small and the
// same shape before it leaves the phone.
async function toSquareJpeg(file: File): Promise<string> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new Error("That file could not be read as a photo.");
  const sx = (img.naturalWidth - side) / 2;
  // Portraits usually have the face in the upper part, so bias the crop upward.
  const sy = (img.naturalHeight - side) * 0.25;
  for (const [size, quality] of [[400, 0.85], [400, 0.7], [320, 0.7], [240, 0.6]] as const) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not prepare the photo.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const bytes = Math.ceil(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);
    if (bytes <= MAX_PHOTO_BYTES) return dataUrl;
  }
  throw new Error("That photo is too large. Try a different one.");
}

/** Shows the current photo with buttons to upload a new one or remove it. Saves straight away. */
export function PhotoUpload() {
  const { user, authedFetch, setUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "POST" | "DELETE", body?: string) {
    const res = await authedFetch("/api/users/me/photo", { method, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message ?? "Could not update your photo.");
    setUser(data.user);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Choose a photo file.");
      const dataUrl = await toSquareJpeg(file);
      await send("POST", JSON.stringify({ dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your photo.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setError(null);
    setBusy(true);
    try {
      await send("DELETE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove your photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <InitialsAvatar name={user?.name ?? ""} photoUrl={user?.photoUrl} className="h-20 w-20 text-lg shrink-0" testId="avatar-photo-upload" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" data-testid="text-profile-name">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPick}
              aria-label="Choose a profile photo"
              data-testid="input-photo-file"
            />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()} data-testid="button-upload-photo">
              <Camera className="h-4 w-4" />
              {busy ? "Saving..." : user?.photoUrl ? "Change photo" : "Add a photo"}
            </Button>
            {user?.photoUrl && (
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onRemove} data-testid="button-remove-photo">
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-2" role="alert" data-testid="text-photo-error">
          {error}
        </p>
      )}
    </div>
  );
}
