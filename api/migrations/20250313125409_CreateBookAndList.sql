-- migrate:up
create table if not exists "book" (
    "id"           uuid                     not null default uuid_generate_v7() primary key,
    "title"        varchar(1024)            not null,
    "year"         integer                  not null,
    "genre"        varchar(256),
    "series"       varchar(1024),
    "seriesNumber" varchar(256),
    "isApproved"   boolean                  not null default false,
    "isPending"    boolean                  not null default true,
    "createdAt"    timestamp with time zone not null default now(),
    "updatedAt"    timestamp with time zone not null default now()
);

create table if not exists "book_alternative" (
    "bookId"     uuid                     not null references "book"("id") on delete cascade,
    "name"       varchar(256)             not null,
    "urls"       jsonb                    not null default '[]'::jsonb,
    "createdAt"  timestamp with time zone not null default now(),
    primary key ("bookId", "name")
);

create table if not exists "reading_plan" (
    "readerId"   uuid                     not null references "reader"("id") on delete cascade,
    "bookId"     uuid                     not null references "book"("id") on delete cascade, 
    "status"     varchar(255)             not null,
    "createdAt"  timestamp with time zone not null default now(),
    "updatedAt"  timestamp with time zone not null default now(),
    primary key("readerId", "bookId")
);

create table if not exists "book_list" (
    "year"       integer                  not null,
    "genre"      varchar(256)             not null,
    "url"        varchar(2048)            not null,
    "pendingUrl" varchar(2048),
    "createdAt"  timestamp with time zone not null default now(),
    "updatedAt"  timestamp with time zone not null default now(),
    primary key("year", "genre")
);

create table if not exists "author" (
    "id"          uuid                     not null default uuid_generate_v7() primary key,
    "displayName" varchar(1024)            not null,
    "sortName"    varchar(1024)            not null,
    "url"         varchar(2048)            default null,
    "isApproved"  boolean                  not null default false,
    "createdAt"   timestamp with time zone not null default now(),
    "updatedAt"   timestamp with time zone not null default now()
);

create table if not exists "book_author" (
    "bookId"    uuid                     not null references "book"("id") on delete cascade,
    "authorId"  uuid                     not null references "author"("id") on delete cascade,
    "createdAt" timestamp with time zone not null default now(),
    primary key("bookId", "authorId")
);

create table if not exists "book_list_reader" (
    "bookListYear"  integer                  not null,
    "bookListGenre" varchar(256)             not null,
    "readerId"      uuid                     not null references "reader"("id") on delete cascade,
    "createdAt"     timestamp with time zone not null default now(),
    primary key("bookListYear", "bookListGenre", "readerId"),
    foreign key("bookListYear", "bookListGenre") references "book_list"("year", "genre") on delete cascade
);

create index "book_list_reader_reader_id_idx" on "book_list_reader"("readerId");

-- migrate:down
drop table if exists "book_list_reader";
drop table if exists "book_author";
drop table if exists "author";
drop table if exists "book_list";
drop table if exists "reading_plan";
drop table if exists "book_alternative";
drop table if exists "book";


