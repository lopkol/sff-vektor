import { AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { useTranslations } from "next-intl";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { year: string; genre: string };
}) {
  const { year } = params;
  const t = useTranslations();

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
            title: t("Sidebar.books"),
            url: "/admin",
          },
        ]}
        subPages={[]}
      />
      <AppContent>{children}</AppContent>
    </>
  );
}
