import http from "./http";
import { User } from "@/types/user";

export async function getAuthMe(token?: string): Promise<User> {
  const { data } = await http.get<User>(
    "/auth/me",
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined
  );
  return data;
}
