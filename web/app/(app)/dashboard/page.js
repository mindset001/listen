import { redirect } from "next/navigation";

// Retired — Library is now the landing page. Kept as a redirect for old links.
export default function DashboardPage() {
  redirect("/library");
}
