import z from "zod";
import { createSqlTag, type DatabasePoolConnection } from "slonik";
import { decrypt, encrypt, hashEmail } from "@/helpers/crypto.ts";
import {
  isUniqueConstraintError,
  updateFragmentFromProps,
} from "@/helpers/slonik.ts";
import { UniqueConstraintException } from "@/exceptions/unique-constraint.exception.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import { emptyObject } from "@/helpers/type.ts";
export enum UserRole {
  Admin = "admin",
  User = "user",
}

export interface CreateUserProps {
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  molyUsername?: string;
  molyUrl?: string;
}

export interface UserProps extends CreateUserProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const userDb = z.object({
  id: z.string(),
  email_hash: z.string(),
  email_encrypted: z.string(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole),
  is_active: z.boolean(),
  moly_username: z.string().optional(),
  moly_url: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

const sql = createSqlTag({
  typeAliases: {
    void: z.void(),
    user: userDb,
    id: z.object({
      id: z.string(),
    }),
  },
});

const selectUserFragment = sql.fragment`
  select u.*, r.moly_username, r.moly_url
    from "user" u
    left join reader r on u.reader_id = r.id
  `;

/**
 * Create a new user. If reader with moly username exists,
 * link the user to that reader, otherwise create reader too.
 */
export async function createUser(
  connection: DatabasePoolConnection,
  props: CreateUserProps,
): Promise<UserProps> {
  const emailHash = await hashEmail(props.email);
  const emailEncrypted = await encrypt(props.email);

  return connection.transaction<UserProps>(async (trConnection) => {
    try {
      let readerId: string | null = null;
      if (props.molyUsername && props.molyUrl) {
        // deno-fmt-ignore
        const existingReaderResult = await trConnection.query(sql.typeAlias("id")`
          select id from reader where moly_username = ${props.molyUsername};
        `);
        if (existingReaderResult.rowCount > 0) {
          readerId = existingReaderResult.rows[0].id;
          await trConnection.query(sql.typeAlias("void")`
            update reader set moly_url = ${props.molyUrl}, updated_at = now() where id = ${readerId};
          `);
        } else {
          const readerResult = await trConnection.query(sql.typeAlias("id")`
            insert into reader (moly_username, moly_url)
            values (${props.molyUsername}, ${props.molyUrl})
            returning id;
          `);
          readerId = readerResult.rows[0].id;
        }
      }
      // deno-fmt-ignore
      const userResult = await trConnection.query(sql.typeAlias("user")`
        insert into "user" (email_hash, email_encrypted, name, role, is_active, reader_id)
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
        molyUrl: props.molyUrl,
        createdAt: rawUser.created_at,
        updatedAt: rawUser.updated_at,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new UniqueConstraintException(
          "A user with this email already exists",
          { email: props.email },
        );
      }
      throw error;
    }
  });
}

export async function getUserById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<UserProps> {
  const userResult = await connection.query(sql.typeAlias("user")`
    ${selectUserFragment}
    where u.id = ${id};
  `);
  const rawUser = userResult.rows[0];

  if (!rawUser) {
    throw new EntityNotFoundException("User not found", { id });
  }

  return {
    id: rawUser.id,
    email: await decrypt(rawUser.email_encrypted),
    name: rawUser.name,
    role: rawUser.role,
    isActive: rawUser.is_active,
    molyUsername: rawUser.moly_username,
    molyUrl: rawUser.moly_url,
    createdAt: rawUser.created_at,
    updatedAt: rawUser.updated_at,
  };
}

export async function getUserByEmail(
  connection: DatabasePoolConnection,
  email: string,
): Promise<UserProps> {
  const hashedEmail = await hashEmail(email);
  const userResult = await connection.query(sql.typeAlias("user")`
    ${selectUserFragment}
    where u.email_hash = ${hashedEmail};
  `);
  const rawUser = userResult.rows[0];

  if (!rawUser) {
    throw new EntityNotFoundException("User not found", { email });
  }

  return {
    id: rawUser.id,
    email: await decrypt(rawUser.email_encrypted),
    name: rawUser.name,
    role: rawUser.role,
    isActive: rawUser.is_active,
    molyUsername: rawUser.moly_username,
    molyUrl: rawUser.moly_url,
    createdAt: rawUser.created_at,
    updatedAt: rawUser.updated_at,
  };
}

export async function updateUser(
  connection: DatabasePoolConnection,
  id: string,
  props: Partial<CreateUserProps>,
): Promise<UserProps> {
  if (emptyObject(props)) {
    throw new InvalidArgumentException("No properties to update");
  }

  const userPropsToUpdate: Record<string, string | boolean> = {};
  if (props.email) {
    userPropsToUpdate["email_hash"] = await hashEmail(props.email);
    userPropsToUpdate["email_encrypted"] = await encrypt(props.email);
  }
  (["name", "role", "isActive"] satisfies Partial<keyof CreateUserProps>[])
    .forEach((key) => {
      if (props[key] !== undefined) {
        userPropsToUpdate[key] = props[key];
      }
    });

  const readerPropsToUpdate: Record<string, string> = {};
  (["molyUsername", "molyUrl"] satisfies Partial<keyof CreateUserProps>[])
    .forEach((key) => {
      if (props[key] !== undefined) {
        readerPropsToUpdate[key] = props[key];
      }
    });

  return connection.transaction<UserProps>(async (trConnection) => {
    try {
      if (Object.keys(readerPropsToUpdate).length) {
        // if user already has a reader, update it
        const updatedPropsFragment = updateFragmentFromProps(
          readerPropsToUpdate,
        );
        // deno-fmt-ignore
        const readerResult = await trConnection.query(sql.typeAlias("id")`
          update reader
            set ${updatedPropsFragment}, updated_at = ${(new Date()).toISOString()}
          where id = (select reader_id from "user" where id = ${id})
          returning id;
        `);

        // if user doesn't have a reader, create it
        if (!readerResult.rowCount) {
          const readerInsertResult = await trConnection.query(
            sql.typeAlias("id")`
            insert into reader (moly_username, moly_url)
            values (${props.molyUsername || null}, ${props.molyUrl || null})
            returning id;
          `,
          );
          userPropsToUpdate["readerId"] = readerInsertResult.rows[0].id;
        }

        // TODO: handle assigning user to an existing reader (maybe not in same func)
      }

      if (Object.keys(userPropsToUpdate).length) {
        const updatedPropsFragment = updateFragmentFromProps(userPropsToUpdate);
        // deno-fmt-ignore
        const userResult = await trConnection.query(sql.typeAlias("id")`
          update "user"
            set ${updatedPropsFragment}, updated_at = ${(new Date()).toISOString()}
          where id = ${id}
          returning id;
        `);
        if (!userResult.rowCount) {
          throw new EntityNotFoundException("User not found", { id });
        }
      }

      const userResult = await trConnection.query(sql.typeAlias("user")`
        ${selectUserFragment}
        where u.id = ${id};
      `);
      const rawUser = userResult.rows[0];

      return {
        id: rawUser.id,
        email: await decrypt(rawUser.email_encrypted),
        name: rawUser.name,
        role: rawUser.role,
        isActive: rawUser.is_active,
        molyUsername: rawUser.moly_username,
        molyUrl: rawUser.moly_url,
        createdAt: rawUser.created_at,
        updatedAt: rawUser.updated_at,
      };
    } catch (error) {
      if (
        !(error instanceof EntityNotFoundException) &&
        isUniqueConstraintError(error)
      ) {
        throw new UniqueConstraintException(
          "A user with this email already exists",
          { email: props.email },
        );
      }
      throw error;
    }
  });
}
