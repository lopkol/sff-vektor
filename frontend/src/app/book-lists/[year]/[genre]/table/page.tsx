"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table } from "lucide-react";
import { useBookList } from "../book-list-provider";

export default function Page() {
  const { genreName } = useBookList();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table />
          {genreName} table
        </CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint
          cillum sint consectetur cupidatat.
        </p>
      </CardContent>
    </Card>
  );
}
