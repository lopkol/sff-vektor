"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser } from "@/services/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDialog } from "./user-dialog";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/page-skeleton";
import { User } from "@/types/user";

export default function UsersPage() {
  const t = useTranslations("Admin.Users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: (user: User) => updateUser(user.id, { isActive: !user.isActive }),
    onSuccess: (user: User) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: user.isActive ? t("toast.activateSuccess") : t("toast.deactivateSuccess"),
        variant: "success",
      });
    },
    onError: (user: User) => {
      toast({
        title: user.isActive ? t("toast.activateError") : t("toast.deactivateError"),
        variant: "destructive",
      });
    },
  });

  const roleLabel = (role: string) => {
    if (role === 'admin') return t('roles.admin');
    if (role === 'user') return t('roles.user');
    return role;
  };

  if (isLoading) {
    return <PageSkeleton/>
  }

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleActiveCheckboxClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    toggleActive(user);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <h1 className="text-2xl font-bold">{t("table.title")}</h1>
          <Button onClick={handleCreateClick}>{t("table.addNew")}</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("props.name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("props.email")}</TableHead>
              <TableHead>{t("props.role")}</TableHead>
              <TableHead>{t("props.active")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(user)}
              >
                <TableCell>{user.name}</TableCell>
                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                <TableCell>{roleLabel(user.role)}</TableCell>
                <TableCell>
                  <div className="px-4 py-3 -mx-3 -my-3 w-fit flex align-middle items-center" onClick={(e) => {
                    handleActiveCheckboxClick(e, user);
                    e.stopPropagation();
                  }}>
                    <Checkbox 
                      checked={user.isActive}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {isDialogOpen && (
        <UserDialog
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
        />
      )}
    </Card>
  );
}
