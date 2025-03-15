import { AppContent } from "@/components/app-content";
import { AdminNav } from "./admin-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <AppContent>{children}</AppContent>
    </>
  );
}
