import { redirect } from "next/navigation";

// Retired — uploading is now an inline mode on "Update text". Kept as a
// redirect for old links.
export default function UploadPage() {
  redirect("/new");
}
