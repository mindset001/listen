import { redirect } from "next/navigation";

// Retired — reading display moved to the reader's Display panel, playback
// toggles to its Playback panel, and account/profile/password/delete into
// the sidebar's account menu. Kept as a redirect for old links.
export default function SettingsPage() {
  redirect("/library");
}
