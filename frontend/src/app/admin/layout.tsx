import { AppContent } from "@/components/app-content";
import { AdminNav } from "./admin-nav";
import { UserRole } from "@/types/user";
import { PageRoleCheck } from "@/components/role-check";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PageRoleCheck role={UserRole.Admin}>
      <AdminNav />
      <AppContent>{children}</AppContent>
    </PageRoleCheck>
  );
}
