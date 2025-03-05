import z from "zod";
import { type DatabasePoolConnection, createSqlTag } from "slonik";
import { encrypt, decrypt, hashEmail } from "@/helpers/crypto.ts";

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export interface CreateUserProps {
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  molyUsername?: string;
  molyUrn?: string;
}

export interface UserProps extends CreateUserProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export const userDb = z.object({
  id: z.string(),
  email_hash: z.string(),
  email_encrypted: z.string(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole),
  is_active: z.boolean(),
  moly_username: z.string().optional(),
  moly_urn: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

const sql = createSqlTag({
  typeAliases: {
    user: userDb,
    id: z.object({
      id: z.string(),
    }),
  },
});

export async function createUser(connection: DatabasePoolConnection, props: CreateUserProps): Promise<UserProps> {
  const emailHash = await hashEmail(props.email);
  const emailEncrypted = await encrypt(props.email);

  let readerId: string | null = null;
  if (props.molyUsername || props.molyUrn) {
    const readerResult = await connection.query(sql.typeAlias('id')`
      insert into reader (moly_username, moly_urn)
      values (${props.molyUsername || null}, ${props.molyUrn || null})
      returning id;
    `);
    readerId = readerResult.rows[0].id;
  }
  const userResult = await connection.query(sql.typeAlias('user')`
    insert into user (email_hash, email_encrypted, name, role, is_active, reader_id)
    values (${emailHash}, ${emailEncrypted}, ${props.name || null}, ${props.role}, ${props.isActive}, ${readerId})
    returning *;
  `);
  const rawUser = userResult.rows[0];
  return {
    id: rawUser.id,
    email: props.email,
    name: props.name,
    role: props.role,
    isActive: props.isActive,
    molyUsername: props.molyUsername,
    molyUrn: props.molyUrn,
    createdAt: rawUser.created_at,
    updatedAt: rawUser.updated_at,
  };
}

export async function getUserByEmail(connection: DatabasePoolConnection, email: string): Promise<UserProps> {
  const hashedEmail = await hashEmail(email);
  const userResult = await connection.query(sql.typeAlias("user")`
    select u.*, r.moly_username, r.moly_urn
      from user u 
      join reader r on u.reader_id = r.id
     where u.email_hash = ${hashedEmail};
  `);
  const rawUser = userResult.rows[0];

  return {
    id: rawUser.id,
    email: await decrypt(rawUser.email_encrypted),
    name: rawUser.name,
    role: rawUser.role,
    isActive: rawUser.is_active,
    molyUsername: rawUser.moly_username,
    molyUrn: rawUser.moly_urn,
    createdAt: rawUser.created_at,
    updatedAt: rawUser.updated_at,
  };
}


