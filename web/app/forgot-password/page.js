import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Reset your password — listen" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
