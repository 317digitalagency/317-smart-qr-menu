// src/app/(dashboard)/layout.tsx
// Dashboard server layout — wraps the client shell wrapper

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardShellClient from "./DashboardShellClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardShellClient user={session.user}>
      {children}
    </DashboardShellClient>
  );
}
