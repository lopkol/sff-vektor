-- migrate:up
alter table "book_list"
    add column "archivedAt" timestamp with time zone default null;

-- migrate:down
alter table "book_list"
    drop column "archivedAt";
