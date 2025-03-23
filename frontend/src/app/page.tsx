import { AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <>
      <AppNavbar
        rootUrl="/"
        rootPages={[
          {
            title: t("home"),
            url: "/admin",
          },
        ]}
        subPages={[]}
      />
      <AppContent>
        <Card
          my={"7"}
          variant="classic"
          size={"4"}
          style={{ borderRadius: "0" }}
        >
          <Container py={"6"}>
            <Flex direction={"column"}>
              <Heading as="h1" mb={"4"} size={"7"}>
                {t("title")}
              </Heading>
              <Text as="p" size={"4"}>
                {t("content")}
              </Text>
              <Box mt={"6"}>
                <Button size={"3"}>{t("button")}</Button>
              </Box>
            </Flex>
          </Container>
        </Card>
      </AppContent>
    </>
  );
}
