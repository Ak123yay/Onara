import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardUserOrRedirect } from "@/lib/dashboard/user";

type HelpLayoutProps = {
  children: React.ReactNode;
};

export default async function HelpLayout({ children }: HelpLayoutProps) {
  const dashboardUser = await getDashboardUserOrRedirect("/help");

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
