-- migrate:up

-- UUID v7 implementation
-- From https://gist.github.com/kjmph/5bd772b2c2df145aa645b837da7eca74
create or replace function uuid_generate_v7()
returns uuid
as $$
begin
  -- use random v4 uuid as starting point (which has the same variant we need)
  -- then overlay timestamp
  -- then set version 7 by flipping the 2 and 1 bit in the version 4 string
  return encode(
    set_bit(
      set_bit(
        overlay(uuid_send(gen_random_uuid())
                placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
                from 1 for 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex')::uuid;
end
$$ language plpgsql volatile;

create table if not exists "reader" (
    "id"           uuid                     not null default uuid_generate_v7() primary key,
    "molyUsername" varchar(1024)            default null,
    "molyUrl"      varchar(2048)            default null,
    "createdAt"    timestamp with time zone not null default now(),
    "updatedAt"    timestamp with time zone not null default now()
);

create table if not exists "user" (
    "id"              uuid                     not null default uuid_generate_v7() primary key,
    "emailHash"       varchar(1024)            not null,
    "emailEncrypted"  varchar(1024)            not null,
    "name"            varchar(1024)            default null,
    "role"            varchar(256)             not null default 'user',
    "isActive"        boolean                  not null default true,
    "createdAt"       timestamp with time zone not null default now(),
    "updatedAt"       timestamp with time zone not null default now(),
    "readerId"        uuid                     default null references "reader" (id),
    constraint unique_user_email unique ("emailHash")
);


-- migrate:down
drop table "user";
drop table "reader";
