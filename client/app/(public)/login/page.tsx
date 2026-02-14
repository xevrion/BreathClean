import type { Metadata } from "next";

import LoginBackground from "@/components/login/LoginBackground";
import LoginCard from "@/components/login/LoginCard";
import LoginFooter from "@/components/login/LoginFooter";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to BreatheClean to access health-first route planning with real-time air quality data.",
};

export default function Login() {
  return (
    <div className="font-outfit relative flex min-h-screen items-center justify-center overflow-hidden bg-[#E8E9DC] p-4">
      <LoginBackground />
      <LoginCard />
      <LoginFooter />
    </div>
  );
}
