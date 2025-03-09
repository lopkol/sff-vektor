import { AppNavbar } from "@/components/app-navbar";
import { AppContent } from "@/components/app-content";

export default async function Page({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;

  return (
    <>
      <AppNavbar
        rootPages={[
          {
            title: year,
            url: "#",
          },
          {
            title: "Fantasy",
            url: `/book-lists/${year}/fantasy`,
          },
        ]}
        subPages={[
          {
            title: "List",
            url: "/list",
          },
          {
            title: "My read",
            url: "/my-read",
          },
          {
            title: "Table",
            url: "/table",
          },
          {
            title: "Settings",
            url: "/settings",
          },
        ]}
      />
      <AppContent>{children}</AppContent>
    </>
  );
}
