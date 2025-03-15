import { AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { year: string; genre: string };
}) {
  const { year } = params;

  return (
    <>
      <AppNavbar
        rootUrl="/books"
        rootPages={[
          {
            title: year,
            url: "#",
          },
          {
            title: "Books",
            url: "/admin",
          },
        ]}
        subPages={[]}
      />
      <AppContent>{children}</AppContent>
    </>
  );
}
