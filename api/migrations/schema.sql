SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid_generate_v7(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.uuid_generate_v7() RETURNS uuid
    LANGUAGE plpgsql
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: author; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.author (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    "displayName" character varying(1024) NOT NULL,
    "sortName" character varying(1024) NOT NULL,
    url character varying(2048) DEFAULT NULL::character varying,
    "isApproved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    "molyId" character varying(256) DEFAULT NULL::character varying,
    title character varying(1024) NOT NULL,
    year integer NOT NULL,
    genre character varying(256),
    series character varying(1024),
    "seriesNumber" character varying(256),
    "isApproved" boolean DEFAULT false NOT NULL,
    "isPending" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book_alternative; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_alternative (
    "bookId" uuid NOT NULL,
    name character varying(256) NOT NULL,
    urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book_author; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_author (
    "bookId" uuid NOT NULL,
    "authorId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_list (
    year integer NOT NULL,
    genre character varying(256) NOT NULL,
    url character varying(2048) NOT NULL,
    "pendingUrl" character varying(2048),
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book_list_reader; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_list_reader (
    "bookListYear" integer NOT NULL,
    "bookListGenre" character varying(256) NOT NULL,
    "readerId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reader; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reader (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    "molyUsername" character varying(1024) DEFAULT NULL::character varying,
    "molyUrl" character varying(2048) DEFAULT NULL::character varying,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reading_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_plan (
    "readerId" uuid NOT NULL,
    "bookId" uuid NOT NULL,
    status character varying(255) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid DEFAULT public.uuid_generate_v7() NOT NULL,
    "emailHash" character varying(1024) NOT NULL,
    "emailEncrypted" character varying(1024) NOT NULL,
    name character varying(1024) DEFAULT NULL::character varying,
    role character varying(256) DEFAULT 'user'::character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "readerId" uuid
);


--
-- Name: author author_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.author
    ADD CONSTRAINT author_pkey PRIMARY KEY (id);


--
-- Name: book_alternative book_alternative_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_alternative
    ADD CONSTRAINT book_alternative_pkey PRIMARY KEY ("bookId", name);


--
-- Name: book_author book_author_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_author
    ADD CONSTRAINT book_author_pkey PRIMARY KEY ("bookId", "authorId");


--
-- Name: book_list book_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_list
    ADD CONSTRAINT book_list_pkey PRIMARY KEY (year, genre);


--
-- Name: book_list_reader book_list_reader_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_list_reader
    ADD CONSTRAINT book_list_reader_pkey PRIMARY KEY ("bookListYear", "bookListGenre", "readerId");


--
-- Name: book book_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book
    ADD CONSTRAINT book_pkey PRIMARY KEY (id);


--
-- Name: reader reader_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reader
    ADD CONSTRAINT reader_pkey PRIMARY KEY (id);


--
-- Name: reading_plan reading_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan
    ADD CONSTRAINT reading_plan_pkey PRIMARY KEY ("readerId", "bookId");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: user unique_user_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT unique_user_email UNIQUE ("emailHash");


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: book_list_reader_reader_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX book_list_reader_reader_id_idx ON public.book_list_reader USING btree ("readerId");


--
-- Name: book_alternative book_alternative_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_alternative
    ADD CONSTRAINT "book_alternative_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.book(id) ON DELETE CASCADE;


--
-- Name: book_author book_author_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_author
    ADD CONSTRAINT "book_author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.author(id) ON DELETE CASCADE;


--
-- Name: book_author book_author_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_author
    ADD CONSTRAINT "book_author_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.book(id) ON DELETE CASCADE;


--
-- Name: book_list_reader book_list_reader_bookListYear_bookListGenre_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_list_reader
    ADD CONSTRAINT "book_list_reader_bookListYear_bookListGenre_fkey" FOREIGN KEY ("bookListYear", "bookListGenre") REFERENCES public.book_list(year, genre) ON DELETE CASCADE;


--
-- Name: book_list_reader book_list_reader_readerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_list_reader
    ADD CONSTRAINT "book_list_reader_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES public.reader(id) ON DELETE CASCADE;


--
-- Name: reading_plan reading_plan_bookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan
    ADD CONSTRAINT "reading_plan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public.book(id) ON DELETE CASCADE;


--
-- Name: reading_plan reading_plan_readerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_plan
    ADD CONSTRAINT "reading_plan_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES public.reader(id) ON DELETE CASCADE;


--
-- Name: user user_readerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "user_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES public.reader(id);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250305105329'),
    ('20250313125409');
