"use client";

import { usePathname, useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  router.replace(`${pathname}/list`);
  return <></>;
}
