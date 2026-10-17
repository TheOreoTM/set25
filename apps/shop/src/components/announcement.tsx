import { connection } from "next/server";
import { getStoreSettings } from "@/lib/settings";

export async function Announcement() {
  await connection();
  const settings = await getStoreSettings();
  const message = settings.storeOpen
    ? settings.announcement
    : "Online ordering is temporarily unavailable. You can still browse the collection.";
  if (!message) return null;
  return (
    <div className="announcement" role="status">
      <p>{message}</p>
    </div>
  );
}
