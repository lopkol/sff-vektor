import { PageRoleCheck } from "@/components/role-check";
import { UserRole } from "@/types/user";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PageRoleCheck role={UserRole.Admin}>{children}</PageRoleCheck>;
}
