import { AxiosResponse } from "axios";
import http from "./http";
import { CreateUser, UpdateUser, User } from "@/types/user";

export async function getUsers(): Promise<User[]> {
  const response = await http.get<User[]>("/users");
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await http.get<User>(`/users/${id}`);
  return response.data;
}

export async function createUser(createUser: CreateUser): Promise<User> {
  const response = await http.post<CreateUser, AxiosResponse<User>>(
    "/users",
    createUser
  );
  return response.data;
}

export async function updateUser(id: string, updateUser: UpdateUser): Promise<User> {
  const response = await http.patch<UpdateUser, AxiosResponse<User>>(
    `/users/${id}`,
    updateUser
  );
  return response.data;
}
