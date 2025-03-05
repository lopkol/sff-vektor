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

-- reader
create table public."reader" (
    id            uuid not null default uuid_generate_v7() primary key,
    moly_username character varying not null,
    moly_url      character varying not null,
    created_at    timestamp with time zone not null default now(),
    updated_at    timestamp with time zone not null default now(),
);

-- user
create table public."user" (
    id              uuid not null default uuid_generate_v7() primary key,
    email_hash      character varying not null,
    email_encrypted character varying not null,
    name            character varying default null,
    role            character varying(255) not null default 'user',
    is_active       boolean not null default true,
    created_at      timestamp with time zone not null default now(),
    updated_at      timestamp with time zone not null default now(),
    reader_id       uuid default null,
    constraint unique_user_email unique (email_hash)
    constraint fk_user_reader_id foreign key (reader_id) references public."reader" (id)
);


-- migrate:down
drop table public."user";
drop table public."reader";
