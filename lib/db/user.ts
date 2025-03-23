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
import {
  type CreateUser,
  type UpdateUser,
  type User,
  userSchema,
} from "@/schema/user.ts";

const userDbSchema = userSchema.omit({
  email: true,
}).extend({
  emailHash: z.string(),
  emailEncrypted: z.string(),
});

const userWithoutReaderDbSchema = userDbSchema.omit({
  molyUsername: true,
  molyUrl: true,
});

const sql = createSqlTag({
  typeAliases: {
    user: userDbSchema,
    userWithoutReader: userWithoutReaderDbSchema,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
  },
});

const selectUserFragment = sql.fragment`
  select u.*, r."molyUsername", r."molyUrl"
    from "user" u
    left join "reader" r on u."readerId" = r."id"
  `;

/**
 * Create a new user. If reader with moly username exists,
 * link the user to that reader, otherwise create reader too.
 */
export async function createUser(
  connection: DatabasePoolConnection,
  props: CreateUser,
): Promise<User> {
  const emailHash = await hashEmail(props.email);
  const emailEncrypted = await encrypt(props.email);

  return connection.transaction<User>(async (trConnection) => {
    try {
      let readerId: string | null = null;
      if (props.molyUsername && props.molyUrl) {
        // deno-fmt-ignore
        const existingReaderResult = await trConnection.query(sql.typeAlias("id")`
          select "id" from "reader" where "molyUsername" = ${props.molyUsername};
        `);
        if (existingReaderResult.rowCount > 0) {
          readerId = existingReaderResult.rows[0].id;
          await trConnection.query(sql.typeAlias("void")`
            update "reader" set "molyUrl" = ${props.molyUrl}, "updatedAt" = now() where "id" = ${readerId};
          `);
        } else {
          const readerResult = await trConnection.query(sql.typeAlias("id")`
            insert into "reader" ("molyUsername", "molyUrl")
            values (${props.molyUsername}, ${props.molyUrl})
            returning "id";
          `);
          readerId = readerResult.rows[0].id;
        }
      }
      // deno-fmt-ignore
      const userResult = await trConnection.query(sql.typeAlias("userWithoutReader")`
        insert into "user" ("emailHash", "emailEncrypted", "name", "role", "isActive", "readerId")
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
        readerId: rawUser.readerId,
        molyUsername: props.molyUsername,
        molyUrl: props.molyUrl,
        createdAt: rawUser.createdAt,
        updatedAt: rawUser.updatedAt,
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
): Promise<User> {
  const userResult = await connection.query(sql.typeAlias("user")`
    ${selectUserFragment}
    where u."id" = ${id};
  `);
  const rawUser = userResult.rows[0];

  if (!rawUser) {
    throw new EntityNotFoundException("User not found", { id });
  }

  return {
    id: rawUser.id,
    email: await decrypt(rawUser.emailEncrypted),
    name: rawUser.name,
    role: rawUser.role,
    isActive: rawUser.isActive,
    readerId: rawUser.readerId,
    molyUsername: rawUser.molyUsername,
    molyUrl: rawUser.molyUrl,
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt,
  };
}

export async function userWithEmailExists(
  connection: DatabasePoolConnection,
  email: string,
): Promise<boolean> {
  const hashedEmail = await hashEmail(email);
  const userResult = await connection.query(sql.typeAlias("id")`
    SELECT id FROM "user"
    where "emailHash" = ${hashedEmail};
  `);
  const rawUser = userResult.rows[0];
  return !!rawUser;
}

export async function getUserByEmail(
  connection: DatabasePoolConnection,
  email: string,
): Promise<User> {
  const hashedEmail = await hashEmail(email);
  const userResult = await connection.query(sql.typeAlias("user")`
    ${selectUserFragment}
    where u."emailHash" = ${hashedEmail};
  `);
  const rawUser = userResult.rows[0];

  if (!rawUser) {
    throw new EntityNotFoundException("User not found", { email });
  }

  return {
    id: rawUser.id,
    email: await decrypt(rawUser.emailEncrypted),
    name: rawUser.name,
    role: rawUser.role,
    isActive: rawUser.isActive,
    readerId: rawUser.readerId,
    molyUsername: rawUser.molyUsername,
    molyUrl: rawUser.molyUrl,
    createdAt: rawUser.createdAt,
    updatedAt: rawUser.updatedAt,
  };
}

export async function updateUser(
  connection: DatabasePoolConnection,
  id: string,
  props: UpdateUser,
): Promise<User> {
  if (emptyObject(props)) {
    throw new InvalidArgumentException("No properties to update");
  }

  const userPropsToUpdate: Record<string, string | boolean | null> = {};
  if (props.email) {
    userPropsToUpdate["emailHash"] = await hashEmail(props.email);
    userPropsToUpdate["emailEncrypted"] = await encrypt(props.email);
  }
  (
    ["name", "role", "isActive"] satisfies Partial<keyof UpdateUser>[]
  ).forEach((key) => {
    if (props[key] !== undefined) {
      userPropsToUpdate[key] = props[key];
    }
  });

  const readerPropsToUpdate: Record<string, string | null> = {};
  (
    ["molyUsername", "molyUrl"] satisfies Partial<keyof UpdateUser>[]
  ).forEach((key) => {
    if (props[key] !== undefined) {
      readerPropsToUpdate[key] = props[key];
    }
  });

  return connection.transaction<User>(async (trConnection) => {
    try {
      if (Object.keys(readerPropsToUpdate).length) {
        // if user already has a reader, update it
        const updatedPropsFragment = updateFragmentFromProps(
          readerPropsToUpdate,
        );
        // deno-fmt-ignore
        const readerResult = await trConnection.query(sql.typeAlias("id")`
          update reader
            set ${updatedPropsFragment}, "updatedAt" = now()
          where "id" = (select "readerId" from "user" where "user"."id" = ${id})
          returning "id";
        `);

        // if user doesn't have a reader, create it
        if (!readerResult.rowCount) {
          const readerInsertResult = await trConnection.query(
            sql.typeAlias("id")`
            insert into reader ("molyUsername", "molyUrl")
            values (${props.molyUsername || null}, ${props.molyUrl || null})
            returning "id";
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
            set ${updatedPropsFragment}, "updatedAt" = now()
          where "id" = ${id}
          returning "id";
        `);
        if (!userResult.rowCount) {
          throw new EntityNotFoundException("User not found", { id });
        }
      }

      const userResult = await trConnection.query(sql.typeAlias("user")`
        ${selectUserFragment}
        where u."id" = ${id};
      `);
      const rawUser = userResult.rows[0];

      return {
        id: rawUser.id,
        email: await decrypt(rawUser.emailEncrypted),
        name: rawUser.name,
        role: rawUser.role,
        isActive: rawUser.isActive,
        readerId: rawUser.readerId,
        molyUsername: rawUser.molyUsername,
        molyUrl: rawUser.molyUrl,
        createdAt: rawUser.createdAt,
        updatedAt: rawUser.updatedAt,
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
