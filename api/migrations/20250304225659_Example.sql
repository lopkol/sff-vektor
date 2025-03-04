-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
$$
language plpgsql
volatile;

-- User
CREATE TABLE public."user" (
    id         UUID NOT NULL DEFAULT uuid_generate_v7() PRIMARY KEY,
    urn        character varying(255) NOT NULL GENERATED ALWAYS AS ('urn:auth:user:id:' || id) STORED,
    email      character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name  character varying NOT NULL,
    -- time_zone  time_zone_id NOT NULL,
    time_zone  character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_urn UNIQUE (urn),
    CONSTRAINT unique_user_email UNIQUE (email)
);
CREATE UNIQUE INDEX user_urn_idx ON public."user" USING btree (urn);
-- Group
CREATE TABLE public."group" (
    id               UUID NOT NULL DEFAULT uuid_generate_v7() PRIMARY KEY,
    owner_urn        character varying(255) NOT NULL,
    name             character varying NOT NULL,
    total_spent      bigint NOT NULL DEFAULT 0,
    -- default_currency currency_iso NOT NULL,
    default_currency character varying(3) NOT NULL,
    created_at       timestamp with time zone NOT NULL DEFAULT now(),
    updated_at       timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX group_owner_urn_idx ON public."group" USING btree (owner_urn);
COMMENT ON COLUMN public."group".owner_urn IS 'The user URN of the group owner';
-- GroupMember
CREATE TABLE public.group_member (
    id          UUID NOT NULL DEFAULT uuid_generate_v7() PRIMARY KEY,
    name        character varying NOT NULL,
    user_urn    character varying(255) NOT NULL,
    ratio       integer NOT NULL DEFAULT 100,
    group_id    UUID NOT NULL,
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT  fk_group_member_group FOREIGN KEY (group_id) REFERENCES "group" (id)
);
CREATE UNIQUE INDEX group_member_unique_by_user_idx ON public."group_member" USING btree (user_urn, group_id);
-- Transaction
CREATE TYPE public.transaction_type AS ENUM (
    'expense',
    'transfer'
);
CREATE TABLE public."transaction" (
    id                UUID NOT NULL DEFAULT uuid_generate_v7() PRIMARY KEY,
    name              character varying NOT NULL,
    transaction_type  public.transaction_type NOT NULL,
    amount            integer NOT NULL,
    -- currency         currency_iso NOT NULL,
    currency          character varying(3) NOT NULL,
    paid_at           timestamp NOT NULL DEFAULT now(),
    -- paid_at_timezone time_zone_id NOT NULL,
    paid_at_timezone  character varying(50) NOT NULL,
    group_id          UUID NOT NULL,
    created_at        timestamp with time zone NOT NULL DEFAULT now(),
    updated_at        timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT        fk_transaction_group FOREIGN KEY (group_id) REFERENCES "group" (id)
);
-- TransactionBalance
CREATE TABLE public.transaction_balance (
    group_member_id       UUID NOT NULL,
    transaction_id  UUID NOT NULL,
    ratio           integer NOT NULL,
    spent_amount    integer NOT NULL,
    used_amount     integer NOT NULL,
    created_at      timestamp with time zone NOT NULL DEFAULT now(),
    updated_at      timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY     (group_member_id, transaction_id),
    CONSTRAINT      fk_transaction_balance_group_member FOREIGN KEY (group_member_id) REFERENCES group_member (id),
    CONSTRAINT      fk_transaction_balance_transaction FOREIGN KEY (transaction_id) REFERENCES "transaction" (id)
);

-- migrate:down
DROP TABLE public.transaction_balance;
DROP TABLE public.transaction;
DROP TABLE public.group_member;
DROP TABLE public."group";
DROP TABLE public."user";
DROP TYPE public.transaction_type;

