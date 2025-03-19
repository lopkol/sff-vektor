import http from "./http";

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  molyUsername: string | null;
  molyUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAuthMe(token?: string) {
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
