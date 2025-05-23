import { AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { getTranslations } from "next-intl/server";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const t = await getTranslations("Sidebar");

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
            title: t("books"),
            url: "/admin",
          },
        ]}
        subPages={[]}
      />
      <AppContent>{children}</AppContent>
    </>
  );
}
