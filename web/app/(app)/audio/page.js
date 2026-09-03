import { redirect } from "next/navigation";

// Retired — Saved audio is now the "Audio" filter chip on Library. Kept as
// a redirect for old links.
export default function AudioPage() {
  redirect("/library");
}
