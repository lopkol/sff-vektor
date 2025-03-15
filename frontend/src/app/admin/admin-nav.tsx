"use client";

import { AppNavbar } from "@/components/app-navbar";
import { Book, Users } from "lucide-react";

export function AdminNav() {
  return (
    <AppNavbar
      rootUrl="/admin"
      rootPages={[
        {
          title: "Admin",
          url: "/admin",
        },
      ]}
      subPages={[
        {
          title: "Users",
          url: "/users",
          icon: Users,
        },
        {
          title: "Candidate list",
          url: "/candidates",
          icon: Book,
        },
      ]}
    />
  );
}
