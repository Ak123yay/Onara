import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardUserOrRedirect } from "@/lib/dashboard/user";

type AccountLayoutProps = {
  children: React.ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const dashboardUser = await getDashboardUserOrRedirect("/account");

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
