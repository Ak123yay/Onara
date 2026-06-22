import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardUserOrRedirect } from "@/lib/dashboard/user";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
};

export default async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const dashboardUser = await getDashboardUserOrRedirect("/dashboard");

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
