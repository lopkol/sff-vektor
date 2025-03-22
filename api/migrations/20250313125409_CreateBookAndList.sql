-- migrate:up
create table if not exists "book" (
    "id"            uuid                     not null default uuid_generate_v7() primary key,
    "title"         varchar(1024)            not null,
    "year"          integer                  not null,
    "genre"         varchar(256),
    "series"        varchar(1024),
    "series_number" varchar(256),
    "is_approved"   boolean                  not null default false,
    "is_pending"    boolean                  not null default true,
    "created_at"    timestamp with time zone not null default now(),
    "updated_at"    timestamp with time zone not null default now()
);

create table if not exists "book_alternative" (
    "book_id"    uuid                     not null references "book"("id") on delete cascade,
    "name"       varchar(256)             not null,
    "urls"       jsonb                    not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    primary key (book_id, name)
);

create table if not exists "reading_plan" (
    "reader_id"  uuid                     not null references "reader"("id") on delete cascade,
    "book_id"    uuid                     not null references "book"("id") on delete cascade, 
    "status"     varchar(255)             not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    primary key(reader_id, book_id)
);

create table if not exists "book_list" (
    "year"        integer                  not null,
    "genre"       varchar(256)             not null,
    "url"         varchar(2048)            not null,
    "pending_url" varchar(2048),
    "created_at"  timestamp with time zone not null default now(),
    "updated_at"  timestamp with time zone not null default now(),
    primary key("year", "genre")
);

create table if not exists "author" (
    "id"           uuid                     not null default uuid_generate_v7() primary key,
    "display_name" varchar(1024)            not null,
    "sort_name"    varchar(1024)            not null,
    "is_approved"  boolean                  not null default false,
    "created_at"   timestamp with time zone not null default now(),
    "updated_at"   timestamp with time zone not null default now()
);

create table if not exists "book_author" (
    "book_id"    uuid                     not null references "book"("id") on delete cascade,
    "author_id"  uuid                     not null references "author"("id") on delete cascade,
    "created_at" timestamp with time zone not null default now(),
    primary key(book_id, author_id)
);

create table if not exists "book_list_reader" (
    "book_list_year"  integer                  not null,
    "book_list_genre" varchar(256)             not null,
    "reader_id"       uuid                     not null references "reader"("id") on delete cascade,
    "created_at"      timestamp with time zone not null default now(),
    primary key(book_list_year, book_list_genre, reader_id),
    foreign key(book_list_year, book_list_genre) references "book_list"("year", "genre") on delete cascade
);

create index "book_list_reader_reader_id_idx" on "book_list_reader"("reader_id");

-- migrate:down
drop table if exists "book_list_reader";
drop table if exists "book_author";
drop table if exists "author";
drop table if exists "book_list";
drop table if exists "reading_plan";
drop table if exists "book_alternative";
drop table if exists "book";


