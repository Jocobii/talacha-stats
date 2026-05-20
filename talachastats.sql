--
-- PostgreSQL database dump
--

\restrict cVrpH78AXkb30me0isVpIoWv3300uXjk3PFxdb4rIyiHZXVvhzN9sykWLrVdCpC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

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
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
begin
    if not exists (
        select 1
        from pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: f_unaccent(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.f_unaccent(text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
    SET search_path TO 'public', 'extensions', 'pg_catalog'
    AS $_$
BEGIN
  RETURN unaccent($1);
END;
$_$;


ALTER FUNCTION public.f_unaccent(text) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    hash text NOT NULL,
    created_at bigint,
    id uuid
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: import_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    league_id uuid NOT NULL,
    imported_by uuid,
    import_type text NOT NULL,
    jornada integer,
    rows_processed integer DEFAULT 0 NOT NULL,
    rows_created integer DEFAULT 0 NOT NULL,
    anomaly_summary jsonb,
    warnings text[],
    imported_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.import_audit_log OWNER TO postgres;

--
-- Name: import_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    header_row integer DEFAULT 0 NOT NULL,
    column_map text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.import_templates OWNER TO postgres;

--
-- Name: leagues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leagues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    day_of_week text NOT NULL,
    season text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    city text DEFAULT 'Tijuana'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    organization_id uuid,
    slug text,
    category text
);


ALTER TABLE public.leagues OWNER TO postgres;

--
-- Name: match_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    legacy_player_id uuid NOT NULL,
    team_id uuid NOT NULL,
    event_type text NOT NULL,
    minute integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    player_profile_id uuid
);


ALTER TABLE public.match_events OWNER TO postgres;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    league_id uuid NOT NULL,
    home_team_id uuid NOT NULL,
    away_team_id uuid NOT NULL,
    match_date date NOT NULL,
    matchday integer,
    status text DEFAULT 'scheduled'::text NOT NULL,
    home_score integer DEFAULT 0 NOT NULL,
    away_score integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    city text DEFAULT 'Tijuana'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'trial'::text NOT NULL,
    verification_requested_at timestamp with time zone
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: page_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id uuid NOT NULL,
    page text NOT NULL,
    visited_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.page_views OWNER TO postgres;

--
-- Name: player_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.player_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    full_name text NOT NULL,
    alias text,
    normalized_name text NOT NULL,
    fingerprint text NOT NULL,
    claimed_player_id uuid,
    claim_status text DEFAULT 'unclaimed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_claim_status CHECK ((claim_status = ANY (ARRAY['unclaimed'::text, 'proposed'::text, 'verified'::text, 'rejected'::text])))
);


ALTER TABLE public.player_profiles OWNER TO postgres;

--
-- Name: player_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.player_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    legacy_player_id uuid NOT NULL,
    team_id uuid NOT NULL,
    league_id uuid NOT NULL,
    jersey_number integer,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    player_profile_id uuid
);


ALTER TABLE public.player_registrations OWNER TO postgres;

--
-- Name: player_season_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.player_season_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    legacy_player_id uuid NOT NULL,
    league_id uuid NOT NULL,
    team_id uuid,
    matches_played integer DEFAULT 0 NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    yellow_cards integer DEFAULT 0 NOT NULL,
    red_cards integer DEFAULT 0 NOT NULL,
    jornada integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    player_profile_id uuid
);


ALTER TABLE public.player_season_stats OWNER TO postgres;

--
-- Name: players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    alias text,
    phone text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.players OWNER TO postgres;

--
-- Name: player_global_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.player_global_stats AS
 SELECT players.id,
    players.full_name,
    players.alias,
    (count(DISTINCT player_profiles.organization_id))::integer AS organizations_count,
    (count(DISTINCT player_registrations.league_id))::integer AS leagues_count,
    (COALESCE(sum(player_season_stats.goals), (0)::bigint))::integer AS total_goals,
    (COALESCE(sum(player_season_stats.assists), (0)::bigint))::integer AS total_assists,
    (COALESCE(sum(player_season_stats.matches_played), (0)::bigint))::integer AS total_matches_played,
    (COALESCE(sum(player_season_stats.yellow_cards), (0)::bigint))::integer AS total_yellow_cards,
    (COALESCE(sum(player_season_stats.red_cards), (0)::bigint))::integer AS total_red_cards,
    max(player_season_stats.updated_at) AS last_updated_at
   FROM (((public.players
     JOIN public.player_profiles ON (((player_profiles.claimed_player_id = players.id) AND (player_profiles.claim_status = 'verified'::text))))
     LEFT JOIN public.player_registrations ON ((player_registrations.player_profile_id = player_profiles.id)))
     LEFT JOIN public.player_season_stats ON ((player_season_stats.player_profile_id = player_profiles.id)))
  GROUP BY players.id, players.full_name, players.alias;


ALTER VIEW public.player_global_stats OWNER TO postgres;

--
-- Name: player_season_stats_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.player_season_stats_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    player_id uuid,
    league_id uuid NOT NULL,
    team_id uuid,
    jornada integer NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    yellow_cards integer DEFAULT 0 NOT NULL,
    red_cards integer DEFAULT 0 NOT NULL,
    matches_played integer DEFAULT 0 NOT NULL,
    imported_at timestamp with time zone DEFAULT now() NOT NULL,
    player_profile_id uuid
);


ALTER TABLE public.player_season_stats_snapshot OWNER TO postgres;

--
-- Name: team_standings_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_standings_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    league_id uuid NOT NULL,
    jornada integer NOT NULL,
    played integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    draws integer DEFAULT 0 NOT NULL,
    losses integer DEFAULT 0 NOT NULL,
    goals_for integer DEFAULT 0 NOT NULL,
    goals_against integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    zone text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.team_standings_snapshot OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    league_id uuid NOT NULL,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'organizer'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid,
    email_verified boolean DEFAULT false NOT NULL,
    email_verification_token text,
    email_verification_expires_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (hash, created_at, id) FROM stdin;
3da4bc223f8f2df9a3f58fd31aee103b56a391780553b2099f4f2c840173bc46	1776304123958	\N
2205066e22489392537473c12941e8c66ac2ac88f70f1dc040435724045c2eed	1776563459333	\N
d5cdd68b063bad1205c5cf7dc3d9177528f3be52459c5a61b807e009fba2ab83	1776731949486	\N
4350a41fe06abdbe3373575ec9fef47d7b1744b738eb45aad81f7b1eb8cc759a	1776822000000	\N
7c0527b2f3caa6acaec3efeccababec89d7e2389456a8d6aa4d56ac0d9fec456	1776823000000	\N
052973188cad65441f9cfb79fe9f2b5b163467b4a1b4e464e2984b77d63628c2	1776824000000	\N
563d69d8c175169b1fbd2500916e1784a2ed77ee9c1e56c02298a8610a31ded8	1776900000000	\N
b895284175dac3a3653c386db6c4bde2fceb7095c5542a76b9c75a2e5f0bd9aa	1777428492140	\N
0020536bde8e0e678e65bd253db727bd270d41edc108d28a7885e52bbd1270a6	1777445092445	\N
1b264b9c9f8b41839ebd3f6ffc6be97a311719dfb31ac1d891da0ef9c1ab7ff1	1777500000000	\N
5ff15ddf1de1ddbbb1854431b0c3492faa9e1e5272d88b10d3ad8669bd667450	1777585291433	\N
1bcc3aece9b749292aa5d8e254a8262694292667b5e1e76d987c39790bff030b	1777605295507	\N
c4d4a733747f8b78f4b204add9a6c2d810e73f424e410f69d9811bd1c558123b	1776304123958	\N
fb5dad4ddceecb85054ae3d378edf1f789f18c1858e0b2052e0518f1eb7fd71c	1776731949486	\N
d4ab2d9ad5d40c10a95452c0e8ba3e1e9cd3c7a70898808a2e8dc3d14f030e0e	1776822000000	\N
cde699be37794052bfcc4a502bafc3c8033d96338772280083f52554a6996232	1776900000000	\N
9b6a1125c60d524c2ca7a380b483c54507789a040402fd865d445df052744f4d	1777605295507	\N
d0b35bfb985f7ffa89e308e5b7626ba60e491c4777577656af3f9f017ae03056	1777780337332	\N
e6b7238c21d50e9da33961e2d57d4acfc1f28124ffb83b6344b22e3bffac10b3	1778615372388	\N
\.


--
-- Data for Name: import_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_audit_log (id, league_id, imported_by, import_type, jornada, rows_processed, rows_created, anomaly_summary, warnings, imported_at) FROM stdin;
\.


--
-- Data for Name: import_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_templates (id, name, type, header_row, column_map, created_at) FROM stdin;
\.


--
-- Data for Name: leagues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leagues (id, name, day_of_week, season, created_at, city, status, organization_id, slug, category) FROM stdin;
7039a7b9-c837-4b9d-af24-137423e2ee33	Liga Femenil	sabado	Apertura 2026	2026-04-30 00:14:42.523498+00	Tijuana	active	2c416a3a-db98-42fc-827b-e9c0c26b7a59	liga-femenil-sabado	\N
e01fb0a1-597a-4d82-be66-741d84549ddb	Liga Femenil	viernes	Apertura 2026	2026-04-30 19:23:01.927125+00	Tijuana	active	2c416a3a-db98-42fc-827b-e9c0c26b7a59	liga-femenil-viernes	\N
960ea712-fda0-4902-b02f-6897890b34f6	Mi Liga	lunes	2025	2026-05-01 00:09:15.131718+00	Tijuana	active	2c416a3a-db98-42fc-827b-e9c0c26b7a59	mi-liga-lunes	\N
2f421880-fb44-482f-8030-b4e11def2192	Viernes	viernes	2026	2026-05-01 21:23:04.806938+00	Tijuana	active	80bd1d29-e236-412f-9dd4-1919fc101a5e	viernes-viernes	Femenil
cf6ca8aa-9c74-4c3c-9dc2-2e0171901028	test 123	lunes	2026	2026-05-04 03:17:32.804176+00	Tijuana	active	80bd1d29-e236-412f-9dd4-1919fc101a5e	test-123-lunes	\N
3995e19a-61c7-402f-b4d1-e79d20e9ea3f	Domingos	domingo	2026	2026-05-07 22:44:18.04223+00	Tijuana	active	2c416a3a-db98-42fc-827b-e9c0c26b7a59	domingos-domingo	Libre
7f4a371e-05a1-4240-bf3b-afd47c8592a9	Rayados de tijuana	sabado	Clausura 2026	2026-05-09 06:39:31.56651+00	Tijuana	active	c985320f-5636-4c76-8cce-933da695c41f	rayados-de-tijuana-sabado	Libre
\.


--
-- Data for Name: match_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_events (id, match_id, legacy_player_id, team_id, event_type, minute, created_at, player_profile_id) FROM stdin;
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (id, league_id, home_team_id, away_team_id, match_date, matchday, status, home_score, away_score, notes, created_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, slug, logo_url, city, created_at, status, verification_requested_at) FROM stdin;
2c416a3a-db98-42fc-827b-e9c0c26b7a59	TERRAZAS DEL VALLE	terrazas-del-valle	\N	Tijuana	2026-04-30 00:13:31.989219+00	verified	\N
80bd1d29-e236-412f-9dd4-1919fc101a5e	Gamoro Pro League	gamoro-pro-league	\N	Tijuana	2026-05-01 21:14:13.3858+00	trial	\N
c985320f-5636-4c76-8cce-933da695c41f	Angel quintana	angel-quintana	\N	Tijuana	2026-05-09 06:37:03.956863+00	verified	\N
\.


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.page_views (id, visitor_id, page, visited_at) FROM stdin;
fbbd20c2-6cf8-4b4c-8aca-91748b3d1f31	81b46b03-ea3e-4547-8e2a-a59df69bc798	/	2026-04-27 20:47:53.989281+00
a6af9a0e-596d-41b3-bde9-5b04ed74aa74	553cb6ee-f6c7-4da3-b39f-6cd2d138c425	/	2026-04-27 20:47:54.729774+00
61bae6e5-11df-4fcc-b57c-28ff26b20d9d	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-27 20:48:06.120531+00
66a2c61b-49b1-4848-add1-ba860cd39a76	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-27 20:48:22.819238+00
2b464f83-0185-4837-a01c-a9246cbe6a81	2e2d735c-bc4b-4227-9f78-d855f2d11543	/login	2026-04-27 20:48:34.126726+00
f1b775eb-d523-47c7-9aca-c2ec5b5b1ae3	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin	2026-04-27 20:48:44.453497+00
ecab9359-7bdb-463c-aae9-42082b084b39	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/seed-liga	2026-04-27 20:48:50.136053+00
e5341755-3cdb-4ca4-a1d1-8117092796f4	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/users	2026-04-27 20:49:02.287258+00
fe56cc3a-c7e3-453e-a1ce-d142d9112f20	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/seed-liga	2026-04-27 20:49:18.01486+00
442fbfa7-5e14-49dd-b3df-d8d5d5df513f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin	2026-04-27 20:49:18.659643+00
9165da32-d925-4add-9938-9624872bb38d	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/seed-liga	2026-04-27 20:49:19.268732+00
77ca23ed-f6d8-4994-b85a-dcba00a68961	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin	2026-04-27 20:49:31.074714+00
3595413a-96b3-4d0e-a9be-d512b1172b79	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-27 20:49:34.049665+00
cbce0156-c999-4bfd-8a91-6c11e79e3b4e	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-27 20:49:35.771389+00
6c355103-c90e-4b9a-ae8e-725e4c6e19ba	2e2d735c-bc4b-4227-9f78-d855f2d11543	/matchday	2026-04-27 20:49:59.093074+00
75a5aa8c-cb23-4b5e-a112-87bdce0a513d	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-27 20:50:01.774096+00
a6bc6089-6d5c-4291-8194-83b15d9908ac	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-27 20:53:12.633536+00
abd20479-bbac-45cf-9065-eac92e5cbf62	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-27 20:53:15.311599+00
6079fc2c-be8b-4e4b-9206-29a0deb1922b	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/	2026-04-28 19:32:50.569805+00
53257824-2069-4489-8fdf-c6064623f815	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/login	2026-04-28 19:32:59.866437+00
88c72fda-2b46-46f6-a157-ba4231c116a9	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin	2026-04-28 19:33:21.100823+00
479a6bac-45fd-4a3b-803c-718ed3df60ce	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:33:29.308824+00
c8cd11c3-ea77-450e-8c04-5f1c62476ca8	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/users	2026-04-28 19:33:33.049459+00
72a0e7ce-c1f0-4caf-aa57-cdab8c5f7c6e	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:33:35.307103+00
29af7da9-545c-494e-9b11-0028853f601c	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin	2026-04-28 19:33:36.147595+00
d22e9c01-2558-42fe-9782-53c9c56c4db6	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/leagues	2026-04-28 19:33:40.956608+00
1fa2d21b-008b-4ae1-b729-1661dd01db62	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/leagues/new	2026-04-28 19:33:42.978467+00
9514bb9d-34c4-4bf0-a0e6-545c656a11d6	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/leagues/30a4d052-9de4-4463-ad1b-b03642b76e1f	2026-04-28 19:33:58.682511+00
4abb7f0b-ab28-4f79-ae35-6d6de28f95e1	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:34:00.738448+00
3d29f458-9bbc-4405-8b49-6946e626df7b	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:41:39.356453+00
31ddc983-1fa3-4b55-ab19-e55df09ac793	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:48:31.458039+00
c68f0eb9-e38f-49e5-9a9e-a2a5d94b7087	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:54:00.115245+00
976a9344-f6a4-4c65-9d82-c4686967373c	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/leagues	2026-04-28 19:58:35.735061+00
b06dd8de-bcf9-41bd-9425-5ee414450e6f	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/leagues/30a4d052-9de4-4463-ad1b-b03642b76e1f	2026-04-28 19:58:38.702341+00
8ffcfbf9-ac6e-4449-8c30-5f79e5ad4349	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/import	2026-04-28 19:58:43.720683+00
515b2d4a-ea04-44d3-83c0-fc3c6cd35456	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/admin/teams	2026-04-28 20:03:43.307236+00
fa77a01b-c1d5-4215-b897-1a29a0f3d9b7	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/	2026-04-28 20:03:46.269521+00
928286be-04e2-4997-b20a-41bc37f9edf3	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 20:03:48.350311+00
077da3d7-4428-47e1-b47a-b211ff681907	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/player/[id]	2026-04-28 20:04:10.627366+00
db4f9647-6012-4f95-be2f-53d8fc1e3ca1	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 20:04:17.789371+00
bd1e3d97-1646-4868-a9c5-d874dc8837aa	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/player/[id]	2026-04-28 20:04:39.300447+00
592639d1-4b09-4f56-8c33-54b1fc21de80	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 20:05:16.083792+00
fd3dfbf3-00cc-4854-9dda-d1d7a93ca717	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 20:29:39.942198+00
7bec89d2-30c0-48a6-befa-250b67cc5968	682ff65f-90b9-4d19-8fd0-cf255615b9f1	/	2026-04-28 21:07:11.117759+00
eb5d6e72-e9bd-4818-934c-0a9f9e27d0b9	682ff65f-90b9-4d19-8fd0-cf255615b9f1	/ranking	2026-04-28 21:07:12.170761+00
b5f64042-09d3-4806-a111-6fe2356c1bb2	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:16:03.162142+00
e8534cdd-9d1d-49e8-8cb9-7043cd6013fa	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:16:06.534589+00
241dc3b3-a06c-48ed-9e1f-ba6b438aef09	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:16:21.632844+00
faa3db5b-c7c9-463b-8529-af439de44b51	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:16:24.481453+00
494cbe36-a153-42a2-9ff9-5fcdb3be7343	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:16:57.917079+00
91ea8d68-b822-471f-b164-3aec960f8478	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:17:01.711174+00
6a55836f-6d59-414f-8e0b-ce23bf1e87db	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:18:08.059028+00
a62672e8-7f1b-4516-9435-3fb97be489b9	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:19:03.432055+00
3470614c-694a-4da0-9748-16401777328d	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:19:16.594046+00
31232e88-30f3-4872-b569-df041e633b51	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:19:46.952642+00
7e5fbef2-d4e9-4ab4-80a6-2494cf9cf393	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-28 21:20:05.401346+00
68e631a2-f134-4880-89e2-c2751298d409	d45a51d0-5ce6-48a0-8be4-85e5b01acf91	/ranking	2026-04-28 22:03:24.041516+00
12665c55-c269-45cf-82d4-272506454eba	d45a51d0-5ce6-48a0-8be4-85e5b01acf91	/players	2026-04-28 22:03:24.047059+00
cbf06bcd-6fa1-4dd6-9974-f50d50306a2e	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-29 00:02:59.517494+00
25440066-618b-4b58-a5da-3c739f64d504	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-29 00:02:59.61243+00
f1541864-9fdc-4aae-b4b6-ec4b0421cb8b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/player/[id]	2026-04-29 00:03:10.672053+00
8e4eed89-c28e-4961-8250-5f4548ee19db	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-29 00:03:12.974544+00
4977efa6-9075-48ef-8c71-7ca665ac6e9f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/player/[id]	2026-04-29 00:03:43.303616+00
a50560e4-6abf-4b29-94a0-06610cdb996f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-29 00:03:43.320032+00
2d86cf52-492a-4953-a210-fdec8457d88b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-29 00:03:47.673253+00
3061f3e7-89f9-4b8d-b700-e406f82d116d	df911046-08c3-4ebb-ad78-93bbc458be4f	/	2026-04-29 03:04:03.25195+00
7f0d995b-c659-41a3-b815-f2320e929992	df911046-08c3-4ebb-ad78-93bbc458be4f	/players	2026-04-29 03:04:03.265402+00
660d90d9-07d7-45ac-88fc-ff7d107094d2	df911046-08c3-4ebb-ad78-93bbc458be4f	/ranking	2026-04-29 03:04:05.804471+00
11508eba-d3be-499d-9c94-a2529addac27	df911046-08c3-4ebb-ad78-93bbc458be4f	/player/[id]	2026-04-29 03:04:06.606345+00
f85a0616-70a5-4221-ab7b-3506a2d2aaa4	df911046-08c3-4ebb-ad78-93bbc458be4f	/ranking	2026-04-29 03:04:13.642332+00
1854886d-a0fa-4941-a80f-31cda4576635	df911046-08c3-4ebb-ad78-93bbc458be4f	/player/[id]	2026-04-29 03:04:16.200276+00
fa7b7b17-0f0a-4be5-a0bb-1392601face5	df911046-08c3-4ebb-ad78-93bbc458be4f	/ranking	2026-04-29 03:04:18.578974+00
9e126cba-1107-4cb1-a901-2948efd77790	df911046-08c3-4ebb-ad78-93bbc458be4f	/ranking	2026-04-29 03:04:25.084463+00
245f19c4-5904-4506-9c81-41d7615825a8	df911046-08c3-4ebb-ad78-93bbc458be4f	/player/[id]	2026-04-29 03:04:25.140631+00
61d480f6-159d-4813-bf7a-05f4e4e165a0	df911046-08c3-4ebb-ad78-93bbc458be4f	/players	2026-04-29 03:04:27.110886+00
2ad523bb-423e-4bb1-ba9b-eb174abba9fc	df911046-08c3-4ebb-ad78-93bbc458be4f	/about	2026-04-29 03:04:28.707105+00
68d116a2-2045-41a0-8e10-07a1fa17847a	e7524af3-ae55-4b47-b193-c1789e61c3ef	/	2026-04-29 20:45:38.58735+00
fddea5be-be7a-4de0-a0d7-1a0f6615e792	e7524af3-ae55-4b47-b193-c1789e61c3ef	/ranking	2026-04-29 20:45:39.312761+00
8d246e1b-a67c-40f0-bfaa-fd755c1f8478	e7524af3-ae55-4b47-b193-c1789e61c3ef	/players	2026-04-29 20:45:44.045788+00
765e1c05-23c5-4df7-a8b0-7b4050ab7c1c	e7524af3-ae55-4b47-b193-c1789e61c3ef	/matchday	2026-04-29 20:45:44.685838+00
1884911c-c0e7-4af7-a433-c96c5f32076c	e7524af3-ae55-4b47-b193-c1789e61c3ef	/players	2026-04-29 20:45:46.59725+00
c8bee6eb-b476-4eb5-8909-0b7b0f30a85c	e7524af3-ae55-4b47-b193-c1789e61c3ef	/player/[id]	2026-04-29 20:45:48.081417+00
03b4ccb3-f6c0-41f1-a20a-a78bd86b6f87	e7524af3-ae55-4b47-b193-c1789e61c3ef	/players	2026-04-29 20:45:49.381326+00
872e3a5d-29a2-4710-8d61-3bc4e9d7199c	e7524af3-ae55-4b47-b193-c1789e61c3ef	/	2026-04-29 20:45:55.173329+00
a87bb818-2e71-4874-a15d-d96e22151721	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-29 22:01:08.471384+00
9f27ad31-824c-4ceb-83a6-82da0a21a240	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-29 22:01:14.30299+00
41fd20a3-b6f0-432d-9c9a-d766908831d5	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-29 22:01:17.402545+00
6709412e-2faa-4988-9898-838e67ba9c58	2e2d735c-bc4b-4227-9f78-d855f2d11543	/matchday	2026-04-29 22:01:17.4066+00
b9497144-1c7c-4f33-889d-7064c11a31d4	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-29 22:01:17.422563+00
acd8fef3-4ec2-4af4-9f68-8e2cc1048c30	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:05:46.354768+00
51652ccf-f057-41f4-b093-dfcfef4f9d8c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-30 00:05:46.41465+00
f5c0887e-a85d-4159-a9a6-3ff605b8515c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-30 00:05:50.083871+00
18216c1e-9adf-4f50-8827-50f1178db87f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:05:53.693993+00
a2001164-578b-44d6-ae9f-9bd9664ecded	2e2d735c-bc4b-4227-9f78-d855f2d11543	/login	2026-04-30 00:05:56.134002+00
d607ad6d-d266-46f9-8270-c523810ebce6	2e2d735c-bc4b-4227-9f78-d855f2d11543	/matchday	2026-04-30 00:05:58.002876+00
479adbd6-ffa9-48d1-a445-a894c393798b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/login	2026-04-30 00:05:58.134031+00
71c99179-7b76-4e0e-badf-053b18fc28f0	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin	2026-04-30 00:07:05.433527+00
ff0119e9-e0f2-41a7-9d8f-650826c5bec9	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues	2026-04-30 00:07:06.631072+00
5bdea7be-8152-4c47-89b2-8477d7bbdb34	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/players	2026-04-30 00:07:08.433848+00
b4b7510d-d848-48a4-ab36-16378ef92139	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-30 00:12:16.368177+00
fcd55a9f-5063-4f8b-8c00-5672c3419255	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:13:08.707119+00
1009b053-5722-480c-a112-5cf25de82eae	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/players	2026-04-30 00:13:09.040797+00
99012922-44a3-43c5-90d8-9b91fb4b139b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations	2026-04-30 00:13:10.210036+00
d9cc9a7c-6d36-4797-ba90-f6df74abe59e	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations/new	2026-04-30 00:13:11.548104+00
36b2ad00-cbd7-4131-b499-00c8b60b44a5	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-04-30 00:13:32.632248+00
6ff5a5a7-ac92-4ddc-a394-eccada267b9c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/users	2026-04-30 00:13:41.600906+00
00ee8e66-fda9-4d2b-9176-f86ca2e3717b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues	2026-04-30 00:14:02.268997+00
f3658692-306f-4cd8-ae8a-7861d700a8a1	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues/new	2026-04-30 00:14:03.989876+00
775d1ca5-0324-4974-85f6-b723c32fc45b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues/7039a7b9-c837-4b9d-af24-137423e2ee33	2026-04-30 00:14:43.437968+00
21cabae6-3c92-4412-8b41-46730c9e79a1	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/import	2026-04-30 00:14:48.033115+00
5015a937-0362-497f-8fda-78d925a164c7	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:16:03.478329+00
22792b63-5641-4eb5-957d-b8fc23b89a6a	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:16:05.949878+00
be0b32a3-cb27-4a38-b5cc-8f8d46cfb219	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:16:11.207154+00
9def5685-83fe-4010-a821-49dde2fb3d7f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:16:12.398247+00
6f11cfe0-6211-434f-9754-37bb9dfbe40d	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-30 00:16:12.402089+00
eaff3b58-60a1-441a-85e1-e8c178700aa4	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:16:20.816056+00
213fbe00-f792-4bf6-90ea-a9a8d2f9ee06	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues	2026-04-30 00:16:24.600108+00
b2f23041-dd54-4b3c-adc7-e42182f0a4f9	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations	2026-04-30 00:16:26.851556+00
354b4d53-cdbd-41a9-9ac0-a1e8a89ff204	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-04-30 00:16:27.944677+00
26e15c1d-cae1-4328-83d3-4b896e79ea2a	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-04-30 00:16:30.159338+00
28213071-5572-4086-a755-d4e5310d4d01	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:16:32.721818+00
7264c2cc-4b40-49af-b6d7-64d9669ae167	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:16:34.122714+00
efdb8b6f-d746-42a7-9a2f-4e18fe31f920	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 00:16:48.55253+00
1c4dca05-4639-4843-839c-c82ca92aa97b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:17:16.239888+00
e5983e9c-37f5-461b-a95b-cf8a8a6c11d0	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:17:17.876287+00
33c2b051-4086-41bc-9926-49b93c588490	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-30 00:17:17.990143+00
72651a20-744a-4b16-9e80-8d739f219f84	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-30 00:17:25.152552+00
f42c422c-fb47-4481-8b6f-04fc4accc21b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:17:28.002225+00
6c5144af-6f31-4c75-954b-dfccb760662b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:17:28.427211+00
87686ba2-09af-4a47-bf6f-6666f08658ae	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:17:29.697161+00
60b7bd2c-2f7e-4cb4-a1aa-94d940d35ba6	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:17:33.785253+00
32d6f84c-14f2-4eaf-98e9-ae875c9dba2c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:20:03.131508+00
1b49a2a4-40cf-4a13-9cb2-64e58c165e34	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 00:20:09.317696+00
46edd3bd-67f4-4e4c-8daf-48b3072bd72b	2e2d735c-bc4b-4227-9f78-d855f2d11543	/player/[id]	2026-04-30 00:20:20.030737+00
795909f9-8230-4264-be6a-07cd7777ebad	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 00:20:24.890261+00
9ac33999-1d79-4cc6-8e41-7f2fe9478d2f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/player/[id]	2026-04-30 00:20:25.398043+00
752ad6f9-1ca1-4c2c-95f6-7724e4006e14	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 00:20:31.321108+00
ec960594-2129-4920-9150-446a60d850ad	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle	2026-04-30 00:20:33.721458+00
9293ecca-9577-4dc5-af81-3ecd81aff3f8	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 00:20:46.857814+00
fa50f243-1f7d-465e-9810-ccf86ca2647e	2e2d735c-bc4b-4227-9f78-d855f2d11543	/org/terrazas-del-valle	2026-04-30 00:20:52.785131+00
8737f880-b6b2-461a-a503-5728cbbda08e	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:20:53.695498+00
9817fa81-b3b4-4d2a-a374-ca18e170f075	2e2d735c-bc4b-4227-9f78-d855f2d11543	/players	2026-04-30 00:21:00.683658+00
86041e8f-fb6a-4389-80b9-af806ea5b367	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:21:02.309925+00
8679ae6c-2988-4840-985d-03b3f90a3e6a	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:21:03.195045+00
b53a57f4-2062-4c49-abe2-859f18fe268c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/about	2026-04-30 00:21:27.672166+00
7791cdcf-5e72-47ff-8b6f-d0508444f740	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:21:48.656571+00
4d3270dd-8897-431f-a321-39d4dcdd9e8f	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-30 00:21:49.346568+00
0b31ddf6-909a-4b0f-a618-f3fccb013d6c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:21:50.297913+00
f0d82353-e9a6-457f-98c8-147b482da893	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues	2026-04-30 00:23:35.454865+00
5f89c423-369d-4beb-8780-ff01ccbac050	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 00:24:55.910901+00
297e8377-ddcb-4329-986f-4156814ed93a	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ranking	2026-04-30 00:24:56.679228+00
04d98a91-74d2-4bec-9cb5-ac46ed9cb977	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:24:59.303196+00
1be0ab06-d6bf-4fa0-998c-b38c15b8e381	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:24:59.309252+00
373073a3-3ef6-49bb-af91-e333fa3fe146	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:25:03.162205+00
c9dfc659-995d-47e1-95c6-4ebe2a421673	8208de1b-623c-49a8-958e-446bdfc12d2a	/ligas	2026-04-30 00:25:03.164424+00
2cc1bd70-627c-436d-8d1a-19905cc75869	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:25:09.440761+00
a520b51e-fffc-46ec-a4cf-8ad51f5edcb5	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/	2026-04-30 00:28:02.273904+00
ab718d52-1d14-4529-8849-723b19fa27e2	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ranking	2026-04-30 00:28:03.218694+00
94999585-501f-46c0-a8a6-289fd92bbabb	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ligas	2026-04-30 00:28:03.636419+00
1f388009-2fa7-439e-bb3c-f67978393ba0	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/org/terrazas-del-valle	2026-04-30 00:28:07.639135+00
99b32bb0-0547-4a47-ae3e-0ee5c4ab8b4a	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/org/terrazas-del-valle	2026-04-30 00:29:00.793088+00
873f1c00-c3c0-4e2f-bee9-27386d52374f	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/	2026-04-30 00:29:02.12333+00
08406336-351d-404c-93e4-8ef56bfe7175	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ligas	2026-04-30 00:29:02.868138+00
0e773b1b-e3f4-4702-800a-4747a440bb8e	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:29:25.265373+00
e650a7a9-f407-4f3a-9e27-41c109d9e2d7	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:29:25.633222+00
51cc36c0-7724-43c8-9c94-c0ea9b6d4ee4	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:29:26.320278+00
e0e391e4-17a9-45c6-8760-524a426b4421	60efcd0e-0e79-44cd-963e-1e1b30f45ec8	/ligas	2026-04-30 00:33:31.25322+00
7e0a7716-e976-4b7e-bfbf-e29582261fb2	714fa17b-5700-4eb5-8cb5-84c2efe9b806	/ligas	2026-04-30 00:33:37.040897+00
98fc54e6-cb51-428c-bd83-ad53e84430eb	714fa17b-5700-4eb5-8cb5-84c2efe9b806	/org/terrazas-del-valle	2026-04-30 00:33:40.338134+00
c69f9dc7-49e3-4a3f-a141-b4d7acb88c0f	714fa17b-5700-4eb5-8cb5-84c2efe9b806	/ligas	2026-04-30 00:33:41.653633+00
fe83d251-a465-4a59-aa64-26362c3aa0b7	714fa17b-5700-4eb5-8cb5-84c2efe9b806	/ligas	2026-04-30 00:33:43.600182+00
8ab4e7b1-3778-4ac7-a220-3f2ff9f3912a	57e624a6-e571-48f4-9a6a-344af0278ba5	/ligas	2026-04-30 00:33:58.438021+00
834101f1-9eb3-4941-87b4-a347dae58309	57e624a6-e571-48f4-9a6a-344af0278ba5	/org/terrazas-del-valle	2026-04-30 00:33:59.528883+00
52ab7ee1-be4f-49bd-bd3e-27025ee7a104	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues	2026-04-30 00:35:10.601629+00
2a32ea6d-dc02-43a8-958c-a21c33861cf6	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues/7039a7b9-c837-4b9d-af24-137423e2ee33	2026-04-30 00:35:11.745839+00
ccfaf19b-6d38-4b45-8a2a-3655fde56cba	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/teams	2026-04-30 00:35:16.392505+00
12f913f1-6b79-4ba8-88be-847999d02301	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/import	2026-04-30 00:35:21.699343+00
f576ee64-2ad8-459b-957c-47be9ee6edc9	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/users	2026-04-30 00:35:23.641408+00
5af0ed44-2d6e-43f6-9c40-359b7fdfa698	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations	2026-04-30 00:35:26.685989+00
6d99e068-03b6-4049-8f15-d7cdf950f48a	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-04-30 00:35:28.797981+00
1dc5e816-1f80-4a14-89bd-265dca7623b5	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/leagues/7039a7b9-c837-4b9d-af24-137423e2ee33	2026-04-30 00:35:30.396667+00
e87fd963-ea2e-4a4a-b2da-a7defd54e0d2	2e2d735c-bc4b-4227-9f78-d855f2d11543	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-04-30 00:35:32.154504+00
0956c8ce-a7a7-4c88-8a1a-0ae79ac3e9ae	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/	2026-04-30 00:36:01.175224+00
a8f90792-c749-4141-98d2-dcbeb549fca7	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/ligas	2026-04-30 00:36:12.990953+00
05ac142c-f80b-4d1b-ba5d-7aa432ed33a9	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/	2026-04-30 00:36:15.465324+00
1280ebef-4dc7-473d-9e22-35f24ed379d5	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 00:36:22.281799+00
45c9e211-e46d-4b0c-a9d7-bd6abe173ac8	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/ligas	2026-04-30 00:36:41.629638+00
e458f292-2944-4ef6-959a-909c82ff0876	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/ligas	2026-04-30 00:36:41.649197+00
f666f919-a418-4ed0-a145-65b4bb3da3ed	2e2d735c-bc4b-4227-9f78-d855f2d11543	/ligas	2026-04-30 00:43:33.855215+00
c13deef7-7250-40f0-8bdc-d89894ac6ee5	ed369acc-2a45-402f-9d3d-6d8e3ea61fb5	/	2026-04-30 00:57:33.415384+00
c55ce4d1-9233-45e6-b33a-cdcb2ed69687	a19a8643-6a13-44ad-9763-38d5659df5cb	/	2026-04-30 01:20:16.054165+00
d161edb8-dce8-4f85-a660-22cd4d35769f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 01:20:16.14978+00
25aa9262-8195-4af4-94e8-25f2d2395458	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 01:20:18.131471+00
899bf293-c3fc-4b0f-8a21-37181afb28e4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:20:20.977385+00
4f53144f-5cad-4016-a7af-35f0ab23134e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 01:21:03.54056+00
b0adf636-dce6-4f7c-ac28-143bfbbb33f8	85f28d3a-5962-4cc7-898a-e718229811e1	/	2026-04-30 01:21:04.044858+00
516364ea-536a-4eef-a738-50270bdd4923	85f28d3a-5962-4cc7-898a-e718229811e1	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:21:17.608844+00
d0d9cd29-746f-487c-b0cd-b351efc6fd24	85f28d3a-5962-4cc7-898a-e718229811e1	/ligas	2026-04-30 01:21:40.436216+00
e388fd2e-acd2-4b88-a931-4dab18c94d9b	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/ligas	2026-04-30 01:21:40.468395+00
6f622640-f371-4296-9ba4-0da14bef8ef5	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-04-30 01:21:48.259484+00
37afb9a8-2051-464c-a4b6-ee0f8941b1de	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-04-30 01:21:53.740226+00
9e1c0e7c-0c77-41c4-ba4c-d801ea0c2f60	64ef47f4-6917-4a66-ada9-488e035b41c9	/	2026-04-30 01:21:54.403238+00
909912e2-632a-45cf-9115-448189a204e6	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 01:21:55.985485+00
87031f1c-4419-461f-83ec-4f51de166d8e	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:22:03.689195+00
a86faff1-f31c-4ffd-a1ae-a7ab83b0a87d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 01:23:51.945141+00
a47a2cd4-b401-4637-8237-3401dc6caf3e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:23:52.045862+00
3e1b9b5f-655a-42b0-aa25-cf9cd266d1ff	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:24:46.453166+00
24c4d8b6-d51d-4c87-a499-e4a0eb90349f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:24:46.786907+00
6ea6d9d8-00df-40bf-8e55-b8912130641f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:25:10.133547+00
f1a41db2-b7be-4203-a9fe-6bbedca44c22	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:25:28.366401+00
827672c7-f0e8-431b-84ed-632f52714f07	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:25:28.370319+00
883268ec-6373-4b19-bbec-b6781cb20483	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 01:25:35.236089+00
b6dbff74-1296-4bfe-aa73-4beab7c6beff	1b1f7989-a777-47cb-ac27-808835649d23	/	2026-04-30 01:26:29.258696+00
318280dc-b57b-4d78-86b4-21fd45b136ab	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-04-30 01:26:30.572025+00
c7251117-24f4-4f84-b63b-0a480a544127	80ec4f51-a1a8-4fd8-a1ce-432108e19a10	/	2026-04-30 01:26:57.459819+00
253c1cc4-1b54-40b6-9e1e-c3c98277b169	d986c8f1-7805-45a8-8807-cfdfa8fad4af	/	2026-04-30 01:27:01.638336+00
cadba0c3-5eec-42cf-a9f8-a21ae59c8bcb	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:27:33.75408+00
a63f9f75-2d05-4c63-8192-2b02292bb01e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 01:28:37.506467+00
47fc4ef3-8682-415b-b494-dbea0de69461	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-04-30 01:28:43.969471+00
22032f4f-e910-4c4e-9440-1692fb7d1e5d	b34b4c9d-6c8e-42ac-a003-11f264a768e4	/	2026-04-30 01:30:21.725836+00
d8e3ba8d-1c26-4385-ba34-3d4d9f5ed26a	13c4a611-d457-4bc8-bad5-e7d3d4e4faaa	/	2026-04-30 01:30:59.253959+00
c2eaf15c-d733-4f29-b35c-2e6907a438b1	8f1fec27-a109-4b0a-ae5c-707a904228df	/	2026-04-30 01:30:59.539789+00
c428b3e7-bca1-452c-bd55-f7c1ba0ca10f	ddb33f80-3383-4590-8bbb-497387ab50e0	/	2026-04-30 01:31:02.682868+00
b58cd3ce-9d88-4f75-96ea-e4cb67ce9838	9d92d17a-a5e6-4825-95aa-19a4e503d7a5	/	2026-04-30 01:31:02.738343+00
03a05744-b736-46e8-b086-a61ebfbfb60b	4cdedcfe-3022-4446-8af2-336bc301d78f	/	2026-04-30 01:31:50.624166+00
05dfe1c5-f55c-45c0-8410-baad1494ec62	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle	2026-04-30 01:33:38.636185+00
65b9f2ce-c4b6-4154-8123-772ac22852d6	3de75780-9ac6-4ded-b1bc-46414c3b6662	/	2026-04-30 01:35:06.50123+00
ef32f3c9-bfc8-470d-9b34-89e783bdc1ef	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/org/terrazas-del-valle	2026-04-30 01:39:08.441255+00
f90a79ef-ff22-465d-acb9-a31a7c9e3300	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 01:39:30.390949+00
dd56aaba-54cd-49e4-a915-048df72b13ec	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/ligas	2026-04-30 01:40:06.688975+00
28269ccc-0a7a-451e-a969-62add5db4f9a	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/players	2026-04-30 01:40:31.504409+00
5e678a63-8896-46b6-a6c6-2ec32cbbb85e	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/	2026-04-30 01:40:38.777853+00
8362f91b-ad26-4e2e-b3fb-f6c0904e712b	f703c768-fcb4-4fc5-b63c-830adc681564	/org/terrazas-del-valle	2026-04-30 01:43:22.739283+00
e5601d9d-60b8-4abc-b436-f891cb347bab	f703c768-fcb4-4fc5-b63c-830adc681564	/org/terrazas-del-valle	2026-04-30 01:43:23.049929+00
2aa26c07-9bd8-4346-8424-40eff7e21e77	f703c768-fcb4-4fc5-b63c-830adc681564	/org/terrazas-del-valle	2026-04-30 01:44:49.947753+00
56bf51a2-e6df-40d5-8c94-dd080aebfc44	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/org/terrazas-del-valle	2026-04-30 01:46:24.765159+00
32849845-7af6-4b9d-a77d-1362e2572595	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/ligas	2026-04-30 01:47:09.523873+00
d596a068-77fe-4729-ac3a-3d8a09b0a213	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/ranking	2026-04-30 01:47:13.364896+00
f97ab032-b5aa-409b-b351-8d1d645d4c4f	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/matchday	2026-04-30 01:47:26.946863+00
432ed5c9-0eb2-4baa-98b7-72453d0fc5c9	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/analysis	2026-04-30 01:47:34.742761+00
2b4768e1-c960-492e-886c-a628dca6de3b	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/about	2026-04-30 01:47:37.499639+00
8e4a8529-6a2c-47ff-9d5d-cf705c371a7b	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/players	2026-04-30 01:47:44.846336+00
fbc9bbf6-407f-4c55-9711-a0de32d8132b	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/ranking	2026-04-30 01:47:45.555267+00
fcea711e-99f1-4850-bfcc-28b8db2a896b	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/	2026-04-30 01:47:47.121061+00
41a9428e-91b4-4eb6-bb95-6cc69f5f7806	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/ligas	2026-04-30 01:48:01.701939+00
282bae5f-3ed2-45f4-8ac8-a044cc400582	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/ranking	2026-04-30 01:48:07.105734+00
52cefd35-55b5-4e10-93f5-3821641f5b92	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/ligas	2026-04-30 01:48:36.786594+00
d8ddaf8c-b3d4-44b0-be76-d48499f5a504	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/	2026-04-30 01:48:40.133475+00
bc65038a-63ac-4a1b-aa99-2d945d4781f0	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/players	2026-04-30 01:48:52.180422+00
c3226e79-91f5-4a94-854a-e234dde44599	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/matchday	2026-04-30 01:48:53.74572+00
b5216312-6ff3-4b40-9da0-8a8e2ab31544	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/analysis	2026-04-30 01:48:56.950842+00
b83d9213-9bc2-46ce-8d84-4664f5179b0c	f5dcaa2d-7139-438e-b0fc-577a8111c0bc	/about	2026-04-30 01:48:58.5467+00
579c6bcb-35b0-4a08-97e3-3eff3fa23d49	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 01:56:36.789613+00
b28f30a2-48e3-45d5-9c8d-cc66d41d1148	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 01:56:37.15213+00
83c49cf9-e413-4095-ab9a-67418580de95	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 01:58:31.751133+00
e506911a-3e54-4100-95fb-5c740a0a309d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 01:58:42.410222+00
b2eb7000-a43f-409f-80b3-b490b2214683	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:58:44.473798+00
e39e7516-a818-41fd-9c41-813bf4b7c7ef	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:58:45.335015+00
47361f6e-33a6-4909-93b5-e64b9fc46210	c6cbc2af-1454-4477-bfd0-a23e10ac8be2	/	2026-04-30 01:58:52.691572+00
8ad8af77-0314-4852-b6a5-8c635d0eb40b	69a5e726-f90d-48d3-aa2d-9c4c797a6bbf	/	2026-04-30 01:58:54.274815+00
cdbbfa76-fd3e-4569-b77d-d41ca8e9fd81	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:59:07.68762+00
cc5dfdf3-f04e-4f4c-85e6-8e522c8f859a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 01:59:08.021108+00
7b79aa67-6b39-4e26-92aa-ba82f13053b8	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 01:59:08.685211+00
d2b89f81-e59b-46c6-bbb8-cf53b6e977fc	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 02:00:13.053168+00
2d76e9ee-7818-459f-a265-0f3e3a85341d	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 02:00:14.438589+00
3522d1ba-986e-41eb-a723-002037011f02	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 02:00:23.094822+00
2092a816-2294-413c-a4fb-1534fe82308e	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 02:00:25.797023+00
ea2244ec-64a2-4795-b1e0-04048b9b22ca	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-04-30 02:00:35.278366+00
aa5fd3cd-5e5c-4b9f-8138-d2daf2ee22c6	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-04-30 02:00:36.692398+00
6ac84044-038b-49c2-9d71-a47b5f14ac10	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 02:00:38.018158+00
67d410fa-e005-48cf-b1e7-61e18b84e056	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 02:00:41.428631+00
fc241758-a6f3-415d-b1cf-446904a7d334	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 02:00:45.116165+00
634f9ccc-ba52-479c-ac0d-911b5acb5683	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 02:00:55.805884+00
3996f24a-310b-4a40-b461-50404163daf5	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-04-30 02:01:14.438015+00
2c80c505-803d-4835-9d3c-3ed6d1cb6c7a	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 02:01:19.00659+00
659de667-fe07-438a-a727-67a386972cbb	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 02:01:25.022101+00
37e4c144-34ff-4c6d-9d1f-bf0370608ad6	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 02:01:33.978545+00
97151b66-0226-4374-8b0c-5b8013e6a483	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-04-30 02:01:41.788938+00
4f0d310f-2244-4f49-a85a-ac50cf183f7e	2c32b8cf-a7e8-44e5-8db8-51be884306de	/	2026-04-30 02:05:45.692469+00
2760aecd-58b2-4d0d-81ec-a53fa14bef25	70d64af3-cca4-4984-b291-8577a5f155f2	/	2026-04-30 02:05:46.427791+00
e8a2b049-0353-4c78-9b6a-61b5bfb31de9	1bc456a8-9060-4578-bb25-729f85ac9e00	/players	2026-04-30 02:08:19.327687+00
2ca0bdbb-1f2c-4268-b1cc-52c464c4e81c	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 02:08:20.096315+00
1049b8ab-929e-425d-b17c-ba6f4f39bc8f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-04-30 02:10:22.456375+00
374b197e-99b8-41cb-b55e-7184ed86c56b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-04-30 02:10:39.098419+00
09b26c59-8233-4283-9683-1d40f0986873	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-04-30 02:10:40.192727+00
3ef61914-2075-499a-a690-6823a7824c9c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/7039a7b9-c837-4b9d-af24-137423e2ee33	2026-04-30 02:10:41.824713+00
70d53a65-04d7-4687-b2ce-3c4042b3b637	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/organizations	2026-04-30 02:11:01.586213+00
e0dd26f9-5542-4fa2-8f0a-732572ed9ae7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-04-30 02:11:06.351946+00
6b83af08-1702-44d1-8438-2c566862d38b	8f7f634a-0861-497f-b1ca-decb08c2c4a4	/	2026-04-30 02:11:32.951675+00
07e93a08-a626-413e-91d7-07e8b8fdc757	2e21fdce-46ad-4343-aa76-1c27eac2953b	/ranking	2026-04-30 02:17:40.216065+00
5fc094d1-9e23-4786-8223-f3612895e1ae	2e21fdce-46ad-4343-aa76-1c27eac2953b	/	2026-04-30 02:17:40.296608+00
6d1f9400-db1e-43ce-ac83-33435e1b7162	2e21fdce-46ad-4343-aa76-1c27eac2953b	/players	2026-04-30 02:18:03.677777+00
27b9e58c-d4a1-4b8e-9434-d6d37d215f99	2e21fdce-46ad-4343-aa76-1c27eac2953b	/analysis	2026-04-30 02:18:08.641116+00
48bd21a2-b3d4-4172-b1d9-f1b4b9ed15ca	2e21fdce-46ad-4343-aa76-1c27eac2953b	/matchday	2026-04-30 02:18:15.810561+00
32ee381d-fd1d-4384-a911-614716c3ac7f	2e21fdce-46ad-4343-aa76-1c27eac2953b	/players	2026-04-30 02:18:19.492231+00
d235e345-47a5-47cc-8789-1f40adfdc2f0	2e21fdce-46ad-4343-aa76-1c27eac2953b	/ranking	2026-04-30 02:18:20.528237+00
68c333fc-e3ed-4ec2-ad8e-a5948ffb8e94	2e21fdce-46ad-4343-aa76-1c27eac2953b	/ligas	2026-04-30 02:18:21.676432+00
73e1788e-bda4-4bd5-93be-71833e694214	2e21fdce-46ad-4343-aa76-1c27eac2953b	/	2026-04-30 02:18:22.762647+00
e8a4e126-c548-442a-83dd-528150f3b9bb	f7d6dfda-6f82-44cf-9a50-2e6799f93c5b	/org/terrazas-del-valle	2026-04-30 02:18:29.195029+00
f4372747-01fa-4121-9481-25587705ef4a	2e21fdce-46ad-4343-aa76-1c27eac2953b	/ranking	2026-04-30 02:19:02.274921+00
95f68be9-f597-4905-a729-ae3d96bd19c3	f7d6dfda-6f82-44cf-9a50-2e6799f93c5b	/matchday	2026-04-30 02:19:07.393567+00
ef08a664-b7d8-4b02-bb44-9efebd74a961	f7d6dfda-6f82-44cf-9a50-2e6799f93c5b	/players	2026-04-30 02:19:17.585316+00
f96d22d8-e1a4-4726-acfd-e5e131d1d46b	f7d6dfda-6f82-44cf-9a50-2e6799f93c5b	/player/[id]	2026-04-30 02:19:27.09481+00
b57afebf-4e30-4e14-be0c-09105c222414	729a5777-1343-4074-b2d6-d74b8053baff	/	2026-04-30 02:20:19.960873+00
92fe3655-6313-4601-b37b-f675b8af457f	72f235e0-32c4-4c78-94f4-5b4147574335	/	2026-04-30 02:20:20.488012+00
b87d9dd3-3dc8-4cbc-b419-81dfe571161c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 02:20:24.51742+00
315f189d-702b-4fa8-969d-ded0a32e8e7c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 02:21:57.224634+00
4787c5cc-e16a-4cef-8a43-a764973bda26	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/matchday	2026-04-30 02:25:18.29199+00
3842cf1a-f7bd-4de6-87bc-62a64ae38b42	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/ranking	2026-04-30 02:32:23.225958+00
aec258aa-2f86-41c8-b5d2-b2aad1671c30	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/players	2026-04-30 02:32:53.443805+00
ca7238d2-e596-4d90-b2c9-b946ab08f1fa	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/matchday	2026-04-30 02:32:59.084943+00
47cc885d-a7a4-438e-a519-d6162b6e8c3d	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/player/[id]	2026-04-30 02:33:07.53235+00
acc9232f-aba8-4580-b27e-212cb311c960	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/matchday	2026-04-30 02:33:16.412183+00
6a7b262d-2f9a-4563-813e-537e125e805e	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/analysis	2026-04-30 02:33:21.262311+00
4c660824-6dc9-4414-8144-7390bd0ff169	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/matchday	2026-04-30 02:33:40.492283+00
0fb47999-2e31-4d0e-bf77-96626f732528	29f56814-6ab6-4f7c-ac57-9ae790907832	/	2026-04-30 02:34:31.673718+00
3d5107fc-ae78-475a-9d5e-a474011abe1b	39e7a52b-1834-485a-bae0-c7f1a9cf70ab	/	2026-04-30 02:34:33.222957+00
fe726c3a-713d-4022-ac17-c63c57a8c7f4	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/about	2026-04-30 03:08:49.932512+00
afb85d97-7bf9-48f2-9a1a-ee9b9e12d338	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-04-30 03:20:53.30626+00
5d9d6d82-382d-4d53-8466-49ca14967d97	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-04-30 03:21:23.405502+00
f3f5d7c4-eafc-432c-a0f2-118a22a2dd02	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-04-30 03:21:24.343337+00
75503b78-b1ca-4435-ba74-01a5d16e2fe4	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-04-30 03:21:27.39586+00
0bec09ed-14d7-4881-a58e-7ca609b5aa05	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-04-30 03:22:09.005073+00
6c6e975d-460d-4d49-a183-5d7c5a96092f	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-04-30 03:22:09.012117+00
2f2537b5-19d3-4d56-816a-a09927b52917	e7d84f16-e1e7-4811-b7a4-550ccff86a27	/	2026-04-30 03:33:18.505905+00
d53ff832-b748-468b-8598-6ad2ecb7e0e9	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 03:36:38.263598+00
da7c2ca3-281d-4050-9018-ad537ecdac5f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 03:36:42.015231+00
efd6dc86-71f2-40a3-baa0-96a3c3d3cc6e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 03:36:53.07109+00
23705387-3ed2-4d19-bc42-9bce96800369	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 03:36:56.305222+00
03b216ea-c265-49c1-91b3-3fc10a82b68d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 03:37:25.68682+00
3223fa75-5f34-4761-b9f2-79e690d09f95	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 03:37:53.131868+00
5d046dc5-6ee2-410f-9ea0-e5f9f21a10c3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 03:38:08.149791+00
8c1526e1-09e9-4e62-b4d9-d4aa8101956f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 03:38:08.221812+00
f1b5a339-23c2-4122-af74-91d5c6f54c12	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 03:38:21.326513+00
1f84fb12-49c0-4f26-9396-8a82a4ab8c65	bfe87a1c-e281-4e9a-849c-96edde5a238b	/	2026-04-30 03:52:46.212446+00
edbfc67e-606b-475e-b0e6-08ee44a593e0	adbd4024-0f64-44a9-898d-4a16a19fd627	/	2026-04-30 03:52:53.048349+00
e5832d55-d1f1-4b34-b6b9-030b712a3aec	f0c80559-58b8-404e-8637-73ca9f720b86	/	2026-04-30 03:57:07.137341+00
b7cc3637-af8c-4c13-b755-3ed5847f7b53	45aa6868-ff46-44c8-abb5-0391c16080d0	/	2026-04-30 03:57:14.814477+00
1d190853-dacc-4885-8361-42239fb1ac82	6b36df03-af1c-4f6a-aa0b-5a9c84d06351	/	2026-04-30 04:14:53.506471+00
6923ac1c-0199-4d85-bd16-6e380b7f91b3	cc14d73c-fda6-4c27-bb87-0a27e620c5fc	/org/terrazas-del-valle	2026-04-30 04:17:59.038743+00
10f428fc-de75-4ddb-a9e1-82e11236c78a	95ba253a-f789-4c2f-804a-938e3f449293	/org/terrazas-del-valle	2026-04-30 04:18:01.994413+00
33452639-b693-45db-82b1-67e21d16ec39	cc14d73c-fda6-4c27-bb87-0a27e620c5fc	/	2026-04-30 04:18:25.256268+00
4dbc645a-3b6c-40a6-be01-92e4207b8877	cc14d73c-fda6-4c27-bb87-0a27e620c5fc	/ranking	2026-04-30 04:18:25.260259+00
857ab0b4-e05f-4f69-aec1-81a2fd1eb61e	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 04:32:34.028866+00
a6dbea9d-6199-4a54-b77f-b80cd59fbc8c	1bc456a8-9060-4578-bb25-729f85ac9e00	/ranking	2026-04-30 04:32:37.791373+00
25068f86-9f85-4cb9-a200-a617e85002fc	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-04-30 04:32:45.854518+00
d922fdd0-3a6d-4190-973a-9bd45d5cee61	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 04:32:46.87424+00
cffcd80b-3b82-4523-98db-7d89c29e3d6e	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 04:33:03.39035+00
87dc00a8-34f3-4335-bc72-033d2e911ec5	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 04:33:11.098864+00
51b2af3c-9df5-4330-8d89-02b91d8e6419	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 04:33:11.101365+00
9738ce11-3614-46f4-95ba-39b6b955aee9	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 04:33:11.122644+00
bcf5eb8a-bf5f-4db0-ab1b-bb3f8b982b68	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 04:33:15.087623+00
d2f507df-c87c-400e-a9cd-8636b6fe9ed6	b0de923b-5624-4e8e-be33-956f8bbf360e	/org/terrazas-del-valle	2026-04-30 05:51:02.937381+00
927c6f27-c273-42c6-9b16-99f71f7c671c	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/org/terrazas-del-valle	2026-04-30 05:53:39.84551+00
ee93df6c-3edc-4a6d-875d-b0d3a0059f90	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/ligas	2026-04-30 05:53:52.783597+00
050886b6-f9d1-49e1-ad59-e5593f6a74fa	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 05:54:12.361042+00
79a50f03-2a69-4286-83a1-433b8b8cd582	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/players	2026-04-30 05:54:54.180262+00
2c22dbaf-5bb9-40df-99e9-dff5e1db6227	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/player/[id]	2026-04-30 05:54:56.889004+00
3f0b3980-a943-4197-8457-77d7235ccb85	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/players	2026-04-30 05:55:15.269244+00
3077b9e5-2894-4ca0-af6e-9567f2e8e6b4	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/player/[id]	2026-04-30 05:55:17.108928+00
493a3858-4f79-448c-8f19-c93f67187e44	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/player/[id]	2026-04-30 05:55:25.29643+00
5bbad696-f82b-40a7-8c1b-9fff57cccbcb	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/players	2026-04-30 05:55:34.312054+00
98a1217c-5cda-4382-9f1c-0936ed251f72	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/analysis	2026-04-30 05:55:36.536845+00
0a78f8e3-5b4b-41b7-8bf8-24dfdee5c5c6	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle	2026-04-30 05:56:59.954668+00
fd234bb3-d18c-494e-811a-78c77363eca5	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 05:57:54.985939+00
d0825785-d112-46c8-a3bc-c5def6b765a5	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/ligas	2026-04-30 05:58:24.359138+00
8b685a88-1c1e-45f0-be61-5f829891940b	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/	2026-04-30 05:58:26.1755+00
2fd083c0-8b7b-4dea-8759-2f21646b27e6	2f182e63-b41a-40c2-87b8-802611304752	/player/[id]	2026-04-30 05:58:26.196797+00
1621738c-08c8-4fba-8721-11875191f4e0	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/ranking	2026-04-30 05:58:27.487163+00
40f90595-d481-436a-b2ea-631faba1ab5e	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 06:01:02.590742+00
630c1c8e-446a-484f-b5a9-e91f0a8acde1	2f182e63-b41a-40c2-87b8-802611304752	/player/[id]	2026-04-30 06:01:02.758777+00
164996f9-397f-439b-8ec3-bd2e056371c5	19c6a60d-e02b-4d3f-8be6-6ffdc8062ab2	/about	2026-04-30 06:05:31.874358+00
22fee31e-a954-401a-85f9-5cf07cf2de4a	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-04-30 07:09:25.646796+00
c0079849-d490-4659-bf56-6d6d05b860b7	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:10:02.889328+00
389511ae-0ad6-4cd3-bfa0-9061692698eb	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-04-30 07:10:48.985853+00
e4233096-2c94-4379-86ee-be058f0ae525	5e25c9a4-e172-4e70-8cce-201620a83d88	/analysis	2026-04-30 07:11:04.479333+00
18aae667-a1bf-46eb-a894-7d811a9eceed	5e25c9a4-e172-4e70-8cce-201620a83d88	/about	2026-04-30 07:11:07.650534+00
f5398b74-47ff-468f-9c76-3c6ef7410390	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-04-30 07:14:05.888332+00
ef698f8a-608a-4d6b-8e86-4c6be38f4021	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-04-30 07:14:05.895169+00
d36422de-cbe7-41ce-9d8d-24cd48055a86	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-04-30 07:14:13.060368+00
abaed2aa-8ee4-442c-bb91-8f9babafb882	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:14:17.467401+00
c5941976-9e52-48d7-b542-164b50454194	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-04-30 07:14:31.782141+00
897d2ab5-43c0-4497-907f-76fa838ceedb	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:14:33.42858+00
244d570d-bbb8-44ef-adc7-6872016eccac	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-04-30 07:15:19.303884+00
30fdeda7-d926-45fd-88d7-c2d0a37d2019	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:16:11.556357+00
a51059e5-2b82-442f-afa3-81f5bed101ff	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:16:26.646612+00
b4abe98e-ac86-41b1-9a0c-fece596af484	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:16:30.977213+00
89872eab-d383-4982-ba81-8cc14ebffce4	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:16:33.467674+00
6cf976ff-7780-42dc-a2fe-395b30fff855	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:16:50.670544+00
d8f8a0dd-a414-48cf-b7cc-a30a63086618	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:16:52.122453+00
cfc114c7-b6df-4989-a9f0-77ad35412626	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:16:58.476846+00
fe497ac1-6594-4384-a534-803a1276f146	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:12.021994+00
a8cb142e-f442-4b07-bced-ff8db4ac3ce1	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-04-30 07:17:43.25614+00
deb98753-6aed-4933-90a3-d33275549015	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:43.637554+00
98803d6c-f537-47be-8312-a1c8ec521839	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-04-30 07:17:50.933471+00
ab5a7763-d548-4d34-ab84-8fd522ed37cb	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-04-30 07:18:00.468748+00
00d4cb82-13b6-4d56-9385-ab596baa02d9	5e25c9a4-e172-4e70-8cce-201620a83d88	/about	2026-04-30 07:18:01.22982+00
f8fe14fe-fa12-4c53-badd-80fa10ea1ad7	5e25c9a4-e172-4e70-8cce-201620a83d88	/analysis	2026-04-30 07:18:01.426391+00
d6c52b50-226f-4eb7-9218-9341e9198e7a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-07 18:56:21.351494+00
28fddabf-6ddf-43d8-bf85-c1cc5ea6f0de	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-07 18:56:23.998068+00
d2d90c84-b880-4248-b881-4ceab3feb3ef	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-07 21:39:16.314054+00
2159b1ba-d7b0-42ba-87e1-8b4ade78e430	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-05-07 22:46:02.646705+00
d197833c-782e-4b9c-bc2f-44890a124b35	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-07 23:03:16.627175+00
050af4ff-3935-4bbb-a277-ddf8e33b26a4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-07 23:08:48.621209+00
50ad199f-fcac-4727-8eea-bc700f89295c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-07 23:08:49.425638+00
f5dcc1ca-07da-4341-9e39-bd4f165ca292	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-07 23:21:41.44337+00
ee1f1573-9e8b-4592-9ad8-67b617578cf7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 23:21:42.369474+00
b2336c96-a96a-4818-97dc-3e82fbafaa8d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-05-07 23:21:54.862207+00
5a8de43f-f475-46b0-aae3-a43f189dd608	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-07 23:22:13.958733+00
93f9d565-2fd5-4e9d-a961-f0715e107ded	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/domingos-domingo	2026-05-07 23:25:06.629923+00
1c3fafbe-de87-4dd1-aab0-f8cbfba36ee7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-07 23:27:57.460264+00
05f8a184-f554-49b9-b15a-d8f9ff866ed0	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-05-07 23:29:41.518563+00
6e0089e2-0d65-4900-8acf-ee5214de070b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-07 23:29:42.563813+00
dc5971d4-aaec-431b-bf51-9f2dee31802f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-07 23:29:42.577376+00
1dc03845-e9c1-4f5f-9f61-fdeb23a48cc9	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:32:18.783627+00
625260d9-7311-441b-9621-6d16d6e920ef	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-07 23:37:22.401612+00
abe50733-8ca5-4c5a-a3c1-0c07e046b346	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 23:52:41.036936+00
57ac6342-2334-4f90-930a-727eae0916dc	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-07 23:59:39.36556+00
aa7ed437-81de-4bd5-a9d3-a0a70e8f0460	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/matchday	2026-05-08 01:43:12.818794+00
adb18b72-b3e4-4ed9-aab0-4dfe95ad0d8d	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/player/[id]	2026-05-08 01:44:18.301424+00
d9e0d29d-e39e-4a2f-b808-7d9c4da36fa4	2f531fc5-fff6-4417-add9-566b6d51ed23	/	2026-05-08 03:50:01.870201+00
60591396-e888-45aa-bb58-bed1aa2fb190	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 06:14:26.906357+00
83d93e9d-e634-41b4-be13-fdf982f9dbb0	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-08 06:15:56.9435+00
7802d7fc-3a2b-4a26-b83e-335b62ff45a7	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-05-08 06:16:00.847587+00
235c71fe-a156-4c6c-84c2-c39f8fff9b9e	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:16:16.74306+00
9c61e55f-9505-4049-b491-85acc90f1743	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-08 06:16:22.136071+00
ea0322ad-db97-4026-9e88-4406d5f580c3	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:16:43.613319+00
c37f2453-b50f-4c42-b0fb-aadb2797a57a	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 06:17:54.273337+00
7e11bdc3-0c7b-4e52-ba04-dcad6b47c496	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 06:18:40.327375+00
f57ff394-1b0a-4f32-86c0-38ca32270f05	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 06:21:30.895467+00
36c25c54-7f1d-441c-bce8-1b9c7e68c0d9	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 14:02:45.666218+00
50b343cd-1caa-4ae3-8ff6-dae77c41dd8f	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 14:02:46.835069+00
a843e465-b5e6-48f4-9e06-bad1abe9db30	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 14:02:52.088465+00
60660e5c-dde4-411d-9b62-826309b6fe0f	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 14:03:17.769975+00
d0a0ed33-8565-498b-9fd2-3f3aafbcbe44	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-08 14:03:31.428742+00
9b92df3e-ee4e-4d48-8a2e-e5179d17f047	5853c67f-a163-4762-b80c-e46b84435f19	/	2026-05-08 14:03:42.328321+00
16409ef3-a8e9-4026-a334-ec2a8755b9b0	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 14:03:49.549057+00
59ded7ba-31f4-4a67-afe2-86e29bd34222	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 14:18:44.982274+00
add755c9-bfd2-4428-ae8d-bf2b485fa15c	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 14:18:45.075586+00
0e159be3-a2b9-4204-836e-30cf5567170d	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 14:18:50.287385+00
9d1dffbe-8c97-4521-a3ed-34bd80cd9bac	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 17:42:21.01394+00
96d2171b-3873-4b7d-96b7-de66f2707a53	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 17:42:33.686235+00
50f204c5-8247-40e9-abe5-c7c42ffb10e8	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 19:50:40.640656+00
e303413c-b997-4da0-a69f-0415ee1daaba	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 22:03:16.388239+00
08a54379-0ff3-46c4-91ea-3d18e9d944c3	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 22:03:34.671855+00
88f40fa9-1cb1-4535-9ba8-1886a1e1f8bf	5853c67f-a163-4762-b80c-e46b84435f19	/player/[id]	2026-05-08 23:48:53.299608+00
efab44a4-cef0-4556-a7f9-9b6e2e6f63be	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 23:57:07.36799+00
82a3cef4-f6df-4a24-b657-f7f521cf6a85	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 23:57:07.375737+00
dc31600f-0108-483d-a4cb-8d34332b1e0c	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin	2026-05-09 06:37:12.120267+00
ced9a976-afa7-4afc-9cc7-2d8e0f01ddb5	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues/new	2026-05-09 06:37:17.560666+00
46e09411-fa1d-4fef-ac5d-ca1a3988d91e	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues	2026-05-09 06:37:19.21841+00
f2b893f0-9419-47e2-8158-a90b354912a6	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues/new	2026-05-09 06:37:20.563751+00
facbfc31-c71b-4222-ba3b-c2a5ada7dc89	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues/new	2026-05-09 06:39:15.326323+00
e4edc650-df41-4131-a677-6a21efe760a5	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-09 18:09:55.145334+00
ddfe0f00-307d-4444-a16e-02d1d98948ef	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-09 18:10:03.075628+00
f186ab91-e65f-41ac-95ea-4038d9079f67	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-09 18:10:17.829227+00
c8163e4a-f29f-45ef-8ec2-21accf216464	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-09 18:10:27.393826+00
94ef8f76-b3fb-43c7-952e-55802fe2efd9	10ae9597-f5e6-4a43-a38e-0a2f2a3f3a50	/	2026-05-10 02:00:37.550358+00
18975ccb-6ed1-4ddf-819f-129b92de63b4	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-10 22:26:51.26042+00
1fc64027-f67c-4b50-bcc4-406349047dcd	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-11 14:30:41.750334+00
35b5492d-ae1b-44e3-934e-272833ebae7a	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-11 14:30:56.476903+00
dc33f16c-57b9-45e1-9036-fbe0b27cdad8	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-11 14:31:20.089314+00
a0d5b3fd-599f-45a9-bb42-30404d0813f8	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-11 14:31:22.165041+00
af03a3c3-7c28-485e-abbb-a4c40bf77506	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-11 16:46:37.228884+00
cf7fa81f-b1fd-4a7c-806f-1fe26a2dda39	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/ligas	2026-05-11 23:48:46.316992+00
cd6fc68c-a5cb-419b-82f0-cd355f333922	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/login	2026-05-11 23:48:50.06926+00
feee5b82-bc29-49d4-9fe3-5d6361b481a5	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-11 23:49:06.577572+00
c0438d2b-5d92-4cf3-bc0c-7c81aa6ecc2f	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-11 23:49:15.209327+00
38a66cd6-10d8-4b0c-aada-c15478b4adff	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/import	2026-05-11 23:49:17.804313+00
06becb8f-56e9-4176-a98f-69112b7c6f97	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-11 23:49:31.766209+00
9d0e3e4a-e7e8-4b81-a359-c5917d2a557a	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/verifications	2026-05-11 23:49:49.606842+00
f4f452f2-5029-48cd-bd23-54b91482f8c1	4dd1a383-0112-4451-aca6-3247720d1c37	/	2026-05-12 00:31:25.54763+00
9f260016-2954-4e8b-a90d-4fd317c670a3	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:16:21.252316+00
357f417c-9191-49b3-aae5-971c960528fe	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:16:21.258549+00
f28371a1-f027-4dcb-bffe-390a5236d63e	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:16:24.631631+00
f2e828fa-9030-4fa0-92c7-88b7354dda3d	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:16:24.637091+00
58f464c2-2f19-4699-8107-d75d870c0686	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:00.784984+00
fc1ee7ee-f8c9-4dde-87b8-8f2bd648fcd9	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:08.224811+00
245eeeaf-40bf-41dd-b652-12bc7aeae127	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:09.258846+00
aaa91732-7148-44f3-b2be-017e169f6e56	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:13.068857+00
df9a84ee-5e89-4c4f-a3c0-97b670af1505	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:13.72967+00
ffe0e149-5f8b-4107-aa26-2a4ee6dc3aec	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:14.417286+00
7c1d75d2-5049-43fb-985f-bf961133ab2b	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:18.204001+00
2c90d5db-bf12-4903-8c7f-5fccf22174d4	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:21.210415+00
9793af5e-921b-4c4b-9958-bb65737bc491	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:24.227322+00
cc8039d3-b2c3-45c9-9104-16168af0f895	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:26.703416+00
c0df0d5c-0fc8-4168-83bf-da53fb5a8586	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:35.523864+00
2e0a0662-6cba-4dff-a340-95246e1060c6	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:36.727432+00
d0b81935-5412-46fa-aed0-f0857113c2cf	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:38.544394+00
b896be74-837e-462c-a230-2fbd16bfdab5	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:39.300022+00
e1a58bbd-d2f3-4df4-89b9-eb597d8988ec	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:39.896444+00
8f40e8b7-11c6-408a-b24c-39e0a72ea2ac	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-04-30 07:17:41.597608+00
f735e236-1b52-4751-954f-386e914df07f	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:17:42.57611+00
67a20bf5-4c9e-4874-844c-40ac8ac6af14	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-04-30 07:18:02.015712+00
8f703ece-7580-4b6f-a232-065eed6935ee	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-04-30 07:18:02.554721+00
4a3daec1-87c9-4b21-bcbf-23e37414011e	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-04-30 07:18:03.579331+00
32e30aed-1163-420c-a4da-5f60202df22c	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 07:45:29.33488+00
ce205121-9355-4231-b35f-9d4d3dbe28b4	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-04-30 08:16:11.189705+00
537732d7-4f2b-4ebc-a1a8-c9a7d7f63716	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-04-30 08:16:15.199321+00
e301bc74-0e92-45e3-8a60-452ab8ab03c1	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 08:16:17.497425+00
5f613a36-ab1d-4b4b-b1ee-3abc490bbb39	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-04-30 08:17:10.458167+00
ad99b601-9e7c-4c31-b698-b08dffcebe50	1bc456a8-9060-4578-bb25-729f85ac9e00	/players	2026-04-30 08:17:31.27625+00
f4a73102-d15f-4cdc-8bb9-2dd857487b48	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-04-30 08:17:33.247861+00
257b2f03-d279-4e38-804d-0a9dff3f96c0	1bc456a8-9060-4578-bb25-729f85ac9e00	/players	2026-04-30 08:17:46.046609+00
49a0eaca-4164-485a-b394-d1c974adff19	0ad0b44b-b6ba-49ff-b4f3-6ff541d4c1ed	/	2026-04-30 08:49:03.71242+00
d887982a-4951-4b90-b557-e503a0ee42eb	23c63d47-4910-4575-9ee8-d81eb1504b32	/org/terrazas-del-valle	2026-04-30 13:32:34.194611+00
d088732d-c5be-4196-840b-2b23e1cc6457	aba6d707-1437-4187-aa86-b4c346275316	/org/terrazas-del-valle	2026-04-30 13:32:42.241207+00
6c27cf9a-0ca0-4287-a7ea-f3445ca79813	23c63d47-4910-4575-9ee8-d81eb1504b32	/ligas	2026-04-30 13:33:25.431171+00
ef07e4b4-c12c-45bb-998c-7bb6940024e1	23c63d47-4910-4575-9ee8-d81eb1504b32	/matchday	2026-04-30 13:33:55.150328+00
64f8ec6e-8145-40c9-b0e7-8e86aa36723a	23c63d47-4910-4575-9ee8-d81eb1504b32	/players	2026-04-30 13:34:02.51699+00
3726e14f-61c9-4486-86e8-3b0f5bf2491e	23c63d47-4910-4575-9ee8-d81eb1504b32	/ranking	2026-04-30 13:34:04.53799+00
3e4d13af-3f6b-4cc4-b7a1-8b1aa4904db2	23c63d47-4910-4575-9ee8-d81eb1504b32	/ligas	2026-04-30 13:34:45.285189+00
ecd360ed-579c-4b69-9b56-d8fa1508448f	23c63d47-4910-4575-9ee8-d81eb1504b32	/players	2026-04-30 13:34:50.930468+00
0a528ab1-dd92-4a0f-94d2-d15d431971c1	23c63d47-4910-4575-9ee8-d81eb1504b32	/ranking	2026-04-30 13:34:50.970913+00
7700b76f-34a2-4f92-92e1-97dffff55ad3	23c63d47-4910-4575-9ee8-d81eb1504b32	/matchday	2026-04-30 13:34:51.839067+00
2936e735-7068-4d41-ba9d-094d8563a4a1	23c63d47-4910-4575-9ee8-d81eb1504b32	/analysis	2026-04-30 13:35:02.801525+00
c3eea1f4-c4f4-4b6c-85e1-bd58a5ca789e	23c63d47-4910-4575-9ee8-d81eb1504b32	/ligas	2026-04-30 13:35:02.806658+00
bce9b867-992b-46d3-99c5-b98fcdecb636	23c63d47-4910-4575-9ee8-d81eb1504b32	/analysis	2026-04-30 13:35:02.810429+00
22a34a6f-00f8-4f54-9d86-03236e94ee15	23c63d47-4910-4575-9ee8-d81eb1504b32	/org/terrazas-del-valle	2026-04-30 13:35:03.299673+00
d8849845-6266-4ea6-89e4-35602534b387	23c63d47-4910-4575-9ee8-d81eb1504b32	/ligas	2026-04-30 13:35:03.676124+00
6b60d051-67ee-45d2-9ff2-64d2623ae3bc	23c63d47-4910-4575-9ee8-d81eb1504b32	/org/terrazas-del-valle	2026-04-30 13:35:03.885697+00
b01190c6-28bd-40d7-a5c0-db859c3b894e	f6b8c9e2-fc5b-460b-9db0-0fac3e891b7d	/	2026-04-30 14:00:50.422434+00
ab3ee16d-ef57-4daf-b26d-186bdf85c2b8	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-04-30 14:20:46.739596+00
27560a1e-3cb5-472e-a34c-d689e51b1ba4	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-04-30 14:20:50.187225+00
6e000cd2-70f0-4187-a896-4f37395007c6	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-04-30 14:20:53.986611+00
472e1c3e-6098-4339-8101-a26440d00726	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-04-30 14:20:59.515077+00
bdaa59a8-02ad-4913-bc37-f379ca4a4771	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-04-30 14:21:01.017279+00
3b879934-81a9-40f2-b392-cd711de53520	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-04-30 14:21:05.838333+00
711ca6f3-ad19-4c5f-95d0-b9918a5e46d8	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-04-30 14:21:08.704221+00
f128a75c-9cfc-44c7-b948-a05ef24faab5	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 14:21:16.027787+00
465a3447-b95e-46f4-bf6d-c9ff6186b3be	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-04-30 14:21:32.830813+00
e152d10c-9cbb-4b1b-9b6a-14bab58dd158	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-04-30 14:21:42.130076+00
b4217c7e-8f05-412f-81e4-e88b484bb5f0	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-04-30 14:22:13.797652+00
57bf99c1-b56d-4e14-aafe-c4f693a689f3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-04-30 14:28:59.021937+00
19a0a41d-1ad7-4ba3-adec-f637e6b27806	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 14:29:20.883501+00
dbe217af-ff61-4dd6-9345-14b20e97671b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-04-30 14:29:35.961767+00
842ac3bf-e1cb-4055-a1db-5a4710b3f612	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-04-30 14:29:44.016051+00
b67ec400-307e-4294-b5f0-c1df4305ac3a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-04-30 14:29:50.159034+00
6b29aa59-916b-4dbc-a2dd-a2efcb6b2838	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-04-30 14:30:58.892517+00
2698ee1b-0ee8-4860-b307-ac7679256ddc	b0de923b-5624-4e8e-be33-956f8bbf360e	/org/terrazas-del-valle	2026-04-30 16:18:45.739628+00
a7b5801c-08d6-44a4-9a8a-3d4cebf46db0	4c5d2586-5cf8-49b1-8109-dc85f31019af	/analysis	2026-04-30 16:33:28.671256+00
5d04c511-0bc0-4deb-ba58-fec0a6188258	4c5d2586-5cf8-49b1-8109-dc85f31019af	/ligas	2026-04-30 16:33:41.811561+00
034db017-c7c0-4b8b-b9ff-eb046c4b9e28	4c5d2586-5cf8-49b1-8109-dc85f31019af	/org/terrazas-del-valle	2026-04-30 16:33:46.553135+00
d4fdbdfa-c3d6-401c-9303-59590a9da563	4c5d2586-5cf8-49b1-8109-dc85f31019af	/players	2026-04-30 16:33:49.691911+00
c02204bc-9a23-4ef6-80fe-56574dd97c93	4c5d2586-5cf8-49b1-8109-dc85f31019af	/ranking	2026-04-30 16:33:50.712857+00
8ae5a36d-66dc-4db9-af0c-f43276a86b21	4c5d2586-5cf8-49b1-8109-dc85f31019af	/ligas	2026-04-30 16:34:01.823147+00
792e0669-1dc5-4c74-8a4c-b97acee7245a	4c5d2586-5cf8-49b1-8109-dc85f31019af	/analysis	2026-04-30 16:34:03.651489+00
4eb9eb11-f880-4ffb-b3bd-830176ae3463	4c5d2586-5cf8-49b1-8109-dc85f31019af	/	2026-04-30 16:34:05.005235+00
4521b633-d1f7-49b1-8295-c25413e38ebc	4c5d2586-5cf8-49b1-8109-dc85f31019af	/ranking	2026-04-30 16:34:09.098061+00
82a572f3-03df-4949-9fd4-ab481c45578b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-04-30 17:30:39.532328+00
e188633a-286a-4ef2-aca2-9775d895a574	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 17:30:53.513161+00
74c22b64-0486-4c20-9743-bfef98f8c79c	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 19:22:34.002703+00
c2292774-3247-4c42-9959-a934d7c066bf	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 19:22:34.455064+00
987a23c7-71ca-4a49-b2ce-da20f226b270	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-04-30 19:22:41.016811+00
f9db9dc3-47b0-4418-84c9-74823e87541b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-04-30 19:22:44.787164+00
75c8a9f9-6168-4633-b0bd-8ca8b75afae3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/new	2026-04-30 19:22:48.001232+00
1a29375c-f525-4568-8b8c-68715c857f1a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/e01fb0a1-597a-4d82-be66-741d84549ddb	2026-04-30 19:23:02.708842+00
e026e49e-fa28-44f2-a1f3-e363f7d9b3f0	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-04-30 19:23:06.848203+00
63042794-e169-40f1-9412-306555dea484	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 19:24:33.781945+00
91c5c319-4ebe-4535-a01a-31acc7678827	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:24:35.02368+00
24f110df-6edb-46fd-82da-0e92bc3962e5	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:24:36.936029+00
eefb5f11-2409-4585-9315-712077e159f9	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 19:24:40.758475+00
368b7091-d935-4ea4-b6e6-1502cbfcdbfb	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin.	2026-04-30 19:24:47.540942+00
11f4e273-6c29-4d77-9611-29a615fddd85	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-04-30 19:24:49.242329+00
d2ae4401-bc03-4662-a107-dcdde9ec0e0f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/e01fb0a1-597a-4d82-be66-741d84549ddb	2026-04-30 19:24:52.80509+00
855811dd-5df5-4ab6-ae26-1ec295450e29	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:25:04.700194+00
579fee41-0ca7-49b9-8165-6fc356f26639	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:25:16.501282+00
ae45b250-7eb8-4439-82e7-7696fc695560	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:25:19.306677+00
875d5d80-d0b9-4117-b5b0-4eb49daca230	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:30:12.28674+00
648d2515-16bd-46bd-b72e-485683a42b2e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:30:20.691058+00
b031949d-ba92-4899-8ad7-3485228d04cc	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:30:20.858722+00
c6977f2c-e088-4f73-ad01-c37463911a21	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:31:17.667354+00
20777490-5099-41c6-96cd-f25cfcdf6562	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:31:51.418357+00
81138d46-5172-4006-a19c-85ef24775e50	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:31:53.146241+00
e0d14665-fbde-43aa-a6aa-636c5b383b8c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:31:59.536746+00
5933ecfb-8a2a-42cd-80cc-024c6b67a423	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:32:01.168511+00
c037042e-d39c-4cd7-b6a7-89b1219142cb	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:32:01.432034+00
b985196a-b623-4367-800d-2d4734723875	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 19:32:02.498764+00
b0df971f-bead-4a16-979c-b9771d0f01a3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:32:03.423256+00
c34d1cdd-aa7f-4b1c-9fb3-e6502cc357db	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 19:32:05.779009+00
d4df981c-bcea-4549-9818-ca2fb27c8f74	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:32:07.831187+00
ffe9d69b-b547-403c-b503-65bfb635aa36	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:32:08.979008+00
6a8130e2-b177-4f99-83c2-b3d5ff1e6a68	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:32:09.925686+00
3faa2b34-aa9a-4100-b88d-e65c7e1bfa45	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-07 18:56:25.326151+00
af59b8c1-a991-4550-bfe4-5560b191d8a3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 18:56:27.928688+00
df709ac1-4ca9-4b17-aaf9-1644ce867e5a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-07 22:26:09.851071+00
35b70524-94ad-4099-a333-15fc176efec6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-07 22:45:27.479613+00
897eff8e-e3e2-4016-8493-1816f3c62f55	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/domingos-domingo	2026-05-07 22:46:02.752902+00
9b623142-c1c8-48e2-a449-5fc42bad3039	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 22:46:02.757726+00
e50c5454-7ec5-4fea-aae0-bea044b044a0	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 22:46:13.403231+00
59563c84-2f08-4817-b076-9ef28e281e62	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-05-07 23:08:47.695607+00
d7749391-6ab5-49b4-8dce-1a91cde2c151	518d16d6-338c-4454-83a0-a5b93bc7e6eb	/org/terrazas-del-valle	2026-05-07 23:27:58.541258+00
afd31a1b-ba20-41dc-aa97-e7a7e18d79e1	253878b1-e229-4a3c-910f-d11580ae2966	/org/terrazas-del-valle	2026-05-07 23:27:58.740819+00
dc29d1d5-15d4-453c-a8e8-4b14c475500a	3170085e-5f4f-4e88-a6cf-9c40ffd27920	/org/terrazas-del-valle	2026-05-07 23:27:58.991478+00
85884a92-e2ba-4920-a4a9-086e7c9692e6	5c02194d-68b4-48d2-938d-a3201dd3df74	/org/terrazas-del-valle	2026-05-07 23:27:59.240632+00
08b979a6-27f5-4940-a3d1-4176da44fbd9	cf6ec028-418c-4c66-85c1-7284de45eae4	/org/terrazas-del-valle	2026-05-07 23:27:59.264909+00
4b3127a1-bba1-4583-85a6-7d7d6ca34618	72eaab2d-0bae-49b2-8650-410eb01496de	/org/terrazas-del-valle	2026-05-07 23:27:59.38974+00
3a20f6fc-bf13-42dc-80f5-663aa8e7b242	88b5b300-b473-4114-92de-daa2a992a4b1	/org/terrazas-del-valle	2026-05-07 23:27:59.46623+00
9aa598ba-c10d-4912-acea-9f692a5b64a0	9c119e2e-44d5-438c-8623-567634e0938e	/org/terrazas-del-valle	2026-05-07 23:28:00.792415+00
706b5c5d-a5b6-4b1b-b3e0-b2704f474875	29cd887a-99d3-4658-a585-56c213f2f54b	/org/terrazas-del-valle	2026-05-07 23:28:03.397008+00
042f4633-f288-41e3-b570-d1d603de93da	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:36:16.971356+00
542e8785-ec49-48de-ae1e-f1ed728c1e0e	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/ligas	2026-05-07 23:36:26.310149+00
11cf47ba-c9e2-4533-80b7-509e8e76ba41	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:59:00.354929+00
dae88d5f-cbd7-4fcf-b2cf-95761c820b80	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/ligas	2026-05-07 23:59:03.503973+00
9f4b1afe-2244-460c-8f97-266846a4b943	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:59:04.817869+00
88231b35-9805-4d83-a073-199f49ade64c	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/ranking	2026-05-08 01:44:05.911394+00
43f79e12-0cdd-4ac6-adf7-7854e44d375f	b43ea301-b3a4-4ebc-b04e-054c95f0ddc8	/	2026-05-08 04:45:54.241151+00
d134487a-bb45-44d9-b1b8-29c21298702d	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 06:14:56.08964+00
f28d618a-6fd3-4047-bd3a-f2a10d8890f5	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:15:47.046329+00
dd6386a7-344a-4dcd-8d8c-15de2b5d938a	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-08 06:16:02.301182+00
78deb73a-627f-45cd-bc24-b6847cc2b0cc	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-08 06:16:14.168673+00
feea6fe4-3066-4677-97b5-54654365578f	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:16:30.614673+00
9345f632-a996-4443-a116-3cdd3383ba97	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-08 06:16:40.768252+00
53d83811-26d1-4edf-a86a-1620cc5a2af6	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-08 06:16:47.817991+00
beaaf56d-3761-46a7-9722-37dfce0ab340	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-08 06:16:50.03151+00
3e642533-576c-4c47-a967-540748a1e68c	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:16:51.863678+00
081c0a8a-4517-4aee-9af1-54f13a92f1b0	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-05-08 06:16:54.83423+00
9879957d-2b0f-4c5c-af9d-b98f7e085921	5e25c9a4-e172-4e70-8cce-201620a83d88	/analysis	2026-05-08 06:17:05.738423+00
f54ea0e7-b066-421d-82a8-7b658d2de8a8	5e25c9a4-e172-4e70-8cce-201620a83d88	/login	2026-05-08 06:17:06.991382+00
65a9c723-013f-4c88-a5d2-0fe87c2ea76e	5e25c9a4-e172-4e70-8cce-201620a83d88	/analysis	2026-05-08 06:17:09.585524+00
8dbc2648-f440-474e-a04d-0186994d5f6b	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-05-08 06:17:10.843453+00
92f1539e-fdd2-4645-81ea-5c696f164103	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:17:13.780791+00
75f74289-cffb-4270-8958-dadb6caf15a6	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-08 06:17:15.625752+00
d189f27e-64ea-4c8f-894b-bfdda3574899	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:17:30.596757+00
40fc7a1d-0aa8-44dd-8c87-417a2fadd046	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 06:19:18.600223+00
bd5b7a53-b5b8-4fa5-9548-7a159658a8bf	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-08 06:19:20.624685+00
a5b695f6-1f45-43b8-806e-26159c52b052	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 14:03:17.803516+00
a0777cee-9f6a-46af-a308-720d3e91d66d	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 14:03:27.271723+00
b1d9d04c-2055-453c-baab-1402dc733f71	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 14:03:29.3342+00
54ed3447-3136-424a-b8a2-c674d2f3ce64	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 15:07:58.913129+00
b4759a91-31bc-450b-9ec6-7fc1227acd06	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 17:43:01.757262+00
93ea82b3-4ac8-4172-b3dd-08901fcf3a91	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-08 17:43:03.420149+00
282a6437-e1a7-4250-aa75-4014612d6dc4	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-08 17:46:17.812198+00
aa023b0e-e588-4a26-845f-0cfc47ed5b76	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 20:46:10.891715+00
2b5fe2c8-f0d3-4a51-8966-a3960465b98f	5853c67f-a163-4762-b80c-e46b84435f19	/	2026-05-08 22:58:23.888166+00
654eeece-9306-4f14-bd5b-f36b030b3042	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-09 06:25:07.701146+00
9b608f18-ef35-449f-bdfc-26655233d17a	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/matchday	2026-05-09 06:35:34.808341+00
f242812a-dc4f-496b-a4f1-aa539796c404	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues/7f4a371e-05a1-4240-bf3b-afd47c8592a9	2026-05-09 06:39:32.464319+00
f62a67d7-3824-4c21-a93b-151edf184612	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues/7f4a371e-05a1-4240-bf3b-afd47c8592a9	2026-05-09 06:40:06.5584+00
c614c6f2-627d-4438-bbd8-dc49ef3f3f78	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/organizations	2026-05-09 06:40:13.414485+00
7bbdbb2c-b1d1-480f-b53b-1ff28766e4e5	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/organizations/c985320f-5636-4c76-8cce-933da695c41f	2026-05-09 06:40:14.321176+00
64188fdd-f79b-4b5e-a567-555487632c38	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues	2026-05-09 06:40:22.091879+00
ace525e6-4614-4acc-bdc2-8856225e1761	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/teams	2026-05-09 06:40:24.157369+00
8668c4a7-511b-4e5a-94c5-7f5c208fe38f	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/players	2026-05-09 06:40:32.09819+00
90b6da69-7391-46c6-8139-9dbef54a67e6	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/analisis	2026-05-09 06:40:34.637521+00
978897bc-c590-40df-92b1-b2f8a5aa998f	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-05-09 18:10:17.198356+00
2a0fed5f-d8c3-4589-9aca-b55638c4e455	357d77dc-b55a-46d8-a2ed-5916277d0690	/	2026-05-10 02:04:20.211641+00
cfdcb590-1690-499b-974d-e74e19a15d86	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-10 22:37:26.975116+00
3a44dd31-1eb7-40e4-8ba1-f47155204fb1	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle	2026-05-11 16:04:46.116519+00
48f89613-c44d-456a-92bf-4323af1f2361	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-11 16:04:50.432607+00
6dfcec21-d3a6-43eb-9028-4152850484e6	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-11 21:31:24.938673+00
72951780-5715-4b72-b56c-737a15a83393	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-11 21:31:30.649547+00
9ae9e40b-56ac-4d1c-a844-12ca1afdc2d9	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues/7f4a371e-05a1-4240-bf3b-afd47c8592a9	2026-05-11 23:49:10.447974+00
e58bbc0c-fbdf-424b-8be0-28259acc57f8	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-11 23:49:28.47387+00
b10ef568-4936-416b-acd7-d2c492ac9803	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 01:24:50.763488+00
b7c52f4d-3f93-409f-ab77-9ad45ad7b65b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:28:03.0939+00
85453aa9-baa0-4c44-ac33-cf831d740ba6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:28:03.125324+00
a9c841fa-d89e-4f7b-8f31-cc7464c2c4bb	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:28:06.489457+00
372dacd5-b4f1-4837-92a0-a16d8a295528	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:28:34.60059+00
f8684695-11d9-4d43-90fe-c0b4f74ecf8b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:29:49.620022+00
e6d77149-beeb-460e-a921-7481aa2c2486	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:29:51.512629+00
8598797e-8e76-467e-aa3f-ce6dbdf947f0	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 19:29:53.751783+00
6d081bfe-3fba-4085-abb0-0eb5e9c8ed9c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:29:55.185225+00
02b9c269-b778-4296-b756-7d6ae4c69dfb	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 19:29:55.626099+00
573d3e87-337c-45d0-9ca4-13c3ca88a50b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:29:56.422596+00
16f2fbb6-980b-44fa-85e5-5592aada3cb4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:29:57.437791+00
f722743d-2b3c-48a5-a387-9ee1f93cead0	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:31:22.690785+00
63009c45-0d4f-4668-9ffd-d6aafe124e0a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:31:39.576485+00
cbd794a1-ca58-47e2-b8c5-4c72fe2705f2	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 19:31:45.343514+00
4e59c63b-870e-410a-b59e-857cfed32635	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:31:45.450173+00
ad5addac-aac0-449c-b5e0-3e9cdf63e581	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:31:47.810812+00
519ae8ac-de13-44f5-99c0-8ae4dba2eea6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 19:33:45.724737+00
0d4ee446-aa83-4a43-8d40-409e798e3e91	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 19:34:48.948762+00
396e41b8-6c44-4615-bb8f-1cb46f485f9c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 19:34:51.665014+00
8c4eb04f-d875-4d40-9e7b-7768ba1ecd08	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:34:51.746514+00
b11533b6-0ef7-4af6-b31c-17322261d0e6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:34:55.549385+00
adab6ad2-4fc7-42ec-9db7-267ca95bc1e4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 19:34:56.466146+00
87b1b092-267b-44a8-b71c-919e4ad11aea	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 19:35:59.754929+00
39c3b8f6-26c2-47ee-a471-129573643920	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:36:04.645321+00
ceab448b-8420-4198-b6c0-193dc309ee8f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 19:37:30.263263+00
49598da4-57f3-40e9-9bb0-f5de373421a2	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 19:38:21.606422+00
ca04929e-603c-4558-abd8-9b0a923cbc27	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 20:20:16.901669+00
4520407f-832b-4359-9a1d-c616ef36f9cd	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 20:20:20.521943+00
b99e2642-a71c-46db-88fa-4c8ee5997ff1	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/org/terrazas-del-valle	2026-04-30 20:21:10.867136+00
b0a296a6-859e-493c-97de-ced61a94baf6	45f5afca-87d9-46a8-aa80-51ff4fbdf07d	/	2026-04-30 20:29:58.44936+00
a3784c93-0a62-4ebb-8439-b8dfe3e6e30a	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:31:07.693361+00
2d3d496c-b443-402b-8c4b-e3f46259ca8b	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/org/terrazas-del-valle	2026-04-30 20:31:07.699172+00
8b3dbaa8-5978-40b3-96f6-edbbf21e8823	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:31:09.297436+00
911967c9-5dd5-4c40-8b4e-bca468b71aa7	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/	2026-04-30 20:31:10.816633+00
f1ac4137-0c6d-4f13-9628-798aeb0a8015	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ranking	2026-04-30 20:31:21.391984+00
edb63367-4544-4700-b0ab-cfb49b64c0da	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/matchday	2026-04-30 20:31:32.881043+00
90886586-cd0a-450f-a576-aa0e19deacb9	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ranking	2026-04-30 20:31:40.74285+00
00c2ba6d-886b-4595-acc2-9d5603d743c9	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/players	2026-04-30 20:34:29.170134+00
1b55413a-4d9c-45cf-a87f-8161dc23f0f6	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/matchday	2026-04-30 20:34:29.19776+00
705543ca-5b1c-4337-a14e-6f7fe28b3191	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ranking	2026-04-30 20:34:30.596681+00
7e250b03-aee5-4b28-876e-755320cce205	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/	2026-04-30 20:34:31.874927+00
231a8569-5925-4f38-9143-46d2618dfe58	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:34:36.123391+00
f0e7685d-f433-4a71-be58-766074a4b9c9	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/org/terrazas-del-valle	2026-04-30 20:34:41.156335+00
3a2c7848-f8de-42fa-a0c8-13444e0bdfd9	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/matchday	2026-04-30 20:35:29.371886+00
727917e1-91e1-4f3a-bb92-75e292dd30c9	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 20:44:48.569648+00
a3642215-567d-4328-a98e-dd5dd498bfde	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/players	2026-04-30 20:45:13.353884+00
f7272084-a742-43ad-bbe5-f993ec2a3233	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/	2026-04-30 20:49:06.192954+00
00f6a101-7a67-44b9-a95e-bca018701026	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:49:12.707566+00
729bcdec-c3b5-4de8-a877-59e6309086c9	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/matchday	2026-04-30 20:49:14.295154+00
bc3f4f69-16fe-4dc7-bf8c-b0ec63b425f2	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/org/terrazas-del-valle	2026-04-30 20:49:14.302019+00
a0aa42e1-f780-4236-9c60-eb3715295ec6	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/matchday	2026-04-30 20:50:13.018323+00
1d6de4be-4288-4270-bc8f-0a38288d90bb	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/	2026-04-30 20:50:16.55241+00
480ebc10-a841-4f5e-9cc0-617a7a24753f	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:50:19.496367+00
108ada5c-a6a5-4211-8c0d-e80cee9568e6	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ranking	2026-04-30 20:50:21.717352+00
f8fd11b9-7ea3-4e88-bcce-2669ce2f1573	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/player/[id]	2026-04-30 20:50:31.551182+00
929d2716-3d06-475b-9ce9-55b3489b9ee1	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/about	2026-04-30 20:50:47.821148+00
287315f7-9186-4b2a-b09f-383f5152ca1a	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/org/terrazas-del-valle/liga-femenil-viernes	2026-04-30 20:50:49.229744+00
4f3b29f2-42af-4db9-b80e-ea6d6cc760a3	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ranking	2026-04-30 20:50:49.245021+00
2a3ad9cb-f3ba-4498-af95-fdd86f94d519	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/ligas	2026-04-30 20:51:10.503683+00
fa1ee02f-7bf3-4e7a-8ea7-acfd29c618fc	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/	2026-04-30 20:51:57.839223+00
bed99af7-269a-4ebd-9868-62b3150cfcd4	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:52:04.364321+00
284118c0-4101-4d34-acf2-f524c0dbfb08	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:53:07.105825+00
64bc30bc-1e85-4e70-95a3-983bfcf16340	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/org/terrazas-del-valle	2026-04-30 20:53:07.110781+00
aa8a00f5-8fa0-42f6-ac9f-60d4ab53459e	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/ligas	2026-04-30 20:53:07.114616+00
37804fa8-d906-4f4f-b40b-9817d81925a1	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/about	2026-04-30 20:53:50.084492+00
9eabe9ff-fa49-4a1a-af31-5ad35e301d7e	b5b51fd5-8fc1-4863-a438-3ac8fee50549	/	2026-04-30 20:54:59.233432+00
3175f967-e7f1-41e3-a7af-68a757414c80	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 21:32:47.553068+00
f7cb9a57-f797-4caa-af34-f76c195f4a4d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 21:32:51.368325+00
47bbbc8a-143f-494c-aeac-a2c3cad84e09	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 21:35:01.00811+00
214f2f73-6e68-436d-91b6-6ccd498dcf39	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 21:59:00.588139+00
1333493f-f4c8-4528-b5ce-a29b6a090064	2f182e63-b41a-40c2-87b8-802611304752	/matchday	2026-04-30 21:59:25.591191+00
4ad8faf4-1b5a-4d2c-b1a3-b82b0aa37295	2f182e63-b41a-40c2-87b8-802611304752	/analysis	2026-04-30 21:59:55.615084+00
7031d41f-3a46-49b7-a39c-1f8f2e0f30da	2f182e63-b41a-40c2-87b8-802611304752	/about	2026-04-30 21:59:58.423244+00
29ad6985-c47e-415e-805d-deaa46610730	2f182e63-b41a-40c2-87b8-802611304752	/players	2026-04-30 22:00:02.272934+00
389feea7-9e3a-4106-8cca-073ec85df3cb	2f182e63-b41a-40c2-87b8-802611304752	/ranking	2026-04-30 22:00:07.128208+00
5b873d52-0b92-4b05-9cc3-07e62dfbd8be	2f182e63-b41a-40c2-87b8-802611304752	/ligas	2026-04-30 22:00:15.264769+00
5bf0b8e0-13d3-40d1-9f34-c2cdff16151e	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle	2026-04-30 22:00:19.764343+00
30951cb9-c7e2-4d36-aaa6-85ec465e3a08	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 22:05:05.627166+00
08c6e940-c428-47da-8075-241d7be2a2d2	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 23:41:01.33169+00
f6e30255-1627-47b2-8ca5-aebdd3e6a5a1	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-04-30 23:41:01.698419+00
dfd98fa5-f03a-447d-9bfd-f74d9953a2a3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 23:41:37.502548+00
ceb7b656-a7a7-4e56-803f-a0f9d78da0df	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 23:41:37.506474+00
bba5b6db-8032-4582-a85a-f0b9f90c6bde	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 23:41:52.961351+00
68fe8a35-629e-4ccc-99f3-f9d2fa9c1831	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 23:42:02.683346+00
da4b7e3a-b83e-400c-887b-81d76a363475	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 23:42:08.95649+00
ce834335-a070-4ab0-93d6-014fb8145f63	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-04-30 23:42:33.313779+00
14ae0cee-7f3a-4bd7-8dae-beeee218af3b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-04-30 23:42:33.667976+00
5dd04046-75b6-49d9-9939-9b2d2fc5444e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-04-30 23:42:36.719715+00
6bb8e671-3740-4835-bb74-05f74e9f27af	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-04-30 23:42:42.411808+00
78facccb-3a6e-41c3-b910-880e9a3d7053	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/analysis	2026-04-30 23:42:45.199013+00
faf752ee-0e3f-4075-84f7-78c2cfea8021	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-04-30 23:44:49.109281+00
12b747eb-b764-4195-9881-21dfe56b06f8	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-04-30 23:44:50.263269+00
b277f1d7-a779-4306-b232-13f1a1caa19c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 23:44:50.278798+00
6dc0ffce-472a-4e77-a659-778d590485ad	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-04-30 23:46:00.226708+00
45745655-52d7-4ac9-bb0f-02288093ec73	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 23:46:00.458045+00
d612eec3-9cd4-4b54-bf47-7766f74df208	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-04-30 23:46:54.908491+00
6ac51491-b99f-4c9f-8634-d26731318f57	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-04-30 23:46:54.912356+00
816484cc-4f6f-433c-b6bd-dc7ca92c3c66	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-01 00:06:55.080468+00
d5dc533f-5c99-4286-90c2-b6f382078f52	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 00:06:55.427325+00
d33233d4-c5a0-4122-a216-f7ff5f630fd9	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 00:06:56.871615+00
575ec8c0-d714-486f-80c1-8344f0b1de55	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-01 00:09:03.576392+00
6af7117d-5b40-4d0b-a16f-b041dbbe5fbc	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/new	2026-05-01 00:09:04.971048+00
357523ff-6641-4a51-b35e-6f2ea9d80036	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/960ea712-fda0-4902-b02f-6897890b34f6	2026-05-01 00:09:15.656226+00
240577ce-5623-4b84-89f2-736e668e4b22	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/analisis	2026-05-01 00:09:23.146388+00
7b4838a7-c2dd-4cf2-90d4-64e51583c89d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 00:09:23.878045+00
27f395dc-9e6c-4f8f-b067-305fc805271d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 00:23:13.640863+00
6ae5f36a-bb08-4fac-9588-cd2cb047c52b	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 00:25:34.555962+00
5227880b-09a1-4bdc-99c2-c10a233fe69a	1bc456a8-9060-4578-bb25-729f85ac9e00	/login	2026-05-01 00:25:45.389909+00
5b0766b3-a6aa-4ff5-8fd6-9bc2ba7345ca	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin	2026-05-01 00:27:04.525993+00
83f9d481-7a9d-42c1-a9cc-8e00f5596ce9	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin/leagues/960ea712-fda0-4902-b02f-6897890b34f6	2026-05-01 00:27:24.218616+00
0b8f2141-348f-41ac-8697-8a80f1d1c6b0	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin	2026-05-01 00:27:30.042381+00
46c30205-4f6f-42c7-9531-7794f256743d	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin/import	2026-05-01 00:27:33.183596+00
631577b5-ab61-4eea-9f1f-324c344f457f	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin/leagues/960ea712-fda0-4902-b02f-6897890b34f6	2026-05-01 00:30:27.58957+00
773b2ac0-5102-4e9a-9393-93ed2bd5d321	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin	2026-05-01 00:30:38.192789+00
1be81526-62fa-4f98-aab7-e357d84432bf	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 00:58:02.529963+00
5854df8b-5fba-47e1-87bd-74866f5d5554	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 00:58:07.698436+00
2c620db9-b453-496f-9a2f-53290dd6f5d8	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 01:02:25.598425+00
6377fb7f-5f6c-4137-9e1e-afaa3fcc5aff	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-01 01:02:26.0809+00
301adadf-7fda-49a1-8454-7342b008948a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 01:02:28.275336+00
02e1725e-2ae9-41c0-a8b6-5e335b2fe8a3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-01 01:02:28.715177+00
c2a0daa8-bc96-4c7c-872b-8379bf23e97c	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin/leagues/960ea712-fda0-4902-b02f-6897890b34f6	2026-05-01 01:06:00.422464+00
f49d4abc-ce8d-4b85-81e9-5db689cb7792	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:08:10.28263+00
ac4cb56e-4e91-4ed1-8779-6b9e1dd1f8c3	1bc456a8-9060-4578-bb25-729f85ac9e00	/ranking	2026-05-01 01:08:41.585708+00
cde0d3ae-0be0-4226-8d21-182a6df47bb2	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:08:43.710114+00
85dbc01c-dabb-4d53-9573-67c88d886a16	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:08:51.18118+00
6a05fd6a-d1ec-44be-9645-bac49c7d956c	1bc456a8-9060-4578-bb25-729f85ac9e00	/ranking	2026-05-01 01:08:57.766054+00
8e4998a1-9b75-4062-a741-54799f582c57	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:08:58.647538+00
e9e41554-ece6-4f3a-aa7a-6ca04ac08ea4	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-05-01 01:08:59.232115+00
3434e899-aac9-457c-9f7c-50bcc73fe443	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-05-01 01:09:00.123523+00
c11cc740-337e-4104-ba71-d69273658985	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 01:09:03.445778+00
da7d3edf-9a6a-4630-9f52-7fd69d37d72d	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 01:09:24.161067+00
29edf00f-003d-4dab-a1a3-817ef704b014	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-05-01 01:09:26.211912+00
05082550-37e0-464f-847e-40faf8b953d5	1bc456a8-9060-4578-bb25-729f85ac9e00	/ranking	2026-05-01 01:09:30.790333+00
763c2170-3fbb-48c6-afca-f0551cbe6076	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:09:30.793432+00
a449c185-b54b-4b56-9e2b-55378020f52b	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:09:31.178656+00
bae9f4d5-98e5-4e87-8dbe-9768cdafc109	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-05-01 01:09:42.481909+00
7d3c0b3e-7b40-4f94-8a5a-99f251ca10be	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-05-01 01:09:43.281234+00
79b46ec1-e076-47f1-ba8a-43fd0555211a	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:09:47.303078+00
9b50ad54-8d98-4486-8014-3286539e04a9	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 01:09:47.468587+00
b5b40317-a719-40dd-a4a4-6a078e64ef94	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-05-01 01:09:54.767184+00
256745fb-a965-4053-8ea7-fc0b91cd3529	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 01:09:54.808898+00
82106148-1159-44ca-a034-befb39375a46	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-01 01:18:20.597631+00
ae9f258d-bd6c-42bc-acab-ef12c1c3cf4a	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-01 01:18:20.868266+00
2a5b9be9-55ad-48b9-bc98-9885c1cbe4bb	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-01 01:18:23.074005+00
6ae64704-0216-4e77-bc2e-dc729f28adb3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 01:18:26.479129+00
938ec074-1bc9-4ed6-9c8e-56b32ea666bf	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:19:20.058023+00
4c715dd4-9b3c-4d05-9f86-aabd82407ed3	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:21:56.333329+00
ff8ca000-0e48-410b-87cf-e2cb26799333	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 01:23:33.912589+00
50cb425c-07fa-4ade-ac1d-e016492c84cf	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-01 01:25:17.759541+00
2d0bc455-0833-42ad-8ce3-89217059ce06	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/demo	2026-05-01 01:32:17.022613+00
566abad2-b4a7-4c61-9aba-99c5519145e4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 01:32:22.379811+00
9d18f677-511b-4203-b503-2ac2b67ee428	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle	2026-05-01 01:36:42.536382+00
933130e5-76c1-44cd-a2d5-4f7d4b5361fa	5307b556-17f6-4bd5-bede-3968d1d5e44d	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-01 03:01:56.438782+00
6107ab64-9e30-4f9c-b556-2cb6af7de932	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/	2026-05-01 03:22:03.284827+00
89d38352-f06a-4d0d-aee6-d59b1ba13622	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 03:22:57.273305+00
f4db0fe4-daf8-4ddc-9e70-f0be871540ef	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/org/terrazas-del-valle	2026-05-01 03:24:06.068525+00
f601e0ba-dd59-4314-a79d-0145ac8fe560	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/ligas	2026-05-01 03:24:07.97674+00
4c910914-65f0-4758-b871-eddf550c1dd5	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/org/terrazas-del-valle	2026-05-01 03:24:21.048785+00
b23c6a13-2ab5-4c9f-a29b-5e7f5a12ae3b	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-01 03:24:33.594927+00
2e099bb6-ed76-4c12-8cc7-1c409c5bedd0	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/player/[id]	2026-05-01 03:24:54.314255+00
d3dc2140-472c-42fa-989b-67741a7127af	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-01 03:24:54.31905+00
07e8c22e-28bc-4b11-8c8d-5a0c415007e3	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/players	2026-05-01 03:25:12.191732+00
516682fb-b504-41c3-a630-8832067e69b1	47bdc71a-3f29-4878-a948-8d6b3b3bf059	/players	2026-05-01 03:25:55.702595+00
bceae0f2-9ec6-4cb9-9108-1f8918e45865	d567bf5b-59d2-47de-a6ad-cc45369c29e4	/	2026-05-01 03:36:39.715747+00
af840ddc-fcba-46ca-a8c6-674197eed1db	0f0bc9fa-28a5-48d5-b95a-4e9f991b257c	/	2026-05-01 03:36:46.278381+00
b8d4e066-a8b0-4531-881f-bec35fd212db	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-01 05:32:30.486338+00
c8873a27-341e-4f70-b83c-02487d28e794	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 05:32:54.575378+00
03b65844-4e5c-4584-ad17-818750bdb9ff	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-01 05:35:24.986158+00
f1023899-c501-4348-9732-28482876dbb1	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-05-01 05:35:29.013066+00
1873b577-7b5b-4ac8-b01c-c4dad0fb27a1	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-01 05:35:29.401872+00
ecd026f5-dc60-4140-a1ea-84ca7f6a3788	fb0f6986-5185-4ba4-8a11-ef4d09054dcf	/	2026-05-01 08:54:27.889653+00
c24b45e3-3dec-41d0-bdc2-e18bfdbef664	f32c8281-0641-4cb5-8205-ed09f58ffb8b	/	2026-05-01 08:57:35.791393+00
50cb810e-3c7c-4c95-9c7c-bb85e91745a8	8cde33a8-a408-47eb-9381-e809fa2185c0	/	2026-05-01 09:22:21.063986+00
b7c062c4-6ae2-4040-a027-e0eadd946cec	8b4cef04-c44b-401a-a2ec-05accee840a2	/	2026-05-01 09:22:25.385828+00
c2316264-b5b4-4b2a-9093-5f6f39aba631	d00fb812-3fe9-4e90-8d19-7b410c1d5dea	/	2026-05-01 10:26:09.647709+00
2199f404-8a29-4988-9aa3-3c758f6bf540	e0751c7b-e0c8-45b1-8483-f6e87e66b6b3	/	2026-05-01 13:35:31.599693+00
c9c33e4c-de05-49f3-8c70-46e629ba69ce	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-01 18:57:35.840597+00
b3948670-c1af-4a2a-bf0f-97cd7b951aca	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 18:57:36.273357+00
4cc1a09b-6bc6-437b-bfa3-9e5917b36042	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-01 18:57:38.561073+00
ee80f23a-311b-4c1b-84da-3cadf749ce22	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-01 18:57:39.847856+00
e725811f-f48f-4397-8a39-506fbc54bb87	64f7b1d5-91f8-4142-b224-a76800d7dbe8	/	2026-05-01 19:14:16.543238+00
9c6d6692-91ef-4a93-9a15-c6b4acf1c621	8d6d897a-e34a-4261-a00e-edb96110eb71	/	2026-05-01 19:16:42.360818+00
6670032f-621b-4e37-8c9e-658e8be4b276	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-01 20:38:12.513079+00
92ab4d94-3bf1-4ab9-ae48-edaf6d3dff9f	81917a1f-2aa2-42b2-84f5-b7952470bff0	/	2026-05-01 20:38:25.981277+00
ebabafd2-2694-4cdd-8d9b-08bedeae8b2d	81917a1f-2aa2-42b2-84f5-b7952470bff0	/login	2026-05-01 20:38:32.033116+00
1bbd7e05-d8ef-47f4-bef8-64c64f286662	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 20:42:20.194126+00
e494222a-c7e4-4a6c-8e4d-c475f2f6a4aa	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 20:42:26.528237+00
292754fc-e556-418d-899c-ab624e8a1b09	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 20:42:30.426051+00
97becf72-b35d-4f37-bcea-f366a27311ae	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 20:42:33.283508+00
b2eaeb3a-0be7-4e29-8934-3e7fde6653af	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 20:42:33.837399+00
7a445178-86c8-4e90-b408-7254611d48fc	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 20:43:51.929555+00
6aa3235d-2104-4cdc-95f6-0efec208e83d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 20:44:14.452596+00
b597c533-aca8-42e2-852e-e49d7d7001e6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 20:44:21.996341+00
f9ba2a56-e2a4-4b1e-bea9-bdb5f73c9711	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 20:44:25.370118+00
3529a59f-1bac-448d-956e-91231732a93c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 20:44:47.606312+00
3e0e43b6-8e24-49d0-9c99-3e59ffe6c4f3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 20:44:47.968565+00
201df306-0a28-445c-a117-bfa7876ac5d5	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-01 20:44:56.952536+00
92be3e3f-3b8b-4e79-b765-dbfc126e8a33	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 20:44:57.271477+00
485b6618-1ac1-4182-a64a-f43eff5468a6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 20:44:59.461066+00
dcced1d7-cb91-4f1b-aca5-fcd30b2fa5b8	81917a1f-2aa2-42b2-84f5-b7952470bff0	/	2026-05-01 20:57:29.615431+00
3b502823-981e-4c4f-92be-975554566da5	81917a1f-2aa2-42b2-84f5-b7952470bff0	/ligas	2026-05-01 20:57:32.43218+00
09dc5428-00d7-44d7-a708-f71b40bf3375	81917a1f-2aa2-42b2-84f5-b7952470bff0	/ranking	2026-05-01 20:57:32.440027+00
0e00b3de-9064-4fdd-8d93-021fe866feeb	81917a1f-2aa2-42b2-84f5-b7952470bff0	/verify-email	2026-05-01 20:57:57.266789+00
46e999de-ac4c-497f-b5f3-dc29841e8915	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 21:01:10.411907+00
b29565b3-8f2f-4d41-8aad-314e9b5968bb	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-01 21:01:12.974356+00
43088a8f-137e-408b-849f-546547480737	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 21:01:15.780013+00
8aa64b31-8cae-4c70-800e-413bd0d1a2fc	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-01 21:01:16.066242+00
eb8e15fb-f6c6-46be-865e-f4da7a2b576b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/api/auth/verify-email	2026-05-01 21:04:02.002746+00
380c171b-51df-47f6-9261-e0b7a6d75482	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 21:12:39.163766+00
dafcef52-3547-40f1-8ae9-19f5fb61fe67	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 21:12:50.871703+00
73be81c8-2874-4ef3-9c5c-38f4b9d638de	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-01 21:12:53.312969+00
86c34552-0663-480a-a5cd-c129f7d713c9	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-01 21:12:56.01132+00
2b06c9ad-ace8-4eab-a9f1-ec5b528a5314	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/verify-email	2026-05-01 21:13:51.145568+00
b836f462-f24a-4cc6-8f6d-2c39cf8f4f3b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-01 21:13:58.000209+00
64deb354-6be9-455e-a094-d4ddb7241659	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 21:14:07.968781+00
f410f8ce-f3e4-4036-b553-787e2c37597d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/onboarding	2026-05-01 21:14:08.48041+00
3a576ab4-b604-4ce7-a59f-20d4840abd25	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 21:14:13.698404+00
d3aea20c-82c8-4d4c-bbc9-bbd973a79575	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/2f421880-fb44-482f-8030-b4e11def2192	2026-05-01 21:23:05.52188+00
0a8f9cc4-4a67-41f8-9161-dc5cced8482e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 21:23:08.038611+00
d10c9026-e91a-4984-b39b-9b4713104b1e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-01 21:23:52.27833+00
f7b92cc4-9ffb-4d09-9755-232117a3909a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/2f421880-fb44-482f-8030-b4e11def2192	2026-05-01 21:23:53.514887+00
90d3e401-db3a-4536-85fc-cddcebe74f04	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-01 21:24:07.9522+00
9a3b47eb-293f-4a3a-be18-aed25d139e40	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/2f421880-fb44-482f-8030-b4e11def2192	2026-05-01 21:24:09.19225+00
f4f35ed2-e558-4071-b47d-c468fd0c86da	7ba5af8e-1e74-4b9c-b429-5db44e424433	/	2026-05-01 21:24:17.583335+00
d4421f25-b6f7-4292-bb46-ae544e729d53	7ba5af8e-1e74-4b9c-b429-5db44e424433	/ligas	2026-05-01 21:24:21.583099+00
c3a58b59-a608-421c-9ea2-04a03b305207	7ba5af8e-1e74-4b9c-b429-5db44e424433	/ligas	2026-05-01 21:24:24.441919+00
03196a72-252c-4798-a421-728d7f720d50	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 21:25:07.462935+00
ab9ae377-8c1f-4757-9dd7-f03c61231bbd	7ba5af8e-1e74-4b9c-b429-5db44e424433	/org/gamoro-pro-league	2026-05-01 21:25:07.613873+00
0ab4203b-0164-4d3f-b777-9f396d5b3622	7ba5af8e-1e74-4b9c-b429-5db44e424433	/org/gamoro-pro-league	2026-05-01 21:25:35.736995+00
c557e386-b497-47e9-aa14-58d7fce87362	7ba5af8e-1e74-4b9c-b429-5db44e424433	/ligas	2026-05-01 21:25:37.088533+00
d0107b75-4269-447d-a5ce-1d7c65beab9b	7ba5af8e-1e74-4b9c-b429-5db44e424433	/org/terrazas-del-valle	2026-05-01 21:25:37.466475+00
5b5898db-fac0-4091-8dcd-abfc54be8cf6	7ba5af8e-1e74-4b9c-b429-5db44e424433	/org/gamoro-pro-league	2026-05-01 21:25:43.817139+00
71f73dff-3878-4301-9b98-b1d08c9f44ad	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle	2026-05-01 21:28:48.266824+00
f1c517f1-efab-4e6b-890e-0876f415ec2c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:19:47.06973+00
6b840ffc-b5d4-4529-837a-f925700073d4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/players	2026-05-01 22:19:53.72871+00
feaa5567-b33f-4e11-bce5-007c73e40ba7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:19:54.697216+00
c4f13c12-a170-4a77-b5af-3e981778f9d4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/about	2026-05-01 22:20:06.329112+00
86ac3e89-195a-42b9-9423-326be22b4ec3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:20:06.399872+00
64b597a1-2144-4d9f-b3fc-244c7d884186	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 22:20:06.407267+00
acb68838-17c4-40a6-8de0-2c117f266d94	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-01 22:20:08.749776+00
35d9acc1-b957-4034-a8b0-01701cf25d61	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 22:20:09.987946+00
3071dc86-4185-4044-b452-7cbf9a508885	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:20:10.320229+00
083c0856-75ce-4bff-a9f5-7a2318b2559a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:20:11.776618+00
699e6fca-b803-4c86-b3d1-02fae0208bc4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-01 22:20:14.461735+00
13a50e85-4e20-4914-89d4-558a96a782ed	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:20:18.155035+00
a713e61f-21fa-45db-8c5c-80daf4d09e3d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-01 22:20:28.269544+00
f1bd946d-be87-4775-90e6-2376f87c4e9f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:20:28.970396+00
81c03f03-8d5b-45a1-95ee-c071b3dea104	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-01 22:20:40.431161+00
8cc1b05a-3804-47bc-88b8-2587dd730b66	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:20:42.598514+00
7990a564-cad7-4fe2-94b7-de4c8a744d3e	b98a1def-ae37-4600-b99c-fc99ed53d808	/	2026-05-01 22:49:52.548209+00
1551015a-2694-4b58-87b5-ea4c4119e682	df59be82-a2b4-4c02-9839-3bcbde48503c	/	2026-05-01 22:49:53.754568+00
3c877bda-8ed8-4acc-b685-082823ba4e69	26797e23-5981-4513-8527-092551d3917d	/	2026-05-01 22:49:53.835267+00
b6cce00b-cd40-43c0-8f72-ef1279e91924	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-01 22:56:31.118974+00
16401ee6-1a5a-4efd-9004-78da64c9d393	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 22:56:31.14951+00
f94609aa-a40a-4b2d-b190-e106aab3197b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-01 22:56:36.02889+00
b8e67943-b5df-4cc9-82c1-e934c527700b	467f99bd-491e-410c-b313-6818543d3d31	/org/terrazas-del-valle/mi-liga-lunes	2026-05-01 22:59:14.372257+00
c44ed032-997f-4bf1-9b05-867380868296	3fd5856f-28e8-4c2a-872a-2998a898cf39	/about	2026-05-01 22:59:16.977499+00
b2680d88-fe0c-44da-b9de-19640732a12e	c2aea4c7-2440-4339-8687-cfb10eb30c0b	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-01 22:59:19.097481+00
a7eb512d-20d4-4da2-8c6f-921b7a5475b2	5a7c6d18-2847-4fc7-bbbd-dc9d80135221	/players	2026-05-01 22:59:21.466324+00
8d215bd5-6f2c-4419-84b6-1d29c02286b4	c55f5e7d-3438-467e-bb5e-415d3f314f36	/register	2026-05-01 22:59:24.418641+00
fcaa02d0-f63e-41cb-9190-a14642a41eca	1bb65e48-0630-4aa3-97ca-5da55a3bda04	/analysis	2026-05-01 22:59:27.74932+00
c6f1b106-c706-406c-8ecb-ad8a5b460d37	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:28.62893+00
dd72a16b-473f-4f16-828b-9d987c1c1bf0	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/960ea712-fda0-4902-b02f-6897890b34f6	2026-05-01 23:09:31.669428+00
5453bd2e-e5f7-40f0-bd7e-e6fbfd8cf9ac	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:37.738384+00
6843094d-cb62-4684-8392-f5d147bfa8be	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/7039a7b9-c837-4b9d-af24-137423e2ee33	2026-05-01 23:09:37.751189+00
4f1af0fa-bcbb-4091-87a4-bc3b17787e73	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:38.909846+00
600927c6-66d5-4f49-b44c-a3689b9b4ead	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/e01fb0a1-597a-4d82-be66-741d84549ddb	2026-05-01 23:09:39.349076+00
2bb7aca2-e3ae-4868-b7c0-947ba34a2644	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:40.344527+00
f91992e4-b7f6-4831-b97d-200670461760	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/2f421880-fb44-482f-8030-b4e11def2192	2026-05-01 23:09:40.71578+00
7ed4b35e-7aeb-4731-aac8-2fbd7cac71ef	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:44.531876+00
332316ba-4e80-4d86-ba83-949078559b9e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/analisis	2026-05-01 23:09:47.678543+00
2ee94926-bf12-482e-afe3-5676b73898b1	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/analysis	2026-05-01 23:09:48.195167+00
ad89395b-38c5-438e-8fc3-60298f99d8ba	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:50.617162+00
16ee70ee-8df4-4761-b5e3-244772662616	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/analisis	2026-05-01 23:09:51.428322+00
0dac5ef8-bef6-4449-b6b5-2298d599017d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/analysis	2026-05-01 23:09:51.685112+00
8dced479-5c19-4780-8938-9c803f5a6d2b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:09:55.162122+00
bdd39305-a398-48b3-82b3-80b20c7864da	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/players	2026-05-01 23:10:03.326341+00
438e9a59-7946-4790-86d9-7e0c51bd2903	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/analisis	2026-05-01 23:10:04.535519+00
f5de602e-61eb-4aea-aba2-fa2f20bfbde0	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/analysis	2026-05-01 23:10:04.836042+00
22475285-58cd-4eb8-917b-c13f82263b24	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/players	2026-05-01 23:10:05.772041+00
f1e66f37-49a3-49af-b679-2082d7072deb	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:10:25.489505+00
7d0f68b2-07ad-4c8a-a207-d2ce16f1ea70	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/analisis	2026-05-01 23:10:31.22048+00
8cf3f3a2-f56b-46c1-823e-f5dd9446fda4	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/analysis	2026-05-01 23:10:31.508223+00
421a6270-5d54-4f35-8941-50d39363570b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:10:32.516542+00
6aaf53ca-2c2d-407e-b533-7cc47639232f	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-01 23:10:33.264131+00
85fc90cd-fd8a-44eb-9827-030fedca682a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 23:14:54.969688+00
305db438-e623-4553-9dd4-3ad412c7f667	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-01 23:15:36.187668+00
2010d9ac-a4c9-40a4-8438-af6a07d30d40	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-01 23:15:38.232564+00
d799907f-1151-4a87-a892-bef473b0c26a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 23:15:46.243559+00
eb47ae93-8425-4cdd-b81a-90369dcb593d	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-01 23:15:49.034+00
6cb40cd6-1adc-4954-8ac7-9c4915c9e4a6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 23:23:36.445473+00
2f9863a3-a0cd-4ae7-91cb-b359fa9179c8	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-01 23:23:37.699482+00
ebae9acb-bffc-4a5a-8cd4-8960f7878697	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 21:39:04.889812+00
1d798c4d-3b44-4545-8f9c-e2b3d110c9d2	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-07 22:26:11.219824+00
664e0061-3f10-46f2-a51e-c4ef5b4c49cd	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-07 22:26:15.414239+00
04925034-1806-4afd-98e6-f65e810fdfde	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-07 22:34:51.341807+00
29ff9daa-f7dc-4b10-b804-41f4a0896c38	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-07 22:43:30.028629+00
d55df3dc-4002-4f8d-a5dc-4b271fc26ce9	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-07 22:43:31.673604+00
3c6bd750-b416-4542-b655-c5de0db7227e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-07 22:43:54.484743+00
3f2be139-e5dd-4c36-b614-e7b57b8246b8	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 22:46:45.200022+00
ef202c0e-239d-43e6-9524-33af2feeb8a7	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/ligas	2026-05-07 22:46:45.203862+00
0a15a846-8d4d-452a-a72c-c827c0873659	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-07 23:19:09.914152+00
c81199f9-e947-41b0-9f0d-e28c75583bc5	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-07 23:19:56.012675+00
51ce4d51-8d33-4f45-a26e-4f4ab5124741	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ligas	2026-05-07 23:20:59.431524+00
f127d922-1fb6-410b-b9f8-767530b4c9fe	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-07 23:21:04.610149+00
3a6298e6-8ec1-4f66-8154-9d23d9626e85	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 23:21:18.280238+00
bd79dadb-8eca-4886-bb64-a8d87b8ce1dc	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:36:35.201223+00
44046a01-a0d1-4077-a94c-01ad8446da8c	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 23:36:35.371318+00
eea45801-76b5-4135-b891-789b8273f650	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:52:32.211022+00
010fd3ff-9d54-47b3-8b04-36d75bee2a70	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 23:59:11.373994+00
f316d52b-92f6-4ac5-82b1-b610c9ca4f30	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:59:38.97974+00
0155ff19-e530-4054-adca-9613f05ac2bc	b3fefb09-738d-4b30-ac71-524a458362d0	/	2026-05-08 02:00:57.456788+00
a0a1c003-5972-41f9-8799-1b1df9a052b0	8bba0ad4-7300-44ac-95dc-b01f31663ac5	/	2026-05-08 05:49:20.744956+00
c4d4798c-e367-44bf-9fb1-c3367149cc1c	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-08 06:15:10.3881+00
497a6cc2-7b3f-40c9-b17e-f735c274ffdc	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 06:15:16.568958+00
b13e3836-ecd2-4185-9645-3386a0a78e65	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:17:37.831417+00
5000918b-2841-42a7-bded-b43215c92ef5	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-08 06:17:38.271495+00
ba7dbc37-fe17-4114-81ce-b54b36c7e35e	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 06:21:04.701004+00
aaa6e150-e552-4bcc-a654-9451ab4ee6b8	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 14:03:49.520529+00
226fc963-c127-4b7d-9782-16e22f17858e	32c46e78-a423-4eb3-b2f4-3c59342e356d	/	2026-05-08 16:18:04.448353+00
3bf56e44-aa2e-49aa-b4d6-cad3b48d6595	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 19:47:45.643778+00
f4d7d441-b29b-4d50-941c-b230f8def2d0	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/mi-liga-lunes	2026-05-08 21:00:39.431545+00
e2ec354d-1dfc-42f8-bd1a-c952f29c6cc2	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 23:48:41.938211+00
260f77ba-fc09-454d-acb1-0b2d84c72383	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 23:48:46.473487+00
c58fd288-21ab-433b-b4fe-6820b80ee6ff	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 23:57:02.227722+00
3684e570-133a-4941-b2d3-e1a6a4180638	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/matchday	2026-05-09 06:35:37.516114+00
bdf23e7a-4d58-4ce7-9543-ef957958a4f5	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin	2026-05-09 06:40:02.424181+00
128b2820-3520-4194-b936-5fbf8032661f	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/analysis	2026-05-09 06:40:35.491512+00
9611b204-055d-4f90-a13f-a4a1f2e618bd	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-09 18:10:21.976925+00
fa61f777-fba8-4e3d-8ea4-9521b3401366	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-10 05:54:03.033844+00
7064a118-f645-4861-869d-8c53b1b039ab	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-11 04:49:41.991925+00
8aab53c0-9790-47bd-84ca-9efcd9ecd8ad	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-11 16:46:27.06358+00
4c2d36cb-16b0-4cd5-87cc-3aa846e5ab0c	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/ligas	2026-05-11 16:46:33.119272+00
44d39bf8-35ab-4466-9b98-4356d01a6993	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/org/terrazas-del-valle	2026-05-11 16:46:34.430063+00
ebccdc3e-bd17-43ce-98ff-e727e039d3ea	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-11 21:31:30.65625+00
b7f7f3cd-f593-45c6-b256-cbaea70cb909	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-11 21:31:48.524031+00
6c930241-fe8f-4dde-89ec-4d89eba462b9	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues/7f4a371e-05a1-4240-bf3b-afd47c8592a9	2026-05-11 23:49:29.560617+00
693baaf7-432d-424b-9d02-4fbdd9abed59	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 03:36:01.321236+00
708bcd28-4b23-42bf-945f-f27711d896f3	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/organizations	2026-05-12 03:36:06.72473+00
e516732c-4fcd-471f-a9e0-636fbf1c24b6	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues	2026-05-12 03:36:10.475551+00
66447e0f-bd42-455d-868b-acae8168cc77	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/teams	2026-05-12 03:36:11.461766+00
a2064eb8-bd32-42b7-bafa-d66df42c11ad	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/players	2026-05-12 03:36:12.538436+00
c96588a6-71d1-4ac0-a580-3d0f7e5eea64	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/import	2026-05-12 03:36:13.077525+00
091ad9b4-a65f-4fb7-acfa-cac89f19f854	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/analisis	2026-05-12 03:36:14.26198+00
3af4d30f-2cfb-4d34-afea-62ca77939587	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/analysis	2026-05-12 03:36:14.772204+00
2a9ab73e-d69c-41bf-86d1-cb8dd8cf9a56	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/about	2026-05-12 03:38:11.904666+00
852dc4cc-4ead-41de-8a6e-aa66968ac60c	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 03:54:36.654714+00
7ce34d82-518e-4475-b9ca-c5378433514c	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 03:54:38.903157+00
c29821a4-30a1-4898-8fdc-8bf28594d71e	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues/7f4a371e-05a1-4240-bf3b-afd47c8592a9	2026-05-12 03:54:40.586553+00
090458c6-90dd-4b46-bd7f-ca466bfd083e	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/import	2026-05-12 04:04:44.962095+00
7a011430-5232-454a-85e7-2adda2213170	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 04:55:20.375618+00
43e35f5f-19eb-4329-8a0a-1fd659c77252	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 04:55:20.519513+00
147e0c99-3d28-4eba-9e3b-f17cf0193ffd	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues	2026-05-12 04:55:26.421784+00
f437af39-6557-46a2-af5b-89be44fedf58	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/import	2026-05-12 04:55:29.352428+00
39d1710b-c795-4212-8e8d-6bcf13a371ad	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 05:23:25.448332+00
6a490889-7a2e-4ff0-9d19-8cbebd19907d	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 05:23:27.799218+00
5e23d1eb-462c-4686-86d6-ba1f6209a305	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 05:23:39.272352+00
055f2807-1b12-4bba-b3f8-dd6821b95206	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/login	2026-05-12 05:23:44.112328+00
aaca5163-6f1a-4cca-af29-9ace56263630	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 05:23:48.304483+00
9b43cd33-8c36-407b-a1f3-6944e584bace	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/register	2026-05-12 05:23:55.681752+00
e28a06ef-7ea1-46cb-a198-818602099953	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 05:23:56.473324+00
2da537c3-3d46-4151-a961-a95c61af5956	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/login	2026-05-12 05:23:56.478125+00
f9f55392-7987-4e55-b018-8d32ac07c65e	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 05:23:57.174666+00
8bd75b7a-9636-4b68-81cd-1e9fc07cb250	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/register	2026-05-12 05:23:57.180063+00
b82699ad-0166-466f-960e-637317189238	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 05:23:57.483256+00
b738b9db-355d-41ae-98b9-9a25783268a1	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-12 05:24:19.230345+00
f9c3c617-9934-4824-b697-d048b8c46001	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/analysis	2026-05-12 05:25:43.363418+00
66de294d-887d-418a-9537-2ee48ca5c4c2	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 07:55:01.796557+00
fa46ebbc-3e7f-4fff-bd21-2b4d9653aa6f	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-12 07:55:01.820599+00
8cc1d182-17c0-4038-8bfc-01a1d8463152	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 07:55:21.645985+00
3ae6eb90-8609-41a6-a648-b23c484859c6	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 07:55:40.309841+00
2994ac03-586d-4017-907d-2bdbb49b5462	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 14:18:23.017372+00
cd1e7d80-0ff3-426f-a05a-aa7e123a4935	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-12 14:18:23.033426+00
ff5308ca-7db3-4b0d-afb0-354d998e5281	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-12 14:18:25.142391+00
1ccfbd72-1c1a-449f-9044-1fd7f89cbb31	5853c67f-a163-4762-b80c-e46b84435f19	/	2026-05-12 14:18:56.223413+00
b80487a1-a5a1-4898-a187-019fdc0f507f	5853c67f-a163-4762-b80c-e46b84435f19	/players	2026-05-12 14:19:02.889489+00
3dba0847-7d0d-43fb-afd8-504b67e5b783	5853c67f-a163-4762-b80c-e46b84435f19	/	2026-05-12 14:19:12.643068+00
368ee7b7-cd36-4635-a172-6674019621bf	5853c67f-a163-4762-b80c-e46b84435f19	/players	2026-05-12 14:19:17.352603+00
c147d92a-ba74-4ae9-8c08-680fa5dca012	5853c67f-a163-4762-b80c-e46b84435f19	/matchday	2026-05-12 14:19:20.670625+00
8bae454c-044a-47a0-9fcf-9551e6a5907f	5853c67f-a163-4762-b80c-e46b84435f19	/	2026-05-12 14:19:26.498584+00
2b1d2fa7-ca43-4481-90c6-f7b6a966693f	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-12 14:55:37.441346+00
22ec623a-1bba-463d-8250-cf7a5fcbf589	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 14:55:41.638883+00
cb3ab409-7ab2-48d1-ab81-448a7092a34b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-01 23:23:23.517766+00
f3be81cf-a1b1-428a-b1dd-f7ff432adde5	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-01 23:23:26.323579+00
cb1448d4-de74-4988-9376-910c01747a46	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-05-01 23:23:36.702805+00
7ffe6ee9-c2d1-4ede-bf29-b7725b4e907a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/terrazas-del-valle	2026-05-01 23:23:39.289477+00
b496065e-a817-491c-b67c-76bcc16ba633	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/jocobi	2026-05-01 23:23:42.231339+00
bc7a85a6-5201-470c-a9d2-258468128380	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/org/gamoro	2026-05-01 23:23:45.497078+00
ef5d9543-5652-45b8-b814-882ceac0c1bb	300082cd-f851-42f7-9093-8b1921255066	/	2026-05-02 00:46:59.995561+00
d941aa92-f31b-4dc6-bc57-7374157fb6d4	39f087f2-7f75-40a0-bf85-261dc72413df	/	2026-05-02 01:32:24.153979+00
118b040c-8716-4801-8b7d-d479f5b58dfd	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-02 01:36:12.376439+00
be03e1e8-3e3d-4f96-86a0-3af4f3773166	a2cf76c2-df36-47cf-9f5f-fef73f8a6ec0	/	2026-05-02 01:55:26.336916+00
672b111c-5321-43a9-b3be-27f02abe1b25	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-02 01:55:26.799272+00
9705ca09-48dd-4afb-b549-3ebdf31d14f9	1bc456a8-9060-4578-bb25-729f85ac9e00	/admin	2026-05-02 01:55:32.494215+00
6c5432c7-3f06-46ed-8db1-f9359c8fe254	1bc456a8-9060-4578-bb25-729f85ac9e00	/login	2026-05-02 01:59:07.44307+00
7714c0e3-025c-402c-9a6b-7a8d3bfe0218	b21e4896-39c9-4123-ac61-fe1a92a18fb1	/	2026-05-02 03:19:37.481602+00
5518958f-8318-4d3d-ae91-b7f737093c72	1bc456a8-9060-4578-bb25-729f85ac9e00	/login	2026-05-02 03:45:42.569118+00
91579858-ab62-48d7-b040-aa5ac62c8139	1bc456a8-9060-4578-bb25-729f85ac9e00	/login	2026-05-02 04:03:08.919618+00
0a641ccb-8c65-4041-9694-4d5cb565b3ac	1bc456a8-9060-4578-bb25-729f85ac9e00	/login	2026-05-02 04:03:09.029582+00
0d05c54e-d97f-46ff-ad00-f3c8b42664d9	1bc456a8-9060-4578-bb25-729f85ac9e00	/login	2026-05-02 04:03:09.033538+00
4039ad43-a9d6-4a5a-ad2e-2f67d8d390c3	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-02 04:03:09.428144+00
8bdbb000-995b-489f-959e-0ad14d18e37a	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-02 04:03:11.228505+00
f0371baf-8b7b-4026-826b-e95a43c66e72	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-02 05:07:18.541472+00
654a0072-ae34-477d-92c8-db9e43763c5e	1bc456a8-9060-4578-bb25-729f85ac9e00	/register	2026-05-02 05:07:31.522582+00
55e38782-8383-4ecb-ab6a-cac031469b5c	1bc456a8-9060-4578-bb25-729f85ac9e00	/	2026-05-02 05:07:33.204034+00
40b280d8-722f-459b-ba92-94f968644434	1bc456a8-9060-4578-bb25-729f85ac9e00	/ligas	2026-05-02 05:07:34.498418+00
e484ea58-f8d3-472e-a3df-d2c1365e46f8	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle	2026-05-02 05:07:40.588326+00
b78e9d2e-6f5b-4642-b072-93b6d356168b	1bc456a8-9060-4578-bb25-729f85ac9e00	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-02 05:07:45.642835+00
db4284b2-c112-4680-9c4c-7162bc84104d	1bc456a8-9060-4578-bb25-729f85ac9e00	/players	2026-05-02 05:07:51.364919+00
c98bb433-6f2f-49ba-9848-f2dcf89dbbdb	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-05-02 05:07:53.033347+00
6c5e988f-d4d6-4c15-a31f-2f0fe35e3b82	1bc456a8-9060-4578-bb25-729f85ac9e00	/player/[id]	2026-05-02 05:11:44.033248+00
8f20bc02-36bb-4cae-af7b-3d071e2689a2	bc7b8505-00fb-4467-8966-7927cab24522	/	2026-05-02 05:31:19.980627+00
84de9358-df59-4ada-9191-c56368d16f87	bc7b8505-00fb-4467-8966-7927cab24522	/ranking	2026-05-02 05:31:24.989231+00
06e55db1-a5fb-4705-8a05-5acc354ec2d6	4e11722c-2d6b-496b-b46f-050f32d5957f	/	2026-05-02 08:56:21.267547+00
9c965c8c-56b7-4919-86d2-ded7bb5e36bc	695ae27d-5e76-4eb3-a323-6317ac6cf7b7	/	2026-05-02 08:57:45.826821+00
6ab80fcb-eebe-4feb-9f25-ee77e6a9b96e	9991174a-c428-41c1-b09f-29508803bb78	/register	2026-05-02 08:57:58.975021+00
70ccbc7b-5798-4597-a3e8-ef6cfc5336e7	8157e0ec-5d10-4cc1-82fb-38d1399f68c2	/login	2026-05-02 08:58:11.777009+00
dfbe5022-fb8b-41f9-b39b-f9fb5a5519af	966100f4-1edb-4116-bcdc-af9273b7b951	/cmd_sco	2026-05-02 08:58:21.715917+00
d5436307-0707-43be-9970-21e75362d811	1a87740f-0f75-486e-b6e6-d52ed162cac5	/	2026-05-02 13:27:50.504337+00
1dd90d62-e62a-4696-9d20-c37dc73cddd7	f8a8529d-1b59-47fc-b2a4-cec243ed9c33	/	2026-05-02 13:27:59.805444+00
5c30077a-5ddc-4436-aecd-754880244cf7	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/org/terrazas-del-valle	2026-05-02 18:03:32.709207+00
03ff62d5-572d-45ae-8692-dfb0066ba44d	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ligas	2026-05-02 18:03:45.022397+00
1d14acac-7509-44d5-8029-586547f3670e	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:03:47.63535+00
febea794-6cbb-4af4-941a-4872103d1b6f	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:04:20.213561+00
522046b7-951c-4a1e-bcc3-7b154b7783db	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/matchday	2026-05-02 18:04:20.218662+00
36d37c8d-18cf-469a-bcff-1e616d14f9d2	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:04:49.728049+00
9741a85c-cbac-4751-be0e-b38223abf0dd	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/player/[id]	2026-05-02 18:05:47.953632+00
f1b09c42-61bf-4737-9ac5-b9925d4c7c8e	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:06:17.411806+00
e1ef26fd-e716-47db-bb17-f7356ac32178	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:06:18.137053+00
1818efc9-0111-43b6-a86b-5046021d21f8	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/player/[id]	2026-05-02 18:06:34.024794+00
ec843ac9-6748-4f67-a862-11135f86c2a9	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:06:46.013099+00
b567a7cc-3206-4e16-87f0-be15dbb0fdc8	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/matchday	2026-05-02 18:06:46.502004+00
f57456b4-7cac-4b65-8f47-41effa3cee40	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/analysis	2026-05-02 18:06:52.076261+00
92c1dffb-364b-490f-bdf3-7d356a9d97be	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/	2026-05-02 18:06:54.020031+00
e6a0d953-267d-4a0d-adb9-a9aeee9ff2bb	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ligas	2026-05-02 18:06:54.458197+00
11a23f5c-92e2-474a-b363-984fca205a22	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:06:55.920872+00
2880ae69-7d53-431c-bea7-3d937a905117	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:06:59.85582+00
6dc4f1aa-2317-4b9b-af1e-4d35ce738a2f	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/	2026-05-02 18:07:02.672429+00
6f87dce2-fb4b-4524-83cc-dd5481b1974d	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:07:06.83081+00
b4808623-5ae7-4502-b7fe-6c216d1301bc	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/matchday	2026-05-02 18:07:09.386319+00
8bace1bc-8786-4ea0-86d6-e76cf3ead14c	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:07:45.479864+00
5868bfdd-58d4-4e25-9578-1cdde27b6414	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:07:45.483583+00
818453b9-f755-43a3-be85-40c139555909	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/matchday	2026-05-02 18:07:48.005884+00
776b470e-71f8-4aab-9bb0-28cc36d3f5da	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/analysis	2026-05-02 18:07:52.338554+00
6a684bc8-7939-463e-9daa-2d65a6e1308a	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/	2026-05-02 18:07:55.222775+00
1d319f5b-e71a-4fec-9614-96625def697c	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/analysis	2026-05-02 18:07:56.421238+00
de6d8a13-e299-4ffb-9c7a-c63a4a5ef156	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/matchday	2026-05-02 18:07:56.939271+00
7ed42e0d-9ece-4827-bfc0-28f4464df1ea	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:07:58.180129+00
420bfb87-0b90-4b79-8135-1fdaff381f09	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:07:59.268786+00
c466ff33-5cf5-482f-a9ac-e14ea87935fa	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/matchday	2026-05-02 18:08:06.814251+00
6d4ca622-86d2-4d92-a304-4c81d74a8683	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:08:14.183427+00
18297adb-d2a7-4578-8f2a-5ab0fa2cda7d	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/	2026-05-02 18:08:15.302772+00
60a6ef2c-59d6-4b88-99c4-689dedcd417f	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/players	2026-05-02 18:08:17.757992+00
0f9555b5-2c79-4ff6-8c0c-9e484f0409e9	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-02 18:08:18.846522+00
8be5e066-960c-4dea-83e7-0db3b618f40c	ccba2b7f-d0b1-43d8-98e1-143177b9cd68	/	2026-05-02 18:51:41.807701+00
a8fbf4ad-75a2-4e38-996e-1fa0a9a3f574	e1477354-167a-4898-b2bf-8ecc1c7d45a6	/	2026-05-02 18:51:44.068558+00
e9c04ef7-c0ff-45f3-92b7-794a7be0f29f	5068cbc6-a360-4d93-87a8-177f97e311bc	/	2026-05-02 18:51:44.296762+00
881c794a-81c9-44f4-a7fe-e3c978e6cbb7	2e2d735c-bc4b-4227-9f78-d855f2d11543	/	2026-05-02 22:05:39.285968+00
7a44d8a6-a367-44c9-9e99-573635306637	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-02 22:05:39.537921+00
622e2a4e-dfd0-4f31-be12-f75c801652d3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-02 22:05:42.527322+00
df8c0313-fb52-439a-bdca-3bc1196aaf0e	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-02 22:06:49.794519+00
70fed819-ce6c-4f56-b023-fb7a084d9a17	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/organizations	2026-05-02 22:06:53.906736+00
0a399aab-31ca-45ee-92ba-6c123647931b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/organizations/2c416a3a-db98-42fc-827b-e9c0c26b7a59	2026-05-02 22:07:04.840349+00
2d1c9b31-8aab-414d-8e6b-5e92c625aff7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-02 22:07:04.847419+00
df23a635-8c60-4d11-85ba-66d871262579	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/organizations	2026-05-02 22:07:05.404057+00
508a9a93-e994-46f8-8f29-86e980e484bc	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-02 22:07:06.778177+00
a1f3f57c-dd10-4f98-b7f9-8c98b7e7a166	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/teams	2026-05-02 22:07:07.828133+00
090beab2-c26e-4dc9-a1e9-0e9b108ac528	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/players	2026-05-02 22:07:09.156183+00
2971f08e-7554-463a-bc03-af9b3e4e3129	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-02 22:07:09.809347+00
b2341832-da9c-49a6-a14f-183e79d993ba	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-02 22:36:19.0317+00
2437e348-0b8e-4c22-ba08-5b3300e88f43	dbfff675-e651-4b3d-857c-cd776515bbc6	/	2026-05-03 01:00:54.65073+00
2b442422-dafd-4eed-9814-a4ef6d1b724c	81bfbb86-cc4d-440f-b0bb-0c8d6ec811e3	/	2026-05-03 01:01:18.335137+00
2106599c-2bdb-489d-b2f3-3788fb496297	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 01:37:36.719665+00
eba325a3-3f96-416d-98c9-64cdec4fdb80	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-03 01:37:42.612317+00
e69028e9-b7fb-4fb7-8f72-357a159d11bf	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-03 01:38:06.957715+00
3bfd43a9-f7df-4f29-9c43-42d1c8c374d9	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-03 01:38:06.961941+00
b353616e-0f50-4f29-9af8-01e6a2991fca	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-05-03 01:38:07.286835+00
0104e6c8-e75d-4477-a012-12e477ba0751	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-05-03 01:38:09.549172+00
bfaf848c-b0ba-43f5-8a5e-fb985663bd82	5c53e085-d027-4ebe-86d9-580032d173dc	/	2026-05-03 01:59:31.556227+00
ac476f71-a56b-4b9e-b9bf-27aff13da57a	94427e90-41ba-4c75-907d-47f2dd4bfa61	/	2026-05-03 01:59:31.563077+00
55748f28-0574-4402-84cc-a4f47b061caf	3c1ee0ea-d048-45bf-b6f4-0526fdf09114	/	2026-05-03 01:59:31.592646+00
c51b9ac5-f780-406b-b77d-577e5fbe081c	430a29a0-29e0-4574-acfd-190f3371cf6e	/	2026-05-04 14:32:57.493613+00
50ce759b-0e9a-4b37-8187-85cdf3e98003	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-03 03:00:57.159825+00
4246af63-767d-43a8-a92f-e3b86444143a	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 03:01:43.163+00
d3618e2d-03bb-4eb2-a64f-1d86074f1360	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-03 03:02:31.397695+00
ba025fe1-45a1-4189-acbb-73b58e0a2cd2	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-05-03 03:02:36.37797+00
dca51281-e19b-4004-81b2-6f49d6d60b79	5e25c9a4-e172-4e70-8cce-201620a83d88	/matchday	2026-05-03 03:02:38.30621+00
48f402d1-3a63-440e-b0dc-dd751d8508c5	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-03 03:02:41.13065+00
5982f505-8d31-4fa4-afbc-a1d6f60763e7	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 06:46:29.770603+00
5a08385b-f03b-4a7a-8449-441139200950	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 06:47:04.315432+00
514f9c78-1356-4ba3-b5e0-8802e8d7e7e9	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-03 06:47:11.529102+00
b89c44a0-ffcd-4326-93c1-259695ad4d82	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 06:47:24.978286+00
4d7f8a37-befb-46cb-ac45-513b4eef317a	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-03 06:47:26.685648+00
0d0d3852-9d55-435b-b131-a3c6b62fdf38	16ee731c-7bf7-49e4-b95a-662736f431a6	/	2026-05-03 09:46:36.287862+00
06e64550-c762-47c9-a2c0-82532a01c562	e5b183f0-6612-4f7e-8df6-4dc29399c0b9	/	2026-05-03 09:46:39.842334+00
6a600f89-066e-4554-a4e6-e9e161d98958	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 15:24:37.433597+00
9c4b435d-5b0a-431a-b84b-d76478693503	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-03 15:24:53.15172+00
953b89e2-251c-409d-a0e9-95ea36486b77	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 15:25:55.566196+00
192ef0cc-16fb-4a34-b5ad-7ac17119a711	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-03 15:26:47.232648+00
cb855182-fc60-4775-bddc-ed82c7ee9d6c	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-03 15:26:47.236001+00
09053a54-8b48-4ea8-97dd-d3cd7e19e471	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-03 15:26:47.240233+00
28075edb-8ee2-41c9-b320-3832038ffbbf	5e25c9a4-e172-4e70-8cce-201620a83d88	/ligas	2026-05-03 15:26:49.896312+00
6f91e8e6-9546-4251-950d-2ebb82fe2bc5	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-03 15:26:50.862809+00
6c7aa021-5f37-4c08-910b-7acd0cd6d41c	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-03 15:26:51.034682+00
c74c47e9-357c-4565-a987-c8acfdc569c1	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-03 15:26:51.693954+00
658e867d-c9d8-4a0c-b3a3-3ff76f869aee	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-03 15:26:54.712787+00
d160994b-2fd0-4724-99e1-ff1007c5276b	dfe7eca8-c0c7-485f-a0c0-b416a084051c	/org/terrazas-del-valle	2026-05-03 19:36:04.279503+00
6d94be0e-91b2-48f5-bf11-e9132b7c49ff	cd0dc343-eaaf-4f94-8373-94c3d304b296	/	2026-05-04 02:49:33.28641+00
bcfd9a8f-96b3-4d22-a160-549604b2b47a	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-04 03:16:27.344643+00
e93eecd3-5226-4fd6-8cd7-c6922981ebcd	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-04 03:16:30.424884+00
e05ba1e1-82df-49dd-a9a2-37465d20e22b	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-04 03:16:31.669116+00
091ccc2f-bbaf-4f6e-bfc9-c75131011e78	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-04 03:16:36.152649+00
4d25414f-881e-48f1-b439-e02bc0d7b4d2	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/register	2026-05-04 03:16:41.460514+00
8b919ff2-6875-4bcf-938f-1a1c36eab473	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/login	2026-05-04 03:17:06.09406+00
b7714a11-f86a-4422-9322-4f2f47169d72	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin	2026-05-04 03:17:15.020126+00
ad7ad6c5-f367-4f8b-b61a-54a44ee1d17c	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-04 03:17:20.011231+00
be4ca207-d39f-4649-9ae7-048c2ecff294	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/new	2026-05-04 03:17:21.52134+00
7aae8207-6e48-47f1-a024-2205645a0430	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/cf6ca8aa-9c74-4c3c-9dc2-2e0171901028	2026-05-04 03:17:33.549549+00
1f94788a-0621-4f5c-83b6-b68ad8200929	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-04 03:17:36.400656+00
d64bdc05-1cbd-4828-8df0-f10cc0a5e1c9	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-04 04:46:29.565517+00
b52fec97-15a4-46a5-b9cf-31d84dc76184	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-04 04:46:56.604879+00
73d63c16-d6df-4a25-8a8a-3ea0c0a9b099	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/	2026-05-04 05:32:42.785389+00
337fccf2-a222-45b6-a0b9-4ce06bfeefdb	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/ligas	2026-05-04 05:32:46.570687+00
e609afae-234c-4970-827b-28275b7585e5	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/ranking	2026-05-04 05:32:47.621794+00
418c654d-180d-4a7e-8ac6-fda334634de9	d41713af-7b2c-4028-bfc2-f19da10c10ba	/	2026-05-04 05:32:47.636445+00
1c0a0393-571d-4851-9657-4aa0afd0b2a2	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/players	2026-05-04 05:32:48.652666+00
13682e02-6c7c-485a-a8b0-90589bd5618e	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/matchday	2026-05-04 05:32:49.278245+00
3f63e1bb-8e40-474d-bf4a-29ac838a2fa3	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/analysis	2026-05-04 05:32:50.044533+00
cc8a26a7-058f-4ee9-a6a3-eab3808175b9	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/about	2026-05-04 05:32:50.711842+00
d9562969-11db-4218-bea3-363b225252a2	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/ligas	2026-05-04 05:32:51.18506+00
6834a5c0-8327-4e2e-8728-df932da8f1d1	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/	2026-05-04 05:32:51.793646+00
31de7be9-76a7-45c3-a173-08d9a13ebe94	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/ligas	2026-05-04 05:32:59.753349+00
3e7a8f60-ebc6-4c3b-b3a7-59722d3ceb6f	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/ranking	2026-05-04 05:33:00.290666+00
5e15917a-cff8-4d45-b392-0e4db7576219	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/player/[id]	2026-05-04 05:33:01.605797+00
4ee00c0d-c8bd-4eb4-83ea-a9d03ac7b328	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/ranking	2026-05-04 05:33:05.005027+00
a2f5fcaf-2cb5-4033-8df3-008604f24441	6e308efe-abe5-40e9-b87f-b3f584e99fa5	/player/[id]	2026-05-04 05:33:09.63132+00
58d284cf-7839-4992-8e47-a2a848be4038	782d5e56-b70a-4d6d-b502-a902de202582	/	2026-05-04 13:09:41.039562+00
cb974257-d1a0-4c8a-a053-bbd2c3ed909f	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-04 14:11:27.961134+00
8858e7dd-8d2c-4890-beaa-0fac4b4aa787	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-04 14:12:50.874784+00
7518b760-6c9f-421c-8b10-1b513a0ac3d4	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-04 14:12:53.773515+00
2c84625c-e0b9-428b-beb2-46021763ae0a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/player/[id]	2026-05-04 14:13:24.810878+00
30641420-9a73-441e-9cd9-7b0f8ca518da	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:13:53.146717+00
d9d9d2cb-860b-4f59-bbeb-ee499541512a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:13:57.391319+00
f6b24f2f-f045-40d0-aa2b-238aee97c12c	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:14:01.168004+00
2b926e6f-fdc7-4065-aaff-01806a34fa8a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:14:02.589804+00
d9c7d15b-b0f8-44f1-b643-d70625b93627	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:14:23.0479+00
bbc9d2de-b39e-47a2-804f-477497d24f36	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:14:24.409082+00
fcd7ac7c-5adf-4a65-8bda-a4d794f6b828	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/mi-liga-lunes	2026-05-04 14:14:44.392533+00
cd3b1971-a8ae-41a3-aaec-76dd9ebdaa8e	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:14:57.615845+00
2f8b7dd4-186b-4737-9809-f7cdd41fd5ea	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:14:59.133447+00
1d5b375e-834b-4614-a6eb-5594d5b7ef78	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/mi-liga-lunes	2026-05-04 14:15:02.392815+00
345b3616-1b51-4bd6-90da-48358f643423	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:15:10.288727+00
416b889a-c1d8-44d8-abeb-fbfbe02cf161	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:15:16.472626+00
2f2bfa1c-2773-41a7-b851-567e504b2c7b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:15:54.339446+00
9026b370-7074-43a8-97ac-b67287b26e1f	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:15:54.342563+00
94916255-8629-4e1f-96b5-e9218f4c93ce	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:15:54.386243+00
562e8980-7fc6-4f71-ba4c-2e9d1dfdc6e6	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-04 14:15:58.394368+00
28c12dd7-818d-406a-841f-af3aea528b9d	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-04 14:16:17.065586+00
534837aa-a526-48be-90c0-ed07670dfeba	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/player/[id]	2026-05-04 14:16:38.650962+00
9d00f178-1ce8-4ea6-8a79-4fb17fabcd2c	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-04 14:16:55.34485+00
2c569416-e4db-4bcf-8956-d799b0b40f04	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/about	2026-05-04 14:17:14.567712+00
cb46498a-b2b6-4054-85b2-62557858f65e	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-04 14:17:16.241429+00
9a3137f5-7d38-4384-b68b-2866a15187fa	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-04 14:17:18.326855+00
c4e72a2d-6e52-43a6-bddf-5a63609a4be3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:18:06.80487+00
dce5865d-236b-422b-98d3-84564ee29199	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:18:06.863281+00
61a9b68b-b9f6-44b7-9959-619054d15ac0	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:21:53.873084+00
a4d98400-180f-4351-bf47-1ab807c2f66b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:21:53.925621+00
3f4439c9-3078-422c-8ce7-9701f267cb02	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 14:22:12.935044+00
ce3d247c-49e5-4a4f-870d-a6812ef3368c	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-04 14:23:35.514711+00
772533dd-c7fc-456e-8f6e-4c8e7e7206dc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 14:23:35.519242+00
29da388e-db8f-475a-adce-bcbaeea65e7e	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:23:35.807277+00
4a3a41e2-554e-4421-aa7b-5b3de41a8cf3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 14:23:41.981636+00
2f6b0a9a-a7e7-4df5-b87b-6ff7f0236b3f	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:23:47.081004+00
6079d3bd-f0c4-4510-959b-a94e5c25170b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/mi-liga-lunes	2026-05-04 14:23:58.711419+00
c6095669-808f-40d0-8d02-3e72e167ea0a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-04 14:24:23.224556+00
76888375-50c3-4129-ae66-64148ecd50ef	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-04 14:24:27.496577+00
b68037bf-545e-4101-aac1-b5c58c3d6de0	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-04 14:57:55.054426+00
948c91cf-7a78-44b3-ad80-3e265c2505fd	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/player/[id]	2026-05-04 14:58:05.413072+00
104376b7-e473-4382-afab-284b1203da8b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-04 14:58:08.600036+00
6a759a9a-2cba-4743-a7a5-95920b27c2dc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-04 14:58:12.343966+00
c5f83ae3-f3de-4b42-997e-256adf885d9a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-04 14:58:16.264552+00
95f0848e-70b5-4f17-be0f-2e9c86249802	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/analysis	2026-05-04 14:58:25.572241+00
ccc80417-9da5-4fc7-9be3-bf3f6cc7acbd	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-04 14:58:26.843267+00
011ba1f2-8f90-4e9d-918a-ee1baa2a1efc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-04 14:58:29.618228+00
f34908c5-70f0-4d2f-9fe2-8f82c35805a6	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:58:30.976616+00
0328e5f2-e477-4b6a-9c06-3d8461822482	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/mi-liga-lunes	2026-05-04 14:58:37.591858+00
d4b5bd2a-a2f1-4d22-b84e-7aa0cc033d88	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-04 14:58:43.494591+00
95f40cdc-6a03-42a5-a353-e1e10566f5e9	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-04 14:58:55.308002+00
cbeb8fbc-df64-4a6e-8c4f-4c4e17dd99dc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-04 14:59:09.231557+00
202b925c-1432-4b7d-a397-0b4ce16d9a3e	91fe8627-9647-401f-a1ed-e8414b7e1afd	/	2026-05-04 16:41:29.193442+00
f1c9b30c-db13-45ba-bd0b-e4ce6a90e2ab	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-04 16:51:28.676341+00
33205ad7-cb6e-4c4f-a9b0-cf3f5cc4f9f9	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-04 16:51:38.52858+00
4d81b8d1-ac8b-4db9-ae72-45f89491773e	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-04 16:52:09.59325+00
9352d2a4-9e5d-458c-8d9e-de9ac55c7f3c	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:52:30.192968+00
5700e6ee-039d-42ba-97a1-df5136417058	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:52:46.448328+00
ce442339-d976-4554-9e7f-2eda9b12841c	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:53:16.231879+00
d9ad1b27-1433-453f-afd6-aa8dd0075b3d	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:53:16.281139+00
5816a874-b7bb-4525-ad44-05479ad15328	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:53:24.726816+00
10a5d54c-0898-412e-b326-10c1cadd2054	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:53:26.113744+00
6def272b-fdee-4e82-ae87-5cf62cc128c2	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:53:52.385356+00
183bd3c1-85ae-4d1e-ac5c-b44255150568	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:54:00.220742+00
6a90a577-90ee-40da-bd1a-00e0fd437c01	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:54:04.432348+00
da3ac0b2-d767-4485-96e5-25f28bc59fe5	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:54:05.894874+00
2e35814a-2587-4c12-908d-a6568220809d	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:54:09.511762+00
db3c5422-6ca4-4ebe-9a79-0ebd2bcc9d25	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:54:17.127578+00
dd47f807-a12a-47ee-86de-27a55610465b	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:54:19.718314+00
a85bec1a-b14c-47c1-8e92-bb9fda489a4b	5e25c9a4-e172-4e70-8cce-201620a83d88	/player/[id]	2026-05-04 16:54:21.391704+00
267e89f8-361f-41fd-bb2f-0d7f7fcbf5a8	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-04 16:55:44.752094+00
b1a97b40-d341-4037-a8e1-de0d6e6df640	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-04 16:55:44.810506+00
d7da0042-4417-4fef-8dce-9890faa44633	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-04 16:55:48.430371+00
ff3e7d8c-836e-416c-99bd-be2a97200f44	23c63d47-4910-4575-9ee8-d81eb1504b32	/org/terrazas-del-valle	2026-05-04 17:04:14.436737+00
e33512ae-1fe3-4aca-8bd8-b76c3fb494eb	23c63d47-4910-4575-9ee8-d81eb1504b32	/ligas	2026-05-04 17:05:29.31559+00
e36d3a1c-eb8c-41dc-a258-607f3f044591	23c63d47-4910-4575-9ee8-d81eb1504b32	/ranking	2026-05-04 17:05:29.324214+00
4e7575ea-e346-4437-8549-52f130e2fef1	23c63d47-4910-4575-9ee8-d81eb1504b32	/matchday	2026-05-04 17:06:06.151909+00
88622f6f-b818-4b82-ad4b-745ff6deb33a	23c63d47-4910-4575-9ee8-d81eb1504b32	/players	2026-05-04 17:06:06.179589+00
eec3d661-361e-4093-8275-38eac6e1f508	23c63d47-4910-4575-9ee8-d81eb1504b32	/ligas	2026-05-04 17:06:45.119788+00
1d21acb9-a3db-4b13-9238-343f3fc50ba5	23c63d47-4910-4575-9ee8-d81eb1504b32	/org/terrazas-del-valle	2026-05-04 17:06:47.588659+00
74817b29-e0cb-47eb-9714-d55989d74a8a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-04 17:25:11.367316+00
d48565f2-a95c-40cb-a500-ea2b0fdd3753	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-04 17:25:19.940021+00
e515fa5f-9af1-4659-b142-2edbb61dbaba	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-04 17:25:25.994516+00
82441505-df5f-4a53-a9df-1d9b1cb2b543	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 18:18:07.648185+00
dc469a98-5fa1-47b2-9725-70e27936487d	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 18:19:46.271817+00
3c7623ba-0383-4450-9d8d-9e3694aa8bdf	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-05-04 18:19:46.48707+00
255dab4f-d5a1-4dcd-80d5-5a507da91280	e9c3af76-aba2-445d-a592-0a86dbfded43	/ligas	2026-05-04 18:19:47.298397+00
162f187e-11dc-4a83-aecb-03f611e3c49d	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-05-04 18:19:49.549184+00
623c8519-ce39-4d38-85bb-03ff761f6233	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 18:19:50.185461+00
e460d8c6-3eca-420d-bb1f-9c6375cd2f05	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-05-04 18:19:54.849977+00
2cc0840a-b814-4a31-8a26-ce5c3df3d7e2	e9c3af76-aba2-445d-a592-0a86dbfded43	/ligas	2026-05-04 18:19:55.310827+00
c6861af3-37d5-4a4d-91f5-1459680dcb0a	e9c3af76-aba2-445d-a592-0a86dbfded43	/	2026-05-04 18:20:07.64381+00
81a6f621-65eb-460f-a027-31c25fa9e2ca	e9c3af76-aba2-445d-a592-0a86dbfded43	/ligas	2026-05-04 18:20:12.298175+00
2435a36d-383e-4208-84bf-b647df9f8162	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-05-04 18:20:13.057161+00
8725f4f5-35aa-4efd-b3e4-2075c9fc7222	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 18:20:13.78762+00
e25bce79-29e7-400f-a70e-b8bab12cd17d	e9c3af76-aba2-445d-a592-0a86dbfded43	/ligas	2026-05-04 18:20:21.553945+00
bc230fc5-a190-453f-9efa-643e424f491a	e9c3af76-aba2-445d-a592-0a86dbfded43	/matchday	2026-05-04 18:20:50.427733+00
c284adb3-d29a-4893-844b-320023fa3da5	e9c3af76-aba2-445d-a592-0a86dbfded43	/players	2026-05-04 18:20:53.621344+00
0d73a10a-fcee-4702-a02e-7eebf3bd365a	e9c3af76-aba2-445d-a592-0a86dbfded43	/ranking	2026-05-04 18:20:56.072646+00
0b81fade-6728-4e9c-a652-8935c321b21a	e9c3af76-aba2-445d-a592-0a86dbfded43	/login	2026-05-04 18:21:15.608038+00
5815134b-2d78-4da4-b4af-e2b0b3c994bc	e9c3af76-aba2-445d-a592-0a86dbfded43	/players	2026-05-04 18:21:16.432997+00
d674f4dc-869a-469f-85e8-40c174a27aa9	e9c3af76-aba2-445d-a592-0a86dbfded43	/ranking	2026-05-04 18:21:16.445988+00
71f7c170-6883-4d68-8803-e58dc9e2f418	e9c3af76-aba2-445d-a592-0a86dbfded43	/matchday	2026-05-04 18:21:17.425492+00
101d46af-fc8a-4185-ac3b-1d9c1fc48aba	e9c3af76-aba2-445d-a592-0a86dbfded43	/	2026-05-04 18:21:17.914276+00
14841476-7430-4e86-a65c-09e2cd24994f	e9c3af76-aba2-445d-a592-0a86dbfded43	/ligas	2026-05-04 18:21:18.65647+00
34750b44-1d6c-4df4-9432-09b7b7d5f5f5	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-04 18:21:19.418356+00
fc9f7ebe-a4d0-4574-bc08-a30fb9312873	e9c3af76-aba2-445d-a592-0a86dbfded43	/ligas	2026-05-04 18:21:28.111743+00
5cc760a0-feb4-4377-9d2b-fa55a342fda8	e9c3af76-aba2-445d-a592-0a86dbfded43	/org/terrazas-del-valle	2026-05-04 18:21:37.590598+00
c1b213bb-f2ac-4f6e-a5c8-ea38fc232554	a5532e47-13b5-412f-9749-26b2799f04f3	/	2026-05-05 01:32:12.445471+00
715066d1-99f1-44cf-9ffe-e130a9aad4c8	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-05 06:04:36.063805+00
5683660f-b4f0-47d1-9e4a-3068fcc40b4a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 14:36:41.933704+00
ce7d1f28-0d87-45dc-984f-da1a41408ca3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 14:37:08.555306+00
f5928cc9-15ee-4aee-8c58-e38c8998d0b6	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 14:37:15.71655+00
c535a015-090b-40ea-a2bf-1759820e0a62	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-05 15:33:43.519869+00
217ff366-e962-4f24-88ba-c1a2e6e0e9ba	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 15:33:45.721393+00
baf9f6df-29c7-4a94-b6d0-0dab2ebfbbbc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-05 15:33:59.346344+00
489e9146-9b8c-4fce-8ee1-0a722fa994c6	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-05 15:34:11.850363+00
7e790e98-36f2-4675-bac2-a3deb65fea1a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 15:34:13.808146+00
af6a999b-7688-448d-9f73-d77596930e4f	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-05 15:34:21.072034+00
e3fae7da-e174-4ad0-87b7-86dcbdbab6ce	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 15:34:23.14249+00
940366b9-09ea-4262-8036-1eecb03b95f4	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 15:34:26.925555+00
39c9ce33-f31e-43b3-b610-4389c9e33240	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 15:34:29.06083+00
d5cdfc30-8df9-4f84-927e-06061f1bbae1	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 15:34:33.317781+00
9b8f6aee-2775-45e0-b05b-7a1e5d6c20a2	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-05 15:34:36.192741+00
c445a1ab-1d2d-4dfd-8a2d-72ed1090adb4	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-05 16:06:22.057428+00
11cb76c3-8b77-4e7b-ac3c-be0d32b0d7b7	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 16:06:28.249544+00
abbecbce-44a6-4522-950b-a6e3ce337680	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 16:06:30.895421+00
87ddd88a-1a3b-46f2-b172-bdc0f14cb049	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 16:06:34.158939+00
a2535e37-dd3c-43f4-83fd-35a47d479fdd	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-05 16:06:36.430635+00
5f425efe-5271-461b-8004-c98a93b01ed6	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 16:26:53.794658+00
9e4d8f8d-10a1-4f44-aa89-3ce1dea40f11	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 16:27:02.876752+00
ba9f3408-2ab8-43d1-9307-7797569c65f0	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 16:27:02.974568+00
fbccd5a1-aaf1-4269-99dc-16784c370df4	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 16:27:06.13496+00
cdd7037f-c054-4c3a-a285-39047330c1fa	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 16:50:14.274199+00
818d6ea6-6f4f-4a22-9b02-181392495c28	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 16:50:17.167893+00
d0689136-f49f-4e0b-bf2e-55af43b09a29	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 16:50:17.175951+00
ca974e80-451a-427b-8549-e0d6c73d7340	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-05 16:50:19.394394+00
13a0b14d-9a90-44a2-881c-d368599958a7	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 17:33:22.754228+00
d9aed9f4-e968-48a8-a967-7d45025d9497	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 17:33:23.483621+00
d6bbb3f9-1bd6-4a17-a1fa-4c99e372777d	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 17:33:24.280815+00
ee52533b-de60-49a4-b33c-ec13e3399c50	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 17:33:27.402354+00
6820ef2f-3bf2-4a4f-b074-a05f931eccb3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 19:04:48.168631+00
d34ccb7c-6186-4f08-a11a-6bbf6d24dd6a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 19:04:48.622811+00
eb9156f7-f0e6-4b85-bea6-2026bb1f997b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 19:04:51.774272+00
3f1ac2ff-2a8a-4ef8-8fb9-c5356fab5646	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 20:02:07.344222+00
f15c90a5-3541-4f09-a26f-94323bd1abef	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 20:02:08.030967+00
80cd0d27-9238-4052-9f1d-baca0e6cc288	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 20:02:11.789932+00
9536f6aa-8455-4e7d-aba1-400a7cc8d803	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 21:13:16.383571+00
2359a3ed-179a-4b6b-8b21-2d2d8857a0c2	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 21:13:19.230676+00
36043a5f-c50d-43bd-9dd7-b024bd56af17	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 21:13:19.236641+00
cefccf94-be41-4238-a996-2a36e1a754e7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/	2026-05-05 22:02:38.146056+00
baf72ac7-9a75-4b17-85f9-2cb1799666f6	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/players	2026-05-05 22:02:40.778868+00
1819805d-3178-4705-a44a-00ca2468cda7	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/ranking	2026-05-05 22:02:44.569593+00
395e4005-8131-405a-9e98-b03afc5300ec	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/player/[id]	2026-05-05 22:02:44.575141+00
17014dd4-a8e1-4225-a551-4a082ee49584	6e7e8445-5e7b-4cb9-9216-d248442d14ae	/ranking	2026-05-05 22:03:39.535913+00
768a3dfa-cf5d-4d45-bb16-31adaf8c4645	1c14cac1-7e50-4391-80ce-f9a8f8179350	/ranking	2026-05-05 22:03:42.20222+00
518f6c34-c317-4f57-8af7-db718f8f4fbd	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 22:54:52.993428+00
7c1d3407-3ca6-4b85-9f88-bd654e8de316	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 22:54:55.859335+00
871d536f-d01b-4ebb-9ba8-46cb52f224e0	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 22:54:55.984673+00
a53e18bc-cd68-47bb-a1bf-0fa395a5f0ac	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 23:31:26.940349+00
5ea7bf31-3ce4-46b9-8888-3d9a04145fec	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-05 23:31:39.094412+00
fa2fffe7-3327-4900-bb3a-f46b22078f8f	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/player/[id]	2026-05-05 23:31:46.036106+00
99ff9349-8e89-4710-948a-8d1a280252a7	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-05 23:31:58.769505+00
0255e374-3880-43fa-95e1-908fd31dab0b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-05 23:32:01.495128+00
aed6b39b-4c0e-4258-9b5f-423d1cdb7c5e	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-05 23:32:03.053123+00
2c2bf6f1-9aa4-457b-be13-f66f6ed87d20	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-05 23:32:05.736018+00
6b3af4a5-8923-4525-9d6f-54b9af3cc220	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 00:16:20.426799+00
887ee15f-7b2c-43a1-af79-294f6e5239dc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 00:16:21.481398+00
9b08a491-f57e-4193-bdb4-413d02dd3039	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 00:16:24.397063+00
e64f8ce8-8efc-4c1d-b624-3fca0d602ab9	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-06 00:16:28.251961+00
593f8103-377e-4441-a30a-cd823a66613a	069d8748-775b-4a23-9783-c6d6962e7c01	/ranking	2026-05-06 07:09:19.414237+00
2cbd0e5e-554c-4362-83ac-df98da89eae3	61911004-dea4-4234-a53c-8e29626738d5	/ranking	2026-05-06 07:09:22.258214+00
0ee7fa18-164b-4c43-9629-6767d6e1045d	069d8748-775b-4a23-9783-c6d6962e7c01	/players	2026-05-06 07:09:30.048173+00
80018201-823c-4f40-8c84-ed0098b02911	069d8748-775b-4a23-9783-c6d6962e7c01	/ligas	2026-05-06 07:09:42.875917+00
f7960bc1-7f2b-4932-9a91-ad22e62e0964	069d8748-775b-4a23-9783-c6d6962e7c01	/org/terrazas-del-valle	2026-05-06 07:09:42.911215+00
5fdec6d8-fad1-49db-8787-ec62028dbc71	069d8748-775b-4a23-9783-c6d6962e7c01	/ligas	2026-05-06 07:09:46.699805+00
e719daad-bc35-4c49-a8db-7cd51609661c	069d8748-775b-4a23-9783-c6d6962e7c01	/ranking	2026-05-06 07:21:28.851662+00
5ca9d8de-2ed6-4bcd-bc79-b1623188ca69	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 14:35:14.307561+00
f4069d48-f7cf-4895-93d1-92b3baea2029	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 14:35:15.373383+00
9f360ec1-2c71-42e3-905e-a606ded30b65	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 14:35:18.258709+00
7cd147e3-e58c-460e-859f-7da51f292e5b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 14:37:59.764573+00
e60e66fd-c61d-4360-97d9-32003b5d0833	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 14:38:03.584714+00
31ae3475-7e80-4bbe-9c5f-a79ce5ab74e8	41ad8905-8c6b-4802-9f90-7918d5502c0f	/	2026-05-06 15:42:17.957327+00
d46b2197-2508-4500-b81f-c700c4209dab	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 16:01:04.851048+00
290f7892-0154-4b76-9088-a2562910cda9	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 16:01:04.876862+00
7ebf76f4-3b07-412e-b7c6-31439d10f442	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 16:01:33.027024+00
d797e581-e3dd-40ef-a349-fbbe9139bf8f	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 16:01:35.335113+00
2e0a8c33-f34e-40ec-8689-df2ef665d07c	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-06 16:01:39.603941+00
a6cad94a-bae1-4fab-8d12-c4b787e66d49	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-06 16:21:48.34706+00
e10629c6-2537-4662-b5f6-a059e22b8e21	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-06 16:31:30.015894+00
8750131a-695d-4ea7-a25d-0307091fbaa5	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-06 16:31:32.389709+00
1b0b4d54-0cae-4835-9ae7-f8f2e92c056d	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 16:31:34.67296+00
624940f1-2b7b-414f-808a-a5bcee535d63	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 16:31:36.013139+00
bae62a08-ba59-45b7-8470-715c6572f0e5	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 17:19:38.568044+00
f7024d5f-1d4c-4315-99d5-b638033549e4	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 17:19:40.854464+00
097b0ccb-73d8-48a1-85fe-05b48514b6cc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 18:09:12.048487+00
cf7300ee-8faa-46ea-9e88-87c20aaf8fc2	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 18:09:12.139271+00
4cceb0ed-ed57-4757-8fca-3d15fef36d8c	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 18:09:15.975813+00
0cb83b52-10af-4471-84e8-40176fc801f3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 18:23:47.631154+00
f2548dc2-c603-489d-823b-7e889a07d211	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 18:23:48.87953+00
462d1619-0004-4fef-95a1-2b03c826a8fc	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 18:23:54.424249+00
15604db5-cc69-4dcd-a83a-79229a201145	9dc27ffa-e551-45a3-b682-677f707e2f9c	/	2026-05-06 19:15:06.324135+00
9decc50a-5058-44c0-887a-d9c6649b1b3e	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 19:28:28.621048+00
2975cad3-fb72-4aca-b387-72661201dbf8	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 19:28:29.059005+00
84b67f9e-7d3d-434a-ba63-ac9a0e9b681d	a6bdb1d5-98a2-48c0-beeb-1a2d7cd668a4	/	2026-05-06 20:46:30.404683+00
06e028de-dee5-41fa-ad26-569911d94d45	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 20:49:16.924264+00
db2469c4-2f82-4753-a52e-679552f18d28	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 20:49:19.031804+00
99d6f7af-7415-48be-be65-03464ef80ea8	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 20:49:21.131862+00
b0c38074-ce0f-4647-a79b-f80c232fdfb3	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/players	2026-05-06 21:11:46.034614+00
0deea265-6c5c-4b38-94c3-6df141c59b0e	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-06 21:11:46.044046+00
c4352f6b-da8f-4542-bdc1-c4f33eeb762d	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/matchday	2026-05-06 21:11:50.569511+00
4dc975ac-bde6-47b0-8ebc-e37971ce4191	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-06 21:34:05.35524+00
be8da946-c5d0-4eb6-a89a-936cea6b7d80	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 21:34:05.367488+00
4743adbd-54a0-49a1-aaf9-8a375c204464	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 21:38:23.484565+00
9b377860-9091-49ec-a2e5-29e7b84e33b0	1dcd6953-3c81-4560-9479-5e570831f41f	/	2026-05-06 21:39:37.74974+00
ca50028a-7428-4936-8329-26b0c2902001	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-06 21:39:47.795367+00
2d1ca1ab-8aaf-4363-91a9-3e1bb4b62f98	a5860035-47e5-49aa-b151-52547864735a	/	2026-05-06 21:39:57.543675+00
bbd763da-b2fd-4582-aac3-f12e5e9c48a7	2f182e63-b41a-40c2-87b8-802611304752	/player/[id]	2026-05-06 21:40:00.998976+00
eef580d1-43bd-4372-af14-c3863aefe439	2f182e63-b41a-40c2-87b8-802611304752	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-06 21:40:08.944213+00
c4fab2cd-a528-4c0e-9035-63dbf8133753	2d940aa6-f6db-4739-b9ed-798bc982b863	/org/terrazas-del-valle	2026-05-06 23:00:19.842395+00
b0699664-1b7f-45d4-8200-c77fdfb4c7d8	2d940aa6-f6db-4739-b9ed-798bc982b863	/ligas	2026-05-06 23:01:34.65375+00
d23fcc5c-c3bf-4795-8b5f-ab7617fe4ae1	2d940aa6-f6db-4739-b9ed-798bc982b863	/player/[id]	2026-05-06 23:01:50.466406+00
243cd07c-79da-4442-8aab-3ff7c3750110	2d940aa6-f6db-4739-b9ed-798bc982b863	/players	2026-05-06 23:02:01.015083+00
d4e7b5c0-ada2-4ec0-8418-3c49bad9e3fb	2d940aa6-f6db-4739-b9ed-798bc982b863	/matchday	2026-05-06 23:02:03.90168+00
480dfbc6-03c1-47cf-8701-784345e66ee9	2d940aa6-f6db-4739-b9ed-798bc982b863	/analysis	2026-05-06 23:02:20.79202+00
b7ca518a-733c-46be-8b1b-0f17379192da	2d940aa6-f6db-4739-b9ed-798bc982b863	/ranking	2026-05-06 23:02:23.144419+00
a983fe0d-bbe9-40af-962b-94dd2e25d32e	2d940aa6-f6db-4739-b9ed-798bc982b863	/analysis	2026-05-06 23:02:24.943326+00
1f417296-2697-4793-be60-70feda3e791d	2d940aa6-f6db-4739-b9ed-798bc982b863	/ranking	2026-05-06 23:02:37.945287+00
2e968d37-eec1-45f8-9a03-656ae1e0f090	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 23:24:43.68153+00
bf6ae375-2a70-4722-81af-3034fcbf5154	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/	2026-05-06 23:52:48.667698+00
794c4cc7-3c67-4752-b316-a97862eaf6b7	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/players	2026-05-06 23:52:48.672931+00
8ddc68df-0968-488a-a167-b09bf142cd67	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/	2026-05-06 23:52:50.00975+00
01f049d0-adce-470a-8cd7-fae1fc5cbfab	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/ranking	2026-05-06 23:52:53.175684+00
40cdd0a3-07f9-464f-bca2-dfc3234a335e	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/players	2026-05-06 23:53:02.677096+00
d348a7e9-b3d7-453c-b455-ab5cc6d7e11b	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/player/[id]	2026-05-06 23:53:05.12655+00
b3e7850c-d772-4ef4-8365-39ec7a7e36ec	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/analysis	2026-05-06 23:53:07.927217+00
8cc4e85f-d70d-449e-b0ae-4e5eb7d4f025	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/login	2026-05-06 23:53:16.810436+00
f7ad6e0f-6eed-44c9-80fe-8212f8969b46	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/analysis	2026-05-06 23:53:20.480833+00
249762a2-bdab-4053-88bb-817f448c8d2d	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/	2026-05-06 23:53:22.738956+00
ecad133c-2f77-4892-8599-6ba5183ac07e	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/ligas	2026-05-06 23:53:43.021631+00
694accac-25b8-4f8f-b04b-e211259adec2	0be26896-e364-43ea-ba3c-cb7b530fbe7b	/org/terrazas-del-valle	2026-05-06 23:53:46.648205+00
1b05dabb-7832-4a8e-b1c4-680e9e5cd9df	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-06 23:55:34.706947+00
3832996a-cf75-4f6c-ab6b-ad3731e2e3c5	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-06 23:55:38.1026+00
6a208f7a-9806-468a-8fc1-a2ccfc2b2c92	37f95070-f4c7-47e1-87ba-9059391e40ba	/	2026-05-06 23:56:54.64398+00
a4aeff03-51d6-428d-969a-b97f9327a294	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-07 00:00:35.436948+00
5ac1f471-b409-4c6d-b148-3f5f327be66a	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/	2026-05-07 00:00:53.721139+00
d14edc15-6ce5-4a4c-b83d-6b62f56bf4c3	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-07 00:47:45.017803+00
b62667f7-9d96-4e01-aed2-1d5295c9beb2	0b4a8706-4234-4746-8940-0d1708f0ae67	/ranking	2026-05-07 00:47:46.551837+00
56515947-c4ac-40ba-bbba-df800ec21789	68362c12-522e-41e5-85ff-7989b911611b	/	2026-05-07 02:01:11.116498+00
adc3e3f0-fac9-4289-bd9b-2cc4d54d4d32	cd7fb589-666a-486f-90e3-90c9caeecfb4	/org/terrazas-del-valle	2026-05-07 03:22:04.296751+00
1a6ff6ed-a698-4826-a893-2f1431532896	cd7fb589-666a-486f-90e3-90c9caeecfb4	/ligas	2026-05-07 03:22:32.142024+00
62a342d4-5c43-4dce-82dd-3e4a0615f068	cd7fb589-666a-486f-90e3-90c9caeecfb4	/org/terrazas-del-valle	2026-05-07 03:22:36.569533+00
36f946c0-dd9e-4675-a985-50de2511ee16	cd7fb589-666a-486f-90e3-90c9caeecfb4	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 03:22:51.938027+00
32c7d61a-b2a6-4950-ae4c-9dba2f9dce13	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 03:29:43.485443+00
9bb4d77d-5e4d-4a1e-97e5-a9279fd0920f	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-07 03:30:17.135906+00
88cfc221-4500-4c9c-8813-aa07f605cfef	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-07 03:30:23.885551+00
a22e5083-a5c7-4e31-a630-fbb61f4bad73	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-07 06:03:16.020342+00
cbe45b16-75d8-4d55-a67e-b5976b239feb	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-07 06:03:22.32559+00
f91eca0f-3fb7-4430-be73-1da769780206	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-07 14:16:12.061604+00
f02a71da-fde7-4f56-90cc-107ed46a020b	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-07 14:16:13.124843+00
67db2b6a-99aa-464d-87d1-d9ed4c6f35f8	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 14:16:15.662459+00
061e073e-addc-43d6-b2a6-b202b044efdd	94e70a82-6a20-4250-9a8e-cdba784bfd77	/	2026-05-07 16:57:10.492865+00
e5f07620-aee6-4ede-9e1e-d04a593f1773	69470a35-a309-47c2-bcea-5d711c7e654a	/	2026-05-07 16:57:13.213049+00
291d4227-6cf0-45d7-a8e1-54faa038c0a9	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-07 17:23:56.06417+00
febb6c79-c0f4-4a4f-94df-e8cfcb61af69	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-07 17:23:56.097125+00
b8c3adac-765c-4615-b2df-2e03c311ea2d	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 17:23:58.919849+00
844afaa2-779b-4b4f-8bb7-77542dbe50de	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ranking	2026-05-07 17:24:06.260052+00
27040aa6-2d29-4852-b462-d8d0daf8c794	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/ligas	2026-05-07 17:24:09.245049+00
34409fe2-15ea-4ac1-a3d6-40f06c5e3438	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-07 17:24:11.062502+00
8f5c880d-d3d7-4bc7-902c-ba4d6bf2e7e6	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/ranking	2026-05-07 17:33:45.038703+00
4f99a634-2b43-41c9-a704-8eda453336c9	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/	2026-05-07 17:34:06.337787+00
7f9f6e83-4d66-4495-a75f-df5983fe7876	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/ligas	2026-05-07 17:34:11.243035+00
7e858a05-3945-49d5-8f75-170a77b8febf	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/ranking	2026-05-07 17:34:13.840073+00
54fbe0d0-8242-4c44-8b90-7bb3f31d1711	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/ligas	2026-05-07 17:34:15.265601+00
f7081270-0dc6-4ba7-b103-dae7d53451ad	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/players	2026-05-07 17:34:16.487555+00
9d838750-bb8a-4aa8-ada8-18f0b1df0f8d	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/matchday	2026-05-07 17:34:23.132452+00
4e0e1720-147c-41bf-ae39-0d1428780007	bea7c476-33fb-4fab-a647-cfc2ee811d2a	/org/terrazas-del-valle	2026-05-07 17:53:00.083738+00
22393dd2-82f9-4a96-8d69-6e9eb857f819	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-07 21:39:09.182449+00
307bdb9d-22f6-4ce0-bf4c-9be1e77741de	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 21:39:15.727076+00
089054c2-b5e7-4002-9c69-d57bb0aa2840	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-07 22:44:04.364796+00
85748c83-0491-43c5-8165-098624a301ca	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/new	2026-05-07 22:44:04.582366+00
f1883d42-574b-40af-b448-e7abcf5a6ab3	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/3995e19a-61c7-402f-b4d1-e79d20e9ea3f	2026-05-07 22:44:18.671806+00
66a6a953-88c2-44b7-969d-1d626a5a6663	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/import	2026-05-07 22:44:21.113898+00
6c3bfab1-3d86-4575-b599-12a54d5e9815	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-07 22:46:58.270632+00
b214f043-9086-4ffe-97c3-f0e16ed76b05	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 22:47:06.055116+00
21f44572-becc-460c-902a-e6b008558645	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues/3995e19a-61c7-402f-b4d1-e79d20e9ea3f	2026-05-07 23:19:56.063346+00
61d2743f-3e01-44e0-9cfd-d71369f0ccce	6125100f-af57-4a5e-9bc9-b5b3fa55f16d	/admin/leagues	2026-05-07 23:20:57.07647+00
b5bc0801-837f-48bd-8236-164bccd96c3b	0c1333db-17ea-4c7a-993f-5e531a9cbc78	/org/terrazas-del-valle	2026-05-07 23:37:18.963353+00
b26a1e48-6876-4b7f-88f5-3692403069f9	82abc14f-87cd-42fe-9cfb-e16d8bd6f81c	/org/terrazas-del-valle	2026-05-08 01:42:11.866439+00
da6b0774-0a99-46d1-894c-527eb5366539	f2ffa94a-1f5b-43dd-a077-4d9f00d5f12d	/	2026-05-08 02:02:08.370456+00
5ee9060e-434e-4d8e-ab6a-15eaa6bca4dd	c44f4a8c-971e-48ea-97f7-e4e6eea54c6b	/	2026-05-08 06:05:00.061031+00
9ed85212-907e-4f84-bcf3-6fb9988a6e61	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-08 06:15:58.885308+00
68ecf9d5-539a-4dc6-8143-36e7344e5082	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-08 06:15:58.890059+00
9377d6e0-fc02-4e64-b976-481ed08eb58b	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-08 06:17:39.70333+00
221ff0d9-ce84-41e3-95ea-2881508e256a	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-08 06:22:03.34033+00
5d8b4881-8cfc-4619-851e-5f0a59bc25d1	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/mi-liga-lunes	2026-05-08 14:18:34.884492+00
820501f5-36db-42d9-b488-e92712d8f558	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 17:06:29.262536+00
8ecf1e0f-6e69-4862-a234-7265ce894902	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 17:06:30.669608+00
7a4ecc5c-a674-4375-a99b-6f4bf734493a	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-08 19:50:40.191482+00
9217ba9c-83b4-484d-8b9e-15d609d9acdd	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-08 19:50:45.152235+00
c3a58068-40d4-4e24-a260-a50b1d09a28a	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 21:01:15.251756+00
63dde8dd-5fb9-4696-b687-9f59408d97ae	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-08 23:48:46.603283+00
3e70bf97-61c4-4a70-a8df-46a3ec094025	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/login	2026-05-09 06:35:39.061238+00
a8e710fd-e3b0-49aa-a54e-248716e70566	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/register	2026-05-09 06:35:44.366633+00
9f9df415-79e4-4ad7-a494-2d692e9031f6	7a40ecae-510c-43bb-8353-b2bacbcc69a0	/verify-email	2026-05-09 06:36:07.808683+00
3e31412c-6d91-4742-8215-eb7ecdde9ed4	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/login	2026-05-09 06:36:25.810119+00
0c9ced5f-b4d3-4387-994f-9c7492078f16	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/onboarding	2026-05-09 06:36:45.864766+00
52c72d74-6b8d-426d-8762-0f794a328ca5	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin	2026-05-09 06:37:04.65286+00
b1293354-c189-4d50-8d82-364ea07e49e9	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/organizations/c985320f-5636-4c76-8cce-933da695c41f/request-verification	2026-05-09 06:37:11.726461+00
d969d4e7-7a3a-4cdc-8104-e6c86e198ded	89e5eabc-3e85-4cbc-aab6-6d90e0ce512e	/admin/leagues	2026-05-09 06:37:15.283542+00
768e088a-51fd-4627-8694-8ca5f5bb65e7	e92be1cd-cc48-452a-8b3d-cc3ac7a85a24	/	2026-05-09 10:53:45.572113+00
81d18b9a-4392-4c4d-a027-ea5b9c1c4c15	c1570541-5b00-4104-807f-f9c145ff25b5	/	2026-05-09 10:54:02.876372+00
4a392700-81db-4839-80e2-897cecfbb9a5	d5b95ef5-4016-4ea3-82e6-09f3e6b2b5fa	/	2026-05-09 20:46:30.48119+00
e115f508-7f19-45ae-ac3b-ed69d326f00e	3f456e22-9fed-4a65-aa0e-49c8476a7fb6	/	2026-05-10 17:49:09.675045+00
9f8a7d4d-72b1-4d8b-b9dc-a3f9f7805a50	e9360ba6-7720-4140-a653-780ba8b221e6	/	2026-05-11 09:11:24.026128+00
030b3d85-48e4-4a97-a437-7c375bb56522	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-12 14:55:56.244987+00
8ab2e4ac-0d84-495b-84e2-6cf0d8d3c4ee	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-12 14:55:59.413588+00
e3278e06-1097-4261-9fab-6dc538b982b3	af9c87e6-65c0-49bc-ba40-42a688dc6a3e	/	2026-05-12 14:56:37.59635+00
bc6e2829-b951-4aa6-930e-cf493bc37409	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 15:20:53.445679+00
e0a02d46-fd02-4953-9a06-31b20baed9e8	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 16:33:01.440157+00
b3932646-8352-4678-911e-dedc5ba54dbc	5e25c9a4-e172-4e70-8cce-201620a83d88	/	2026-05-12 16:33:01.452434+00
c5fd4099-0fc2-439d-a25f-93b1ec8f4b7b	5853c67f-a163-4762-b80c-e46b84435f19	/players	2026-05-12 17:57:13.774005+00
1e90ca85-4da3-42b4-be29-2acef95c03a1	5853c67f-a163-4762-b80c-e46b84435f19	/ligas	2026-05-12 17:57:15.422956+00
7b179415-f0cc-44b4-87be-857f845ec354	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle	2026-05-12 17:57:16.900586+00
5e7092a3-4bd5-49fc-b2d6-209026f2ae46	5853c67f-a163-4762-b80c-e46b84435f19	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-12 17:57:20.691493+00
d35fcfa0-bc26-4c92-8204-1f01d8bcdaa2	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 18:22:53.143713+00
10770e42-98db-4a2a-8d3b-806a62d16736	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 18:51:31.349585+00
6db43f2f-8f47-4aa2-b45d-789a0bc389be	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 18:51:35.98796+00
1f65ff74-eeac-47e2-ba88-3f3e9a3356f3	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 18:51:50.305363+00
5192a133-47a8-48d1-b243-ff6425cefcc6	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/mi-liga-lunes	2026-05-12 18:51:53.125693+00
37d999a6-3d7b-4b5c-a71e-9d452190fabf	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 18:52:03.415356+00
054f38c5-446b-4fa1-861e-f921e2e58a1d	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/	2026-05-12 22:19:31.810679+00
ac4d4cf6-9c4e-4b15-9402-a9a5769c5719	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/ligas	2026-05-12 22:19:33.891158+00
6352fce6-2a91-4c30-80c0-69c1ce27f132	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/org/terrazas-del-valle	2026-05-12 22:19:35.153694+00
3dd4e968-6f28-4de9-8da7-c5d1bb2eeccc	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/login	2026-05-12 22:19:36.165+00
07f7afc1-5905-4f31-bac1-050c610edad7	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 22:19:57.509188+00
b3dc6ab3-acc3-4129-9c8e-4e833d49e0f6	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues/7f4a371e-05a1-4240-bf3b-afd47c8592a9	2026-05-12 22:20:08.490856+00
70c7d341-2778-4a65-a50d-dfe1ff6eb457	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/teams	2026-05-12 22:20:14.45888+00
5b999834-8c83-460b-a63c-914e88a3bccd	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/players	2026-05-12 22:20:15.578034+00
b0ae199e-16ec-47c2-bb72-0c377934e2b3	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/users	2026-05-12 22:20:17.313388+00
befd8fad-d722-4519-bbc0-d362214119c9	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/verifications	2026-05-12 22:20:22.604481+00
878c4b88-018e-497c-84d8-73658ea35f50	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 22:20:36.563418+00
a7c78887-2dec-4410-b793-30f9d7114033	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/leagues	2026-05-12 22:20:41.187172+00
13039a23-51df-479b-980d-9be198e27387	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/teams	2026-05-12 22:20:41.217391+00
bb9986c3-2809-4f86-a4f7-5b8efd001fcb	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 22:20:46.027544+00
6312db60-2736-4b59-82b5-5757eb14ae87	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/import	2026-05-12 22:20:48.928192+00
828ac1bd-e403-422e-bc8c-07f7d2c1c211	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/imports	2026-05-12 22:20:49.391886+00
cb729984-5935-4e5f-9fb5-d7f38bd73ea0	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/organizations	2026-05-12 22:20:53.578696+00
fcf8b592-e146-47e3-a8b5-f7f08853b3b0	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin/organizations/80bd1d29-e236-412f-9dd4-1919fc101a5e	2026-05-12 22:20:56.18417+00
4caf70e2-916b-4cfc-971c-bc8e55d93f5e	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/admin	2026-05-12 22:21:02.910607+00
7be7af78-42b7-43c7-b60c-76ec3c9f5f41	55e7bf5e-04b9-47c9-b387-2fd3e5bb6e77	/login	2026-05-12 22:21:05.651749+00
38e4eb75-0df4-4dae-b183-155766d1d235	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 22:52:17.967027+00
8cf1b903-8c8a-4d8c-a327-7c8e2b9162a8	5e25c9a4-e172-4e70-8cce-201620a83d88	/ranking	2026-05-12 22:52:24.621486+00
5585bca9-b407-48bd-838a-4d1db61f8031	5e25c9a4-e172-4e70-8cce-201620a83d88	/players	2026-05-12 22:56:12.729088+00
9180336b-74bd-405b-b746-e0020224d7b9	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-12 22:56:13.969782+00
2aa770b6-bf68-406b-8215-1db00caa2db6	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 22:56:14.985808+00
00212779-7fe0-4ea1-a7f5-1957bfb4d889	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-12 22:56:20.938498+00
b928f049-a34b-44b3-860b-eb0fca676fe1	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-13 00:01:44.671215+00
4cd8eb34-0e64-4aef-a644-3addafcf6efa	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-sabado	2026-05-13 01:22:33.481496+00
54cd618b-e922-4a12-bd42-68593e0c2e2a	dd65c0e0-f86b-459c-a939-9b257d48a4e6	/org/terrazas-del-valle/liga-femenil-viernes	2026-05-13 01:22:34.46665+00
f94f97a2-a2af-4157-b79c-c9a25add36a3	5e25c9a4-e172-4e70-8cce-201620a83d88	/org/terrazas-del-valle	2026-05-13 02:50:11.306335+00
9c92e48d-9bc3-40fa-8b78-eeb83465ab0a	9fe026e4-d9c3-4a1a-944e-c8d53b8aa443	/ranking	2026-05-13 04:38:06.626766+00
d53c63a3-9ae2-4493-98e7-fbbbe807a90d	e42e4f82-2fcf-4ad7-85c4-f5c88ee482dc	/ranking	2026-05-13 04:38:07.742311+00
\.


--
-- Data for Name: player_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.player_profiles (id, organization_id, full_name, alias, normalized_name, fingerprint, claimed_player_id, claim_status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: player_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.player_registrations (id, legacy_player_id, team_id, league_id, jersey_number, registered_at, player_profile_id) FROM stdin;
aeb14ab2-fe22-4235-9aea-d4ebdfd37370	da78bf88-53be-405d-a8e2-cb794434b0ab	85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
aafcc705-8ce3-411a-9c17-0346cb168114	e8a6ce76-e624-4fca-9dee-0922921a2522	8b9d9cae-bd6b-4918-b759-c04c36c11140	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
ddbd399f-a618-402a-9ab2-8c53540c13e3	9039d3cd-574a-4dbf-929e-6322f0269e64	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
1048c79b-983d-401b-86ca-f4d86246dadc	b151ae58-b5a7-49d9-8da3-8b9b04e6ebac	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
9dca3810-d0d3-4dc3-a879-99ada0da3f1a	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	85964e4f-2396-46dd-abdb-346e42773de2	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
8d8458e6-87e2-4787-b3ce-9d97694024d5	d37505cb-92b0-486d-b0fb-e539a486dcbf	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
1f4ae030-7a3d-4d8a-9cdb-4a7ae3b8079e	2211292b-f982-41e7-9a3b-25d7f7fa38a4	8b9d9cae-bd6b-4918-b759-c04c36c11140	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
bc85faae-1545-4c88-8677-10d593d7a524	695fec9c-3c89-4607-a4fb-23304ca6b4bc	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
c6d8697a-e6b6-4fe2-ab51-48cd41b704f2	0d5fcf72-57b8-4a1f-a6e3-419146c4cc74	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:16:00.308286+00	\N
a1869945-06cf-4540-8729-1264e52feed2	695fec9c-3c89-4607-a4fb-23304ca6b4bc	730f2df0-3ab1-4ff6-8912-f2dcb569ea25	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
0ef6ad35-f9ed-48c6-91e3-0c841f8d932b	5d125ec7-7acd-4b6c-a0c1-5c98388001f1	1b07b0ae-0b44-4ed4-b036-f0e84508417b	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
fa1890db-ab7b-4433-8eb5-216520dc7949	8df513cc-cc8b-4e47-a037-beaf1db01003	c1ebdd55-7d59-4db0-87d4-ca49611f2f65	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
a19be0f8-f52d-42c1-89c4-a7f26c97c896	9039d3cd-574a-4dbf-929e-6322f0269e64	96cf5629-ad5f-4521-b296-3dba1b485ce5	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
a2e31b65-3f0f-4ed7-9a5e-0c725d490384	2211292b-f982-41e7-9a3b-25d7f7fa38a4	96cf5629-ad5f-4521-b296-3dba1b485ce5	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
26d203e6-6b84-454c-9101-8ddb2e79147f	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	1b07b0ae-0b44-4ed4-b036-f0e84508417b	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
0d482e35-07fb-4c26-97f7-ac2b76c9dd87	cdde08c9-badf-45e0-ac35-6b0fa2aeaac2	1a45e450-7ed6-4674-b5f4-85163ac13a05	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
b3763c3b-728e-4212-aa8c-e7eed3df0c08	30865542-67ff-4941-b393-944bc5ecfaae	59dd2cb5-2cde-4b7d-9f01-7424779abc9b	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00	\N
54a15c25-60bd-40d8-8eb4-acdf2d8c0619	135badcc-4612-4e6f-b9b4-997403da4d38	464fd943-29d5-45ef-b619-df7aebd9f467	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
e0f7bd1b-aa3b-4b6e-841b-85615f0d27a6	785c3aae-c663-4438-bd88-a4786b5b5d41	ad1063ee-a66a-4d29-aee8-3683a1ac35be	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
69f26463-d538-4c26-84c8-1cf9d40f6ecb	63082092-59b3-49aa-978d-901f9e995938	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
4b48f882-61e0-48c3-850a-63fa18ed165b	da78bf88-53be-405d-a8e2-cb794434b0ab	f18f3a38-fe26-4769-936b-4a1fcfe154e1	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
f697f8a8-dd01-44c0-bdf2-c5968dfeb901	6c39cc0e-1e8b-48af-ba90-3e5c7ddfdb13	0dc75848-f30b-4cba-ab93-f7c96baa4584	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
b9ac634a-af99-4ac3-a0c8-8353b6dd8226	e12c2cac-b46d-403b-9b9b-50a52ea251e8	f3cbe65f-6ceb-4361-af48-1fb676d8bc29	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
3f323ab2-56b5-434c-ba05-ff972d8b3d9b	74f618a5-1bba-4739-bdbf-55d3d6e16f74	f3296459-1cf4-4603-ae1b-cb77385edb5e	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
9cdd325c-9f8f-47c6-8aae-bc182d6807ce	b2fc6f17-9c46-46b9-90e3-7d98a4c6dfe0	030bd258-db73-4ce0-9c89-a84ddbc8286b	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
fb0f142f-3d2a-472f-b857-39886e576472	2668a1e0-8726-4348-b687-ebb7b87051a0	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
d7834ad7-7986-493f-87db-b0701be62d2d	510e545f-4968-4505-a124-1f9a53c643cf	464fd943-29d5-45ef-b619-df7aebd9f467	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
adb68269-210d-4597-8914-f2713f146923	fe467355-e5b4-46b0-bfa5-ed787045b151	f3296459-1cf4-4603-ae1b-cb77385edb5e	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
56e40b20-33d7-4795-a217-10fea25e15c9	00682521-fce6-4e95-a3dc-a5065a725ccd	f3296459-1cf4-4603-ae1b-cb77385edb5e	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
a388da6a-dac1-4da5-a6d2-7de7eb9bfcb2	5ed9c1db-8b6b-44e3-bf7f-63276d0e5720	ad1063ee-a66a-4d29-aee8-3683a1ac35be	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
b89dc237-942d-4b13-931e-1ccaa74ffc72	724e724a-8d56-4c88-ae1b-f92774d40d6a	c98d0978-fd37-4284-90b6-1eefdf2f5eb0	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
fd1599b9-5b6f-4b27-b779-ff497397d134	884e632b-774b-4972-9266-1df14a761ad1	f18f3a38-fe26-4769-936b-4a1fcfe154e1	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:50.186435+00	\N
e60320b1-a89f-492b-aa53-f65983f2a55e	86028288-18d7-42ad-ab31-1f2393766cfe	4218b25c-6978-4786-a417-134cf0b6c586	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
68fcec42-6f1d-4381-9fef-3ca5e94de726	c0d75b0c-d4aa-4084-b171-3e9da8749af3	74734271-881e-413d-b888-b00b3ad53813	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
90490177-1cc4-4bfc-9067-5a7eba468144	943edf88-5501-42ad-a0a1-4ed411f9e39f	b405c94a-e43c-4c6c-9288-e4717e97582d	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
cda635aa-a918-4c9a-bbd7-1f39f4d516a1	2e349b8b-f9cf-4d4b-8c10-7b54498265ac	74734271-881e-413d-b888-b00b3ad53813	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
ee3c8fdd-f13d-4e39-884b-8f159dba6034	cfe7279e-8de0-489a-b061-233c030598ca	74734271-881e-413d-b888-b00b3ad53813	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
4ad9dd4a-63a2-4be5-a40c-17f82dd6a642	c75159c8-585a-466f-b9d8-9e1dda3b23b6	74734271-881e-413d-b888-b00b3ad53813	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
e50e86aa-d984-4531-9367-67549beaa917	5b049cac-6020-436f-a997-46eb840bafbf	74734271-881e-413d-b888-b00b3ad53813	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
9e94aa7a-b9b3-430f-80ae-0b9f81ecd1e9	1e70e106-6c18-463b-9df2-1d7acc75e761	b405c94a-e43c-4c6c-9288-e4717e97582d	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
176299f7-9e69-491f-89e2-1328dbae5068	212b7602-73de-4b27-9c78-524f939eef2b	11528ddc-6887-4993-a74a-731bd31364b6	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
6dc41ef5-c2bc-4230-a1db-ebc15e40d3bd	708e0da0-0f6e-48ce-9188-c35d5518cf4e	11528ddc-6887-4993-a74a-731bd31364b6	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:45:14.964848+00	\N
4fb2360f-948b-4c7d-8191-d478c3c86dfc	d37505cb-92b0-486d-b0fb-e539a486dcbf	96cf5629-ad5f-4521-b296-3dba1b485ce5	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-05-07 23:20:31.812162+00	\N
\.


--
-- Data for Name: player_season_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.player_season_stats (id, legacy_player_id, league_id, team_id, matches_played, goals, assists, yellow_cards, red_cards, jornada, updated_at, player_profile_id) FROM stdin;
d9e315be-4dba-410b-9451-97cd75affbf2	135badcc-4612-4e6f-b9b4-997403da4d38	2f421880-fb44-482f-8030-b4e11def2192	464fd943-29d5-45ef-b619-df7aebd9f467	0	12	0	0	0	11	2026-05-01 21:23:50.199+00	\N
40dd31b2-1872-4566-9415-cff077192ddf	785c3aae-c663-4438-bd88-a4786b5b5d41	2f421880-fb44-482f-8030-b4e11def2192	ad1063ee-a66a-4d29-aee8-3683a1ac35be	0	12	0	0	0	11	2026-05-01 21:23:50.199+00	\N
83e07c15-f904-405c-8da3-34af49e1bc2d	63082092-59b3-49aa-978d-901f9e995938	2f421880-fb44-482f-8030-b4e11def2192	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	0	10	0	0	0	11	2026-05-01 21:23:50.199+00	\N
db870ba9-2bd8-40f7-81ff-26103a4b2835	da78bf88-53be-405d-a8e2-cb794434b0ab	2f421880-fb44-482f-8030-b4e11def2192	f18f3a38-fe26-4769-936b-4a1fcfe154e1	0	10	0	0	0	11	2026-05-01 21:23:50.199+00	\N
6345e6ee-e297-4ac5-b55f-c3b64eeb4b3d	6c39cc0e-1e8b-48af-ba90-3e5c7ddfdb13	2f421880-fb44-482f-8030-b4e11def2192	0dc75848-f30b-4cba-ab93-f7c96baa4584	0	10	0	0	0	11	2026-05-01 21:23:50.199+00	\N
61ff7576-4157-4dd0-b2d4-3d2747253106	e12c2cac-b46d-403b-9b9b-50a52ea251e8	2f421880-fb44-482f-8030-b4e11def2192	f3cbe65f-6ceb-4361-af48-1fb676d8bc29	0	10	0	0	0	11	2026-05-01 21:23:50.199+00	\N
50da7940-f2f4-46d8-bd2c-57432176e0c8	74f618a5-1bba-4739-bdbf-55d3d6e16f74	2f421880-fb44-482f-8030-b4e11def2192	f3296459-1cf4-4603-ae1b-cb77385edb5e	0	9	0	0	0	11	2026-05-01 21:23:50.199+00	\N
d2d26367-92a2-449e-83e4-ca893744520e	b2fc6f17-9c46-46b9-90e3-7d98a4c6dfe0	2f421880-fb44-482f-8030-b4e11def2192	030bd258-db73-4ce0-9c89-a84ddbc8286b	0	9	0	0	0	11	2026-05-01 21:23:50.199+00	\N
66eaf523-2393-4f13-b75d-fcb045a87c71	2668a1e0-8726-4348-b687-ebb7b87051a0	2f421880-fb44-482f-8030-b4e11def2192	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	0	9	0	0	0	11	2026-05-01 21:23:50.199+00	\N
afb9acef-d3cf-49eb-a699-1c3439c935b7	510e545f-4968-4505-a124-1f9a53c643cf	2f421880-fb44-482f-8030-b4e11def2192	464fd943-29d5-45ef-b619-df7aebd9f467	0	8	0	0	0	11	2026-05-01 21:23:50.199+00	\N
17d43080-7759-418e-bc9c-b36c4177e8bf	fe467355-e5b4-46b0-bfa5-ed787045b151	2f421880-fb44-482f-8030-b4e11def2192	f3296459-1cf4-4603-ae1b-cb77385edb5e	0	8	0	0	0	11	2026-05-01 21:23:50.199+00	\N
6a9412c6-9cdd-47b9-b66d-fdc7758b4a0f	00682521-fce6-4e95-a3dc-a5065a725ccd	2f421880-fb44-482f-8030-b4e11def2192	f3296459-1cf4-4603-ae1b-cb77385edb5e	0	8	0	0	0	11	2026-05-01 21:23:50.199+00	\N
e4c2fed7-ee13-447b-982c-7a5e98891800	5ed9c1db-8b6b-44e3-bf7f-63276d0e5720	2f421880-fb44-482f-8030-b4e11def2192	ad1063ee-a66a-4d29-aee8-3683a1ac35be	0	6	0	0	0	11	2026-05-01 21:23:50.199+00	\N
c1f0274d-cd09-46dd-a265-9060433cc405	724e724a-8d56-4c88-ae1b-f92774d40d6a	2f421880-fb44-482f-8030-b4e11def2192	c98d0978-fd37-4284-90b6-1eefdf2f5eb0	0	6	0	0	0	11	2026-05-01 21:23:50.199+00	\N
eab8426c-cbd8-465f-be51-a65c16000388	884e632b-774b-4972-9266-1df14a761ad1	2f421880-fb44-482f-8030-b4e11def2192	f18f3a38-fe26-4769-936b-4a1fcfe154e1	0	6	0	0	0	11	2026-05-01 21:23:50.199+00	\N
c733ba8c-f82c-4bdb-b093-816da7005c5b	86028288-18d7-42ad-ab31-1f2393766cfe	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	4218b25c-6978-4786-a417-134cf0b6c586	0	22	0	0	0	7	2026-05-07 22:45:14.985+00	\N
67bc1ad1-d732-46ad-821a-1bb82e34006e	c0d75b0c-d4aa-4084-b171-3e9da8749af3	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	0	13	0	0	0	7	2026-05-07 22:45:14.985+00	\N
dbdfa409-d6bd-41ef-95b0-4c20005116ce	943edf88-5501-42ad-a0a1-4ed411f9e39f	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	b405c94a-e43c-4c6c-9288-e4717e97582d	0	13	0	0	0	7	2026-05-07 22:45:14.985+00	\N
08711aaa-ece6-4bba-b20e-8bc3b4a5c5e2	2e349b8b-f9cf-4d4b-8c10-7b54498265ac	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	0	12	0	0	0	7	2026-05-07 22:45:14.985+00	\N
8bd84aeb-124e-4cd7-aebd-94c17678c4a8	cfe7279e-8de0-489a-b061-233c030598ca	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	0	7	0	0	0	7	2026-05-07 22:45:14.985+00	\N
0f42e1d2-f871-4669-9f1f-ff64e862e27c	c75159c8-585a-466f-b9d8-9e1dda3b23b6	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	0	7	0	0	0	7	2026-05-07 22:45:14.985+00	\N
6642727c-13a4-4217-a114-01eacd92e4a8	5b049cac-6020-436f-a997-46eb840bafbf	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	0	6	0	0	0	7	2026-05-07 22:45:14.985+00	\N
c29d9b04-bce0-476e-bbb6-a77afc78aec2	1e70e106-6c18-463b-9df2-1d7acc75e761	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	b405c94a-e43c-4c6c-9288-e4717e97582d	0	6	0	0	0	7	2026-05-07 22:45:14.985+00	\N
123aa25e-ea5f-40b9-ac87-6c2a133bc215	212b7602-73de-4b27-9c78-524f939eef2b	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	11528ddc-6887-4993-a74a-731bd31364b6	0	6	0	0	0	7	2026-05-07 22:45:14.985+00	\N
5a6ee48f-4d04-486f-984a-8cfe97f3bf21	708e0da0-0f6e-48ce-9188-c35d5518cf4e	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	11528ddc-6887-4993-a74a-731bd31364b6	0	5	0	0	0	7	2026-05-07 22:45:14.986+00	\N
5d667035-9c40-4089-8120-012a01fbc530	da78bf88-53be-405d-a8e2-cb794434b0ab	7039a7b9-c837-4b9d-af24-137423e2ee33	85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	0	31	0	0	0	11	2026-05-07 23:08:42.065+00	\N
869f9da9-66c9-4d91-8c8c-9dcd3f71a862	9039d3cd-574a-4dbf-929e-6322f0269e64	7039a7b9-c837-4b9d-af24-137423e2ee33	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	0	19	0	0	0	11	2026-05-07 23:08:42.065+00	\N
20945eac-cb25-487c-8943-5afa0e458c92	e8a6ce76-e624-4fca-9dee-0922921a2522	7039a7b9-c837-4b9d-af24-137423e2ee33	8b9d9cae-bd6b-4918-b759-c04c36c11140	0	19	0	0	0	11	2026-05-07 23:08:42.065+00	\N
aeb9120d-fbbe-4e0a-97df-24f3a54b0ded	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	7039a7b9-c837-4b9d-af24-137423e2ee33	85964e4f-2396-46dd-abdb-346e42773de2	0	14	0	0	0	11	2026-05-07 23:08:42.065+00	\N
8233d156-d460-4ef2-926d-b1c498b09bd1	b151ae58-b5a7-49d9-8da3-8b9b04e6ebac	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	0	15	0	0	0	11	2026-05-07 23:08:42.065+00	\N
6b8c81aa-8993-4932-bb7c-6ee0dd1a6327	695fec9c-3c89-4607-a4fb-23304ca6b4bc	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	0	6	0	0	0	11	2026-05-07 23:08:42.065+00	\N
2b97f0ed-8424-4dd2-a37b-004df7c67870	d37505cb-92b0-486d-b0fb-e539a486dcbf	7039a7b9-c837-4b9d-af24-137423e2ee33	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	0	10	0	0	0	11	2026-05-07 23:08:42.065+00	\N
c3e532a3-30b9-474e-82a7-bfc8b5abf3ac	2211292b-f982-41e7-9a3b-25d7f7fa38a4	7039a7b9-c837-4b9d-af24-137423e2ee33	8b9d9cae-bd6b-4918-b759-c04c36c11140	0	8	0	0	0	11	2026-05-07 23:08:42.065+00	\N
f51e94d9-c9da-4ae9-8b66-94f5cca93e1c	0d5fcf72-57b8-4a1f-a6e3-419146c4cc74	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	0	6	0	0	0	11	2026-05-07 23:08:42.065+00	\N
beccae78-b1a6-4e9d-bac2-b33295a0f59c	695fec9c-3c89-4607-a4fb-23304ca6b4bc	e01fb0a1-597a-4d82-be66-741d84549ddb	730f2df0-3ab1-4ff6-8912-f2dcb569ea25	0	15	0	0	0	9	2026-05-07 23:20:31.837+00	\N
22a239a0-600a-462c-986e-fc7de7469745	5d125ec7-7acd-4b6c-a0c1-5c98388001f1	e01fb0a1-597a-4d82-be66-741d84549ddb	1b07b0ae-0b44-4ed4-b036-f0e84508417b	0	14	0	0	0	9	2026-05-07 23:20:31.837+00	\N
555888e6-0d4d-4b42-8182-f292690790c5	8df513cc-cc8b-4e47-a037-beaf1db01003	e01fb0a1-597a-4d82-be66-741d84549ddb	c1ebdd55-7d59-4db0-87d4-ca49611f2f65	0	8	0	0	0	9	2026-05-07 23:20:31.837+00	\N
1ffdbf09-8ce4-47a4-913e-b80d23bdf8eb	cdde08c9-badf-45e0-ac35-6b0fa2aeaac2	e01fb0a1-597a-4d82-be66-741d84549ddb	1a45e450-7ed6-4674-b5f4-85163ac13a05	0	7	0	0	0	9	2026-05-07 23:20:31.837+00	\N
60c67cdc-d76b-40c2-942c-29cac2663518	2211292b-f982-41e7-9a3b-25d7f7fa38a4	e01fb0a1-597a-4d82-be66-741d84549ddb	96cf5629-ad5f-4521-b296-3dba1b485ce5	0	7	0	0	0	9	2026-05-07 23:20:31.837+00	\N
ef57ac43-b219-40fd-9969-e81496d5eb6e	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	e01fb0a1-597a-4d82-be66-741d84549ddb	1b07b0ae-0b44-4ed4-b036-f0e84508417b	0	7	0	0	0	9	2026-05-07 23:20:31.837+00	\N
684155f5-f17b-441c-9c66-c040938f3b8c	9039d3cd-574a-4dbf-929e-6322f0269e64	e01fb0a1-597a-4d82-be66-741d84549ddb	96cf5629-ad5f-4521-b296-3dba1b485ce5	0	7	0	0	0	9	2026-05-07 23:20:31.837+00	\N
9bf8a412-de11-44bf-a84b-ca4678910633	30865542-67ff-4941-b393-944bc5ecfaae	e01fb0a1-597a-4d82-be66-741d84549ddb	59dd2cb5-2cde-4b7d-9f01-7424779abc9b	0	6	0	0	0	9	2026-05-07 23:20:31.837+00	\N
c66bd6b0-49fe-49b1-8ed6-29982a46072c	d37505cb-92b0-486d-b0fb-e539a486dcbf	e01fb0a1-597a-4d82-be66-741d84549ddb	96cf5629-ad5f-4521-b296-3dba1b485ce5	0	5	0	0	0	9	2026-05-07 23:20:31.836+00	\N
\.


--
-- Data for Name: player_season_stats_snapshot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.player_season_stats_snapshot (id, player_id, league_id, team_id, jornada, goals, assists, yellow_cards, red_cards, matches_played, imported_at, player_profile_id) FROM stdin;
dfd2b2b2-bf25-4592-ae86-64a43e2a84db	da78bf88-53be-405d-a8e2-cb794434b0ab	7039a7b9-c837-4b9d-af24-137423e2ee33	85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	11	31	0	0	0	0	2026-04-30 00:16:00.336+00	\N
a9383c8d-c156-4622-9323-8147b692cbc8	e8a6ce76-e624-4fca-9dee-0922921a2522	7039a7b9-c837-4b9d-af24-137423e2ee33	8b9d9cae-bd6b-4918-b759-c04c36c11140	11	19	0	0	0	0	2026-04-30 00:16:00.336+00	\N
c37b40bd-ced6-4f35-930e-1f6b544e569d	9039d3cd-574a-4dbf-929e-6322f0269e64	7039a7b9-c837-4b9d-af24-137423e2ee33	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	11	19	0	0	0	0	2026-04-30 00:16:00.336+00	\N
5f5d0951-5e88-4cef-a71a-62e3c15aa248	b151ae58-b5a7-49d9-8da3-8b9b04e6ebac	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	11	15	0	0	0	0	2026-04-30 00:16:00.336+00	\N
303be80f-c9a5-44a3-8b17-f0adc011e799	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	7039a7b9-c837-4b9d-af24-137423e2ee33	85964e4f-2396-46dd-abdb-346e42773de2	11	14	0	0	0	0	2026-04-30 00:16:00.336+00	\N
e3b0b1ce-b547-4c35-a65c-b2e5281b2f38	d37505cb-92b0-486d-b0fb-e539a486dcbf	7039a7b9-c837-4b9d-af24-137423e2ee33	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	11	10	0	0	0	0	2026-04-30 00:16:00.336+00	\N
406df849-2783-482c-99b7-1b295048a3cc	2211292b-f982-41e7-9a3b-25d7f7fa38a4	7039a7b9-c837-4b9d-af24-137423e2ee33	8b9d9cae-bd6b-4918-b759-c04c36c11140	11	8	0	0	0	0	2026-04-30 00:16:00.336+00	\N
001d84fc-cb7c-42a0-9a4a-54b12931e456	695fec9c-3c89-4607-a4fb-23304ca6b4bc	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	11	6	0	0	0	0	2026-04-30 00:16:00.336+00	\N
977f3846-47aa-48a1-bfe5-d0b73526a903	0d5fcf72-57b8-4a1f-a6e3-419146c4cc74	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	11	6	0	0	0	0	2026-04-30 00:16:00.336+00	\N
d40b1b50-9aa1-488d-9fa4-2b1be7782262	135badcc-4612-4e6f-b9b4-997403da4d38	2f421880-fb44-482f-8030-b4e11def2192	464fd943-29d5-45ef-b619-df7aebd9f467	11	12	0	0	0	0	2026-05-01 21:23:50.207+00	\N
b1dee67a-0e19-46c1-9c2c-e18d32dd6677	785c3aae-c663-4438-bd88-a4786b5b5d41	2f421880-fb44-482f-8030-b4e11def2192	ad1063ee-a66a-4d29-aee8-3683a1ac35be	11	12	0	0	0	0	2026-05-01 21:23:50.207+00	\N
e841a88e-ed40-42cc-b359-98d349494ee4	63082092-59b3-49aa-978d-901f9e995938	2f421880-fb44-482f-8030-b4e11def2192	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	11	10	0	0	0	0	2026-05-01 21:23:50.207+00	\N
1943595a-6f5d-4396-bf89-ccf8a2802d5e	da78bf88-53be-405d-a8e2-cb794434b0ab	2f421880-fb44-482f-8030-b4e11def2192	f18f3a38-fe26-4769-936b-4a1fcfe154e1	11	10	0	0	0	0	2026-05-01 21:23:50.207+00	\N
e2f242f4-af43-474f-90a6-a0ff6fc5e457	6c39cc0e-1e8b-48af-ba90-3e5c7ddfdb13	2f421880-fb44-482f-8030-b4e11def2192	0dc75848-f30b-4cba-ab93-f7c96baa4584	11	10	0	0	0	0	2026-05-01 21:23:50.207+00	\N
9c9c33dd-5b59-463b-b7db-38dcc77029b9	e12c2cac-b46d-403b-9b9b-50a52ea251e8	2f421880-fb44-482f-8030-b4e11def2192	f3cbe65f-6ceb-4361-af48-1fb676d8bc29	11	10	0	0	0	0	2026-05-01 21:23:50.207+00	\N
60b7928b-cd59-456d-88b3-c9ac0aba3350	74f618a5-1bba-4739-bdbf-55d3d6e16f74	2f421880-fb44-482f-8030-b4e11def2192	f3296459-1cf4-4603-ae1b-cb77385edb5e	11	9	0	0	0	0	2026-05-01 21:23:50.207+00	\N
0d54aec6-330e-489a-b65b-c1bb3a98e326	b2fc6f17-9c46-46b9-90e3-7d98a4c6dfe0	2f421880-fb44-482f-8030-b4e11def2192	030bd258-db73-4ce0-9c89-a84ddbc8286b	11	9	0	0	0	0	2026-05-01 21:23:50.207+00	\N
94dc18b7-ea4d-48ae-bd24-479c2fea311b	2668a1e0-8726-4348-b687-ebb7b87051a0	2f421880-fb44-482f-8030-b4e11def2192	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	11	9	0	0	0	0	2026-05-01 21:23:50.207+00	\N
9fe8ec63-7606-4406-a2f1-dbcb75ddc670	510e545f-4968-4505-a124-1f9a53c643cf	2f421880-fb44-482f-8030-b4e11def2192	464fd943-29d5-45ef-b619-df7aebd9f467	11	8	0	0	0	0	2026-05-01 21:23:50.207+00	\N
8b527aec-f323-4ded-a566-b1f961ca101b	fe467355-e5b4-46b0-bfa5-ed787045b151	2f421880-fb44-482f-8030-b4e11def2192	f3296459-1cf4-4603-ae1b-cb77385edb5e	11	8	0	0	0	0	2026-05-01 21:23:50.207+00	\N
241fb098-6a60-4f39-82b0-b32b1bfab3d9	00682521-fce6-4e95-a3dc-a5065a725ccd	2f421880-fb44-482f-8030-b4e11def2192	f3296459-1cf4-4603-ae1b-cb77385edb5e	11	8	0	0	0	0	2026-05-01 21:23:50.207+00	\N
49c12851-7896-4dc9-b304-768317444956	5ed9c1db-8b6b-44e3-bf7f-63276d0e5720	2f421880-fb44-482f-8030-b4e11def2192	ad1063ee-a66a-4d29-aee8-3683a1ac35be	11	6	0	0	0	0	2026-05-01 21:23:50.207+00	\N
6a7b4edc-7e4a-4537-8a90-6e9e4353b6e9	724e724a-8d56-4c88-ae1b-f92774d40d6a	2f421880-fb44-482f-8030-b4e11def2192	c98d0978-fd37-4284-90b6-1eefdf2f5eb0	11	6	0	0	0	0	2026-05-01 21:23:50.207+00	\N
0a92a377-5a8d-448c-b41d-1ae420fc0fae	884e632b-774b-4972-9266-1df14a761ad1	2f421880-fb44-482f-8030-b4e11def2192	f18f3a38-fe26-4769-936b-4a1fcfe154e1	11	6	0	0	0	0	2026-05-01 21:23:50.207+00	\N
fb351680-d9f0-47dc-91e0-d49163cc9aa1	86028288-18d7-42ad-ab31-1f2393766cfe	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	4218b25c-6978-4786-a417-134cf0b6c586	7	22	0	0	0	0	2026-05-07 22:45:14.995+00	\N
8b68a16c-b685-4b4a-9cdb-d6bdab9b6c6e	c0d75b0c-d4aa-4084-b171-3e9da8749af3	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	7	13	0	0	0	0	2026-05-07 22:45:14.995+00	\N
2e92a1e8-030c-4d37-bac6-fb0beac12b5b	943edf88-5501-42ad-a0a1-4ed411f9e39f	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	b405c94a-e43c-4c6c-9288-e4717e97582d	7	13	0	0	0	0	2026-05-07 22:45:14.995+00	\N
f869362d-786c-45f6-bfa8-4e2aa9d6082d	2e349b8b-f9cf-4d4b-8c10-7b54498265ac	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	7	12	0	0	0	0	2026-05-07 22:45:14.995+00	\N
ad9fc9c3-cc44-4671-841c-74b138e87c61	cfe7279e-8de0-489a-b061-233c030598ca	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	7	7	0	0	0	0	2026-05-07 22:45:14.995+00	\N
547c86ee-d44d-459e-8ca2-0e175c67a009	c75159c8-585a-466f-b9d8-9e1dda3b23b6	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	7	7	0	0	0	0	2026-05-07 22:45:14.995+00	\N
c5b8c7fc-af48-4d25-b0ad-b9364b76d259	5b049cac-6020-436f-a997-46eb840bafbf	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	74734271-881e-413d-b888-b00b3ad53813	7	6	0	0	0	0	2026-05-07 22:45:14.995+00	\N
506c6ffd-0a73-4611-b6d1-9b2dfea23457	1e70e106-6c18-463b-9df2-1d7acc75e761	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	b405c94a-e43c-4c6c-9288-e4717e97582d	7	6	0	0	0	0	2026-05-07 22:45:14.995+00	\N
18c67d1c-2920-4153-95bd-04cd2a6a532a	212b7602-73de-4b27-9c78-524f939eef2b	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	11528ddc-6887-4993-a74a-731bd31364b6	7	6	0	0	0	0	2026-05-07 22:45:14.995+00	\N
ff139c94-5e71-42e7-8c9e-98abcf59c4b2	708e0da0-0f6e-48ce-9188-c35d5518cf4e	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	11528ddc-6887-4993-a74a-731bd31364b6	7	5	0	0	0	0	2026-05-07 22:45:14.995+00	\N
68711c10-e3b2-476f-ae1b-b47653cbe797	da78bf88-53be-405d-a8e2-cb794434b0ab	7039a7b9-c837-4b9d-af24-137423e2ee33	85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	12	34	0	0	0	0	2026-05-07 23:08:42.084+00	\N
cad3a635-db53-4305-bc54-de7132b6d233	9039d3cd-574a-4dbf-929e-6322f0269e64	7039a7b9-c837-4b9d-af24-137423e2ee33	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	12	22	0	0	0	0	2026-05-07 23:08:42.084+00	\N
565db669-ca91-40da-9629-4bccd009fbb3	e8a6ce76-e624-4fca-9dee-0922921a2522	7039a7b9-c837-4b9d-af24-137423e2ee33	8b9d9cae-bd6b-4918-b759-c04c36c11140	12	20	0	0	0	0	2026-05-07 23:08:42.084+00	\N
d843c801-ea13-46a3-bd22-f1055815c5d0	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	7039a7b9-c837-4b9d-af24-137423e2ee33	85964e4f-2396-46dd-abdb-346e42773de2	12	17	0	0	0	0	2026-05-07 23:08:42.084+00	\N
f888e962-5138-4da0-a3d7-d9342f15d8f8	b151ae58-b5a7-49d9-8da3-8b9b04e6ebac	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	12	15	0	0	0	0	2026-05-07 23:08:42.084+00	\N
0abea3b1-4a36-4a62-bc62-704717ede74c	695fec9c-3c89-4607-a4fb-23304ca6b4bc	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	12	11	0	0	0	0	2026-05-07 23:08:42.084+00	\N
681a4437-d318-42ce-bdcc-082b08e1db63	d37505cb-92b0-486d-b0fb-e539a486dcbf	7039a7b9-c837-4b9d-af24-137423e2ee33	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	12	10	0	0	0	0	2026-05-07 23:08:42.084+00	\N
85ac97f5-b39d-4557-b8fc-d607fd158b3d	2211292b-f982-41e7-9a3b-25d7f7fa38a4	7039a7b9-c837-4b9d-af24-137423e2ee33	8b9d9cae-bd6b-4918-b759-c04c36c11140	12	9	0	0	0	0	2026-05-07 23:08:42.084+00	\N
f66e8978-c19d-415d-8e8c-844eb236be51	0d5fcf72-57b8-4a1f-a6e3-419146c4cc74	7039a7b9-c837-4b9d-af24-137423e2ee33	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	12	6	0	0	0	0	2026-05-07 23:08:42.084+00	\N
0e87f2af-119b-4013-b1b1-b7a8d0dd03ec	695fec9c-3c89-4607-a4fb-23304ca6b4bc	e01fb0a1-597a-4d82-be66-741d84549ddb	730f2df0-3ab1-4ff6-8912-f2dcb569ea25	9	15	0	0	0	0	2026-05-07 23:20:31.845+00	\N
7c441db8-8712-4ee9-b376-109999aa0b01	5d125ec7-7acd-4b6c-a0c1-5c98388001f1	e01fb0a1-597a-4d82-be66-741d84549ddb	1b07b0ae-0b44-4ed4-b036-f0e84508417b	9	14	0	0	0	0	2026-05-07 23:20:31.845+00	\N
bfd74387-addb-47f2-bc15-d2b1fc0b0029	8df513cc-cc8b-4e47-a037-beaf1db01003	e01fb0a1-597a-4d82-be66-741d84549ddb	c1ebdd55-7d59-4db0-87d4-ca49611f2f65	9	8	0	0	0	0	2026-05-07 23:20:31.845+00	\N
f3e18014-c59f-4dc1-873d-97d1afe6cec9	cdde08c9-badf-45e0-ac35-6b0fa2aeaac2	e01fb0a1-597a-4d82-be66-741d84549ddb	1a45e450-7ed6-4674-b5f4-85163ac13a05	9	7	0	0	0	0	2026-05-07 23:20:31.845+00	\N
0234a4a5-43c4-44df-aebc-9d89cd4b45fe	2211292b-f982-41e7-9a3b-25d7f7fa38a4	e01fb0a1-597a-4d82-be66-741d84549ddb	96cf5629-ad5f-4521-b296-3dba1b485ce5	9	7	0	0	0	0	2026-05-07 23:20:31.845+00	\N
c8821bd7-40b2-4090-8b94-154348f0bcb0	1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	e01fb0a1-597a-4d82-be66-741d84549ddb	1b07b0ae-0b44-4ed4-b036-f0e84508417b	9	7	0	0	0	0	2026-05-07 23:20:31.845+00	\N
3d8fe6c6-17f1-46d5-a9a8-8ed0c0a29b91	9039d3cd-574a-4dbf-929e-6322f0269e64	e01fb0a1-597a-4d82-be66-741d84549ddb	96cf5629-ad5f-4521-b296-3dba1b485ce5	9	7	0	0	0	0	2026-05-07 23:20:31.845+00	\N
12ab1265-f657-41ea-96e0-32a9f00d34d3	30865542-67ff-4941-b393-944bc5ecfaae	e01fb0a1-597a-4d82-be66-741d84549ddb	59dd2cb5-2cde-4b7d-9f01-7424779abc9b	9	6	0	0	0	0	2026-05-07 23:20:31.845+00	\N
d7001340-ba14-4f55-9fa3-7eb75b739dfd	d37505cb-92b0-486d-b0fb-e539a486dcbf	e01fb0a1-597a-4d82-be66-741d84549ddb	96cf5629-ad5f-4521-b296-3dba1b485ce5	9	5	0	0	0	0	2026-05-07 23:20:31.845+00	\N
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.players (id, full_name, alias, phone, photo_url, created_at) FROM stdin;
da78bf88-53be-405d-a8e2-cb794434b0ab	margarita gutierrez	\N	\N	\N	2026-04-30 00:16:00.308286+00
e8a6ce76-e624-4fca-9dee-0922921a2522	brenda zapata	\N	\N	\N	2026-04-30 00:16:00.308286+00
9039d3cd-574a-4dbf-929e-6322f0269e64	dayana orozco	\N	\N	\N	2026-04-30 00:16:00.308286+00
b151ae58-b5a7-49d9-8da3-8b9b04e6ebac	daniela perame	\N	\N	\N	2026-04-30 00:16:00.308286+00
1ab8c78e-0f78-47e6-a6bd-d2b268e822bc	yamilet arredondo	\N	\N	\N	2026-04-30 00:16:00.308286+00
d37505cb-92b0-486d-b0fb-e539a486dcbf	jade melendrez	\N	\N	\N	2026-04-30 00:16:00.308286+00
2211292b-f982-41e7-9a3b-25d7f7fa38a4	prisila garcia	\N	\N	\N	2026-04-30 00:16:00.308286+00
0d5fcf72-57b8-4a1f-a6e3-419146c4cc74	adriana fernadez	\N	\N	\N	2026-04-30 00:16:00.308286+00
5d125ec7-7acd-4b6c-a0c1-5c98388001f1	tania gonzalez	\N	\N	\N	2026-04-30 19:24:29.629205+00
8df513cc-cc8b-4e47-a037-beaf1db01003	karely rodriguez	\N	\N	\N	2026-04-30 19:24:29.629205+00
cdde08c9-badf-45e0-ac35-6b0fa2aeaac2	monserrat diaz	\N	\N	\N	2026-04-30 19:24:29.629205+00
30865542-67ff-4941-b393-944bc5ecfaae	laura lopez	\N	\N	\N	2026-04-30 19:24:29.629205+00
695fec9c-3c89-4607-a4fb-23304ca6b4bc	alicia villa	\N	\N	\N	2026-04-30 00:16:00.308286+00
135badcc-4612-4e6f-b9b4-997403da4d38	lucia reyes	\N	\N	\N	2026-05-01 21:23:50.186435+00
785c3aae-c663-4438-bd88-a4786b5b5d41	brenda marquez	\N	\N	\N	2026-05-01 21:23:50.186435+00
63082092-59b3-49aa-978d-901f9e995938	ximena zapata	\N	\N	\N	2026-05-01 21:23:50.186435+00
6c39cc0e-1e8b-48af-ba90-3e5c7ddfdb13	carlos gomez	\N	\N	\N	2026-05-01 21:23:50.186435+00
e12c2cac-b46d-403b-9b9b-50a52ea251e8	lucia hernandez	\N	\N	\N	2026-05-01 21:23:50.186435+00
74f618a5-1bba-4739-bdbf-55d3d6e16f74	carlos gutierrez	\N	\N	\N	2026-05-01 21:23:50.186435+00
b2fc6f17-9c46-46b9-90e3-7d98a4c6dfe0	lucia marquez	\N	\N	\N	2026-05-01 21:23:50.186435+00
2668a1e0-8726-4348-b687-ebb7b87051a0	javier marquez	\N	\N	\N	2026-05-01 21:23:50.186435+00
510e545f-4968-4505-a124-1f9a53c643cf	brenda orozco	\N	\N	\N	2026-05-01 21:23:50.186435+00
fe467355-e5b4-46b0-bfa5-ed787045b151	lucia orozco	\N	\N	\N	2026-05-01 21:23:50.186435+00
00682521-fce6-4e95-a3dc-a5065a725ccd	javier orozco	\N	\N	\N	2026-05-01 21:23:50.186435+00
5ed9c1db-8b6b-44e3-bf7f-63276d0e5720	margarita reyes	\N	\N	\N	2026-05-01 21:23:50.186435+00
724e724a-8d56-4c88-ae1b-f92774d40d6a	elena gutierrez	\N	\N	\N	2026-05-01 21:23:50.186435+00
884e632b-774b-4972-9266-1df14a761ad1	paola zapata	\N	\N	\N	2026-05-01 21:23:50.186435+00
86028288-18d7-42ad-ab31-1f2393766cfe	owen padilla	\N	\N	\N	2026-05-07 22:45:14.964848+00
c0d75b0c-d4aa-4084-b171-3e9da8749af3	david burgos	\N	\N	\N	2026-05-07 22:45:14.964848+00
943edf88-5501-42ad-a0a1-4ed411f9e39f	angel recendis	\N	\N	\N	2026-05-07 22:45:14.964848+00
2e349b8b-f9cf-4d4b-8c10-7b54498265ac	kevin godoy	\N	\N	\N	2026-05-07 22:45:14.964848+00
cfe7279e-8de0-489a-b061-233c030598ca	dylan valsas	\N	\N	\N	2026-05-07 22:45:14.964848+00
c75159c8-585a-466f-b9d8-9e1dda3b23b6	kevin alvarez	\N	\N	\N	2026-05-07 22:45:14.964848+00
5b049cac-6020-436f-a997-46eb840bafbf	dilan alvarez	\N	\N	\N	2026-05-07 22:45:14.964848+00
1e70e106-6c18-463b-9df2-1d7acc75e761	misael anguiano	\N	\N	\N	2026-05-07 22:45:14.964848+00
212b7602-73de-4b27-9c78-524f939eef2b	cristian perez	\N	\N	\N	2026-05-07 22:45:14.964848+00
708e0da0-0f6e-48ce-9188-c35d5518cf4e	jose sanchez	\N	\N	\N	2026-05-07 22:45:14.964848+00
\.


--
-- Data for Name: team_standings_snapshot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team_standings_snapshot (id, team_id, league_id, jornada, played, wins, draws, losses, goals_for, goals_against, points, zone, updated_at) FROM stdin;
9fd1ce9b-f27f-4770-9a5b-904498f2e134	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	7039a7b9-c837-4b9d-af24-137423e2ee33	11	11	8	1	2	41	12	25	\N	2026-04-30 00:15:38.093+00
335e335c-6c95-4fe8-af71-a4d97633b5a1	85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	7039a7b9-c837-4b9d-af24-137423e2ee33	11	11	7	3	2	46	23	24	\N	2026-04-30 00:15:38.093+00
86cc2e1a-0712-4cd2-8846-c5f97864cfab	85964e4f-2396-46dd-abdb-346e42773de2	7039a7b9-c837-4b9d-af24-137423e2ee33	11	11	7	2	3	50	26	23	\N	2026-04-30 00:15:38.093+00
ccc76285-3f90-484f-a870-3c6f106b6950	8b9d9cae-bd6b-4918-b759-c04c36c11140	7039a7b9-c837-4b9d-af24-137423e2ee33	11	11	4	5	4	41	27	17	\N	2026-04-30 00:15:38.093+00
897a7272-c7e0-4fcb-ac4a-a7dc3dfac928	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	7039a7b9-c837-4b9d-af24-137423e2ee33	11	11	3	6	4	33	22	15	\N	2026-04-30 00:15:38.093+00
b11498a0-3fa1-4441-b324-9c608a47222a	2a1df188-dc45-4abb-9433-ffc896cb812d	7039a7b9-c837-4b9d-af24-137423e2ee33	11	10	2	1	7	18	48	7	\N	2026-04-30 00:15:38.093+00
9460a06e-5f51-4dd0-a478-34a52abd0517	a5145eb8-eb56-450c-aeb0-da3f5f79a49e	7039a7b9-c837-4b9d-af24-137423e2ee33	11	10	2	0	8	11	50	6	\N	2026-04-30 00:15:38.093+00
596f031b-57c0-453e-9fff-c3e9ba459af5	9e9b9455-6d1a-4128-adc8-f55ad44043be	7039a7b9-c837-4b9d-af24-137423e2ee33	11	11	2	0	9	9	37	6	\N	2026-04-30 00:15:38.093+00
cf62f128-0e4d-4bb8-83dc-89ac49352d87	4e89ded8-4fe0-442b-afb1-1f63aaee3881	960ea712-fda0-4902-b02f-6897890b34f6	11	11	8	1	2	41	12	25	\N	2026-05-01 20:45:10.744+00
d38dc77e-aefe-4735-80f7-49cbcd90961f	0555e6cf-baf6-49ec-a4eb-ab1b891fa681	960ea712-fda0-4902-b02f-6897890b34f6	11	11	7	3	2	46	23	24	\N	2026-05-01 20:45:10.744+00
3844eda2-a803-45c8-9641-e7eb22701837	0ae1f841-8fb5-4405-8caa-4807f2e1a3fc	960ea712-fda0-4902-b02f-6897890b34f6	11	11	7	2	3	50	26	23	\N	2026-05-01 20:45:10.744+00
b3df7008-ffec-4458-bd4e-93d9ed51b612	f0fe7e57-3d5a-48f9-a4d1-5688292a6561	960ea712-fda0-4902-b02f-6897890b34f6	11	11	4	5	4	41	27	17	\N	2026-05-01 20:45:10.744+00
db798eb5-60d7-4b58-abff-b9e6d198e7d3	4c66f352-9e7a-4f33-be35-a24e9712a8e0	960ea712-fda0-4902-b02f-6897890b34f6	11	11	3	6	4	33	22	15	\N	2026-05-01 20:45:10.744+00
c82e2626-2179-4bb5-9cf2-469b8db090b8	93c1a9f3-c0d2-4224-82c7-1bdc614ed7ae	960ea712-fda0-4902-b02f-6897890b34f6	11	10	2	1	7	18	48	7	\N	2026-05-01 20:45:10.744+00
0af6af5f-a664-460f-b1a8-74edd329d166	d66c2bf6-a069-4a2e-a2c7-d18333537cec	960ea712-fda0-4902-b02f-6897890b34f6	11	10	2	0	8	11	50	6	\N	2026-05-01 20:45:10.744+00
3a13d2f4-8750-4b14-a45d-463f0129f495	e3a49768-37f6-480e-917d-b7d2eef1c5be	960ea712-fda0-4902-b02f-6897890b34f6	11	11	2	0	9	9	37	6	\N	2026-05-01 20:45:10.744+00
d9bfd175-a1f4-4fe8-95aa-6307ce02ff33	ad1063ee-a66a-4d29-aee8-3683a1ac35be	2f421880-fb44-482f-8030-b4e11def2192	11	11	8	1	2	34	43	25	\N	2026-05-01 21:23:32.465+00
040bc894-d1c6-42a1-980f-de7940509062	2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	2f421880-fb44-482f-8030-b4e11def2192	11	11	6	4	1	40	28	22	\N	2026-05-01 21:23:32.465+00
7ea784af-a1a9-4b80-86b8-97fe774a6327	464fd943-29d5-45ef-b619-df7aebd9f467	2f421880-fb44-482f-8030-b4e11def2192	11	11	5	6	0	50	43	21	\N	2026-05-01 21:23:32.465+00
ca83c766-c213-4ea5-961c-618fdfe9958e	0dc75848-f30b-4cba-ab93-f7c96baa4584	2f421880-fb44-482f-8030-b4e11def2192	11	11	2	6	3	39	32	12	\N	2026-05-01 21:23:32.465+00
9b34f67a-d261-4ef6-bad4-506cd6797f62	f3296459-1cf4-4603-ae1b-cb77385edb5e	2f421880-fb44-482f-8030-b4e11def2192	11	11	3	3	5	31	25	12	\N	2026-05-01 21:23:32.465+00
9551aa98-8713-4b7f-8135-49ba33c80f14	f3cbe65f-6ceb-4361-af48-1fb676d8bc29	2f421880-fb44-482f-8030-b4e11def2192	11	11	2	3	6	15	10	9	\N	2026-05-01 21:23:32.465+00
2eee5caf-ebed-4296-9a39-54fc281d3535	9bce759f-705a-45fb-a97f-d782232f77e3	2f421880-fb44-482f-8030-b4e11def2192	11	11	1	5	5	43	37	8	\N	2026-05-01 21:23:32.465+00
deea7ab9-7921-4fdf-97d7-99842c2b58f5	f18f3a38-fe26-4769-936b-4a1fcfe154e1	2f421880-fb44-482f-8030-b4e11def2192	11	11	2	1	8	17	29	7	\N	2026-05-01 21:23:32.465+00
d105175a-b1a8-45fd-89d9-4ea53564d87e	c98d0978-fd37-4284-90b6-1eefdf2f5eb0	2f421880-fb44-482f-8030-b4e11def2192	11	11	0	0	11	49	21	0	\N	2026-05-01 21:23:32.465+00
726d3bbc-4a77-41cf-aca2-88652ee110df	030bd258-db73-4ce0-9c89-a84ddbc8286b	2f421880-fb44-482f-8030-b4e11def2192	11	11	0	0	11	17	45	0	\N	2026-05-01 21:23:32.465+00
70e41588-d869-4bfd-8015-9a3192c6cf33	74734271-881e-413d-b888-b00b3ad53813	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	7	6	5	0	1	38	10	15	\N	2026-05-07 22:44:56.921+00
1c0993e4-ba43-4f9d-8877-971f7cf9e515	4218b25c-6978-4786-a417-134cf0b6c586	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	7	7	4	2	2	47	36	14	\N	2026-05-07 22:44:56.921+00
a44ae8e4-bb18-44c5-a5a7-182dd87efc85	b405c94a-e43c-4c6c-9288-e4717e97582d	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	7	6	3	1	2	39	31	10	\N	2026-05-07 22:44:56.921+00
aca5603e-3a2e-463c-acf5-d0a185246388	11528ddc-6887-4993-a74a-731bd31364b6	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	7	5	0	0	5	13	33	0	\N	2026-05-07 22:44:56.921+00
b2e3515b-7f6e-4e3c-a64e-ed78874811d1	aad528c3-866a-4680-956e-43e4c374dedd	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	7	6	1	0	5	6	36	3	\N	2026-05-07 22:44:56.921+00
54c77955-b165-4f5c-96d4-98d80c5b3818	975b1a4d-ffd6-4d36-8539-c9a35b8fb350	7039a7b9-c837-4b9d-af24-137423e2ee33	12	12	9	1	2	44	12	28	\N	2026-05-07 23:06:55.634+00
3fa937a9-def3-49b0-bd76-2a3acb249fa6	85964e4f-2396-46dd-abdb-346e42773de2	7039a7b9-c837-4b9d-af24-137423e2ee33	12	12	8	2	3	58	29	26	\N	2026-05-07 23:06:55.634+00
7aa21a12-c2c6-45fd-9420-863ba4c48300	85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	7039a7b9-c837-4b9d-af24-137423e2ee33	12	12	7	4	2	49	26	25	\N	2026-05-07 23:06:55.634+00
d8ff4b79-4743-4f4c-933f-ad7ef1973fbf	8b9d9cae-bd6b-4918-b759-c04c36c11140	7039a7b9-c837-4b9d-af24-137423e2ee33	12	12	4	7	4	44	30	19	\N	2026-05-07 23:06:55.634+00
13d1cc84-3d7c-4831-9378-b8fe623a6571	da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	7039a7b9-c837-4b9d-af24-137423e2ee33	12	12	4	6	4	38	25	18	\N	2026-05-07 23:06:55.634+00
7f296766-5b43-4fdd-b016-fa1049192cc0	2a1df188-dc45-4abb-9433-ffc896cb812d	7039a7b9-c837-4b9d-af24-137423e2ee33	12	11	2	1	8	21	56	7	\N	2026-05-07 23:06:55.634+00
dce61ce1-6fa2-458f-8a1a-30ad20d4a349	9e9b9455-6d1a-4128-adc8-f55ad44043be	7039a7b9-c837-4b9d-af24-137423e2ee33	12	12	2	0	10	12	42	6	\N	2026-05-07 23:06:55.634+00
1452ec7b-58db-4c39-9183-6475251fd636	a5145eb8-eb56-450c-aeb0-da3f5f79a49e	7039a7b9-c837-4b9d-af24-137423e2ee33	12	11	2	0	9	11	53	6	\N	2026-05-07 23:06:55.634+00
7fe54cac-5601-46cd-ab82-55b6afdf943a	730f2df0-3ab1-4ff6-8912-f2dcb569ea25	e01fb0a1-597a-4d82-be66-741d84549ddb	9	8	5	3	1	31	19	18	\N	2026-05-07 23:19:33.399+00
0f1f5402-4342-4488-ad0c-70bb502fd8f7	96cf5629-ad5f-4521-b296-3dba1b485ce5	e01fb0a1-597a-4d82-be66-741d84549ddb	9	8	5	2	1	33	16	17	\N	2026-05-07 23:19:33.399+00
ca431b7f-ea3b-4999-a340-7cbcaafdca09	59dd2cb5-2cde-4b7d-9f01-7424779abc9b	e01fb0a1-597a-4d82-be66-741d84549ddb	9	8	5	2	2	26	21	17	\N	2026-05-07 23:19:33.399+00
6fd3bbd5-e610-4366-9a4c-d86d71db7629	1b07b0ae-0b44-4ed4-b036-f0e84508417b	e01fb0a1-597a-4d82-be66-741d84549ddb	9	8	4	2	3	30	21	14	\N	2026-05-07 23:19:33.399+00
23431aaf-8afa-4cdf-a185-5299b887a8be	1a45e450-7ed6-4674-b5f4-85163ac13a05	e01fb0a1-597a-4d82-be66-741d84549ddb	9	7	2	0	5	17	30	6	\N	2026-05-07 23:19:33.399+00
520e396a-9e0e-47bc-a328-3ca8162270da	87a0e00a-d59a-4489-8dab-809825aa93f8	e01fb0a1-597a-4d82-be66-741d84549ddb	9	8	2	0	6	18	28	6	\N	2026-05-07 23:19:33.399+00
eda7e3a5-57e3-4f20-84df-b54f3ac61cac	3d66f10e-d43c-47bf-8333-6ddb30693f28	e01fb0a1-597a-4d82-be66-741d84549ddb	9	7	1	0	6	10	30	3	\N	2026-05-07 23:19:33.399+00
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, league_id, color, created_at) FROM stdin;
975b1a4d-ffd6-4d36-8539-c9a35b8fb350	dep framar	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
85dbb0aa-97b8-4f94-8cc1-5d94f8b82bc6	dep leonas	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
85964e4f-2396-46dd-abdb-346e42773de2	chicas fut +	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
8b9d9cae-bd6b-4918-b759-c04c36c11140	las chivas	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
da1b9ec1-b0e6-498d-b7d6-3c7468738d1e	dep marquez	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
2a1df188-dc45-4abb-9433-ffc896cb812d	pinkins t3	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
a5145eb8-eb56-450c-aeb0-da3f5f79a49e	las leonas	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
9e9b9455-6d1a-4128-adc8-f55ad44043be	las plebes	7039a7b9-c837-4b9d-af24-137423e2ee33	\N	2026-04-30 00:15:38.077057+00
730f2df0-3ab1-4ff6-8912-f2dcb569ea25	dep marquez	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
96cf5629-ad5f-4521-b296-3dba1b485ce5	dep framar	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
59dd2cb5-2cde-4b7d-9f01-7424779abc9b	chivas	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
1b07b0ae-0b44-4ed4-b036-f0e84508417b	dynamo	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
87a0e00a-d59a-4489-8dab-809825aa93f8	galacticas	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
1a45e450-7ed6-4674-b5f4-85163ac13a05	pumas	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
3d66f10e-d43c-47bf-8333-6ddb30693f28	bebesitas	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:23:56.037484+00
c1ebdd55-7d59-4db0-87d4-ca49611f2f65	calvas	e01fb0a1-597a-4d82-be66-741d84549ddb	\N	2026-04-30 19:24:29.629205+00
4e89ded8-4fe0-442b-afb1-1f63aaee3881	dep framar	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
0555e6cf-baf6-49ec-a4eb-ab1b891fa681	dep leonas	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
0ae1f841-8fb5-4405-8caa-4807f2e1a3fc	chicas fut +	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
f0fe7e57-3d5a-48f9-a4d1-5688292a6561	las chivas	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
4c66f352-9e7a-4f33-be35-a24e9712a8e0	dep marquez	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
93c1a9f3-c0d2-4224-82c7-1bdc614ed7ae	pinkins t3	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
d66c2bf6-a069-4a2e-a2c7-d18333537cec	las leonas	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
e3a49768-37f6-480e-917d-b7d2eef1c5be	las plebes	960ea712-fda0-4902-b02f-6897890b34f6	\N	2026-05-01 00:59:02.275968+00
ad1063ee-a66a-4d29-aee8-3683a1ac35be	niupi fc	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
2ad9dc9c-3f5a-4fc4-8273-ca72dde61389	deportivo unión	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
464fd943-29d5-45ef-b619-df7aebd9f467	rebeldes	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
0dc75848-f30b-4cba-ab93-f7c96baa4584	titanes fc	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
f3296459-1cf4-4603-ae1b-cb77385edb5e	dep. framar	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
f3cbe65f-6ceb-4361-af48-1fb676d8bc29	dragones de la valle	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
9bce759f-705a-45fb-a97f-d782232f77e3	real sociedad	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
f18f3a38-fe26-4769-936b-4a1fcfe154e1	galácticos	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
c98d0978-fd37-4284-90b6-1eefdf2f5eb0	atlético san pancho	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
030bd258-db73-4ce0-9c89-a84ddbc8286b	chivas terrazas	2f421880-fb44-482f-8030-b4e11def2192	\N	2026-05-01 21:23:32.443549+00
74734271-881e-413d-b888-b00b3ad53813	juniors tj	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:44:56.902983+00
4218b25c-6978-4786-a417-134cf0b6c586	chivas	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:44:56.902983+00
b405c94a-e43c-4c6c-9288-e4717e97582d	panthers	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:44:56.902983+00
11528ddc-6887-4993-a74a-731bd31364b6	legacy fc	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:44:56.902983+00
aad528c3-866a-4680-956e-43e4c374dedd	super star	3995e19a-61c7-402f-b4d1-e79d20e9ea3f	\N	2026-05-07 22:44:56.902983+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, role, active, created_at, organization_id, email_verified, email_verification_token, email_verification_expires_at) FROM stdin;
196e6a0e-5d32-4a9b-94e4-896ffdb7b3e8	talachastats@gmail.com	7c6b6d5df776eec50ef75a50525c9fb8:327aefbf9345f08154cb4e0a35914a40d5be153d1c2a89958310809d2ac6101bda1d28cef5ae41ac80b789e1ffc16d7de207b387cd924d64baecdd9b1a67eb39	Talacha Admin	owner	t	2026-04-30 00:06:56.698175+00	\N	t	\N	\N
9585d00f-d719-4242-abce-d25f7f1379fd	donchepe@gmail.com	ca06c11b23301f6778690da8d21c2310:6aa1e90591c86204aafbac59eadcbfc110bf5e7d04370e55417c62dbf97dd9b5d450ad1be56af92c98dc00d819048a883cef95bc1e413fe4479f7a6871fa8f84	Don Chepe	organizer	t	2026-04-30 00:13:59.694097+00	2c416a3a-db98-42fc-827b-e9c0c26b7a59	t	\N	\N
9cb4f024-c062-4a41-936b-a81c4ac49322	vazquez_alex@outlook.com	fe48b7ca72285bae5d9130677ebc7b53:48ced82e37aabb6852f4b65f11f03ff360fc161e7bb44fdb26b01579b2db9134d0cc22ce3a21af315bc45e0dbabae7585f5bd76f5044edf99ae81262137e8d0a	Adalberto Vazquez	organizer	t	2026-05-01 21:13:50.562188+00	80bd1d29-e236-412f-9dd4-1919fc101a5e	t	\N	\N
50ae3686-7546-446a-a94a-58fd8000cb06	angelquintana022@gmail.com	402357fd21d405b8ca090f0ccf2ab391:d6a10c925faa8439e3c18174e371ce35828c05f7844b93b3477dfdae448b529f0e6c6b8b9ecef0db123dd9a914d0868f434a25c4ad762351adf005b8dd82489d	Angel Quintana 	organizer	t	2026-05-09 06:36:07.03525+00	c985320f-5636-4c76-8cce-933da695c41f	t	\N	\N
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-27 17:54:18
20211116045059	2026-04-27 17:54:18
20211116050929	2026-04-27 17:54:18
20211116051442	2026-04-27 17:54:18
20211116212300	2026-04-27 17:54:18
20211116213355	2026-04-27 17:54:18
20211116213934	2026-04-27 17:54:18
20211116214523	2026-04-27 17:54:18
20211122062447	2026-04-27 17:54:18
20211124070109	2026-04-27 17:54:18
20211202204204	2026-04-27 17:54:18
20211202204605	2026-04-27 17:54:18
20211210212804	2026-04-27 17:54:18
20211228014915	2026-04-27 17:54:18
20220107221237	2026-04-27 17:54:18
20220228202821	2026-04-27 17:54:19
20220312004840	2026-04-27 17:54:19
20220603231003	2026-04-27 17:54:19
20220603232444	2026-04-27 17:54:19
20220615214548	2026-04-27 17:54:19
20220712093339	2026-04-27 17:54:19
20220908172859	2026-04-27 17:54:19
20220916233421	2026-04-27 17:54:19
20230119133233	2026-04-27 17:54:19
20230128025114	2026-04-27 17:54:19
20230128025212	2026-04-27 17:54:19
20230227211149	2026-04-27 17:54:19
20230228184745	2026-04-27 17:54:19
20230308225145	2026-04-27 17:54:19
20230328144023	2026-04-27 17:54:19
20231018144023	2026-04-27 17:54:19
20231204144023	2026-04-27 17:54:19
20231204144024	2026-04-27 17:54:19
20231204144025	2026-04-27 17:54:19
20240108234812	2026-04-27 17:54:19
20240109165339	2026-04-27 17:54:19
20240227174441	2026-04-27 17:54:19
20240311171622	2026-04-27 17:54:19
20240321100241	2026-04-27 17:54:19
20240401105812	2026-04-27 17:54:19
20240418121054	2026-04-27 17:54:19
20240523004032	2026-04-27 17:54:19
20240618124746	2026-04-27 17:54:19
20240801235015	2026-04-27 17:54:19
20240805133720	2026-04-27 17:54:19
20240827160934	2026-04-27 17:54:19
20240919163303	2026-04-27 17:54:19
20240919163305	2026-04-27 17:54:19
20241019105805	2026-04-27 17:54:19
20241030150047	2026-04-27 17:54:19
20241108114728	2026-04-27 17:54:19
20241121104152	2026-04-27 17:54:19
20241130184212	2026-04-27 17:54:19
20241220035512	2026-04-27 17:54:19
20241220123912	2026-04-27 17:54:19
20241224161212	2026-04-27 17:54:19
20250107150512	2026-04-27 17:54:19
20250110162412	2026-04-27 17:54:19
20250123174212	2026-04-27 17:54:19
20250128220012	2026-04-27 17:54:19
20250506224012	2026-04-27 17:54:19
20250523164012	2026-04-27 17:54:19
20250714121412	2026-04-27 17:54:19
20250905041441	2026-04-27 17:54:19
20251103001201	2026-04-27 17:54:19
20251120212548	2026-04-27 17:54:19
20251120215549	2026-04-27 17:54:19
20260218120000	2026-04-27 17:54:19
20260326120000	2026-04-27 17:54:19
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-27 17:54:48.939115
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-27 17:54:48.955241
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-27 17:54:48.961382
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-27 17:54:48.977517
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-27 17:54:48.990905
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-27 17:54:48.998433
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-27 17:54:49.006172
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-27 17:54:49.012871
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-27 17:54:49.018948
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-27 17:54:49.024627
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-27 17:54:49.030765
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-27 17:54:49.037033
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-27 17:54:49.043609
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-27 17:54:49.049875
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-27 17:54:49.055642
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-27 17:54:49.079083
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-27 17:54:49.08539
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-27 17:54:49.091234
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-27 17:54:49.097585
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-27 17:54:49.105558
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-27 17:54:49.11181
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-27 17:54:49.11965
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-27 17:54:49.133072
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-27 17:54:49.14478
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-27 17:54:49.150626
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-27 17:54:49.15654
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-27 17:54:49.162429
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-27 17:54:49.168919
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-27 17:54:49.174314
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-27 17:54:49.179609
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-27 17:54:49.184874
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-27 17:54:49.190334
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-27 17:54:49.195749
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-27 17:54:49.200846
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-27 17:54:49.205845
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-27 17:54:49.210742
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-27 17:54:49.215897
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-27 17:54:49.221305
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-27 17:54:49.227501
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-27 17:54:49.238459
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-27 17:54:49.2436
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-27 17:54:49.249023
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-27 17:54:49.254087
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-27 17:54:49.259456
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-27 17:54:49.264761
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-27 17:54:49.270783
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-27 17:54:49.282008
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-27 17:54:49.287567
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-27 17:54:49.292902
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-27 17:54:49.335878
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-27 17:54:49.341913
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-27 17:54:50.03366
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-27 17:54:50.036136
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-27 17:54:50.047566
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-27 17:54:50.051235
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-27 17:54:50.053458
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-27 17:54:50.067405
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-27 17:54:50.073606
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-27 17:54:50.059757
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-04-30 05:02:06.32987
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-04-30 05:02:06.346259
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: import_audit_log import_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_audit_log
    ADD CONSTRAINT import_audit_log_pkey PRIMARY KEY (id);


--
-- Name: import_templates import_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_templates
    ADD CONSTRAINT import_templates_pkey PRIMARY KEY (id);


--
-- Name: leagues leagues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_pkey PRIMARY KEY (id);


--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: player_profiles player_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT player_profiles_pkey PRIMARY KEY (id);


--
-- Name: player_registrations player_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_registrations
    ADD CONSTRAINT player_registrations_pkey PRIMARY KEY (id);


--
-- Name: player_season_stats player_season_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_pkey PRIMARY KEY (id);


--
-- Name: player_season_stats_snapshot player_season_stats_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT player_season_stats_snapshot_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: team_standings_snapshot team_standings_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_standings_snapshot
    ADD CONSTRAINT team_standings_snapshot_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: player_season_stats_snapshot unique_player_league_jornada_snap; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT unique_player_league_jornada_snap UNIQUE (player_id, league_id, jornada);


--
-- Name: player_season_stats_snapshot unique_profile_league_jornada_snap; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT unique_profile_league_jornada_snap UNIQUE (player_profile_id, league_id, jornada);


--
-- Name: player_registrations unique_profile_per_league; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_registrations
    ADD CONSTRAINT unique_profile_per_league UNIQUE (player_profile_id, league_id);


--
-- Name: player_season_stats unique_profile_season; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT unique_profile_season UNIQUE (player_profile_id, league_id);


--
-- Name: team_standings_snapshot unique_team_jornada; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_standings_snapshot
    ADD CONSTRAINT unique_team_jornada UNIQUE (team_id, league_id, jornada);


--
-- Name: player_profiles uq_player_profile_org_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT uq_player_profile_org_name UNIQUE (organization_id, normalized_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_verification_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_verification_token_unique UNIQUE (email_verification_token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: events_legacy_player_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_legacy_player_idx ON public.match_events USING btree (legacy_player_id);


--
-- Name: events_match_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_match_idx ON public.match_events USING btree (match_id);


--
-- Name: events_profile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_profile_idx ON public.match_events USING btree (player_profile_id);


--
-- Name: events_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_type_idx ON public.match_events USING btree (event_type);


--
-- Name: ial_imported_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ial_imported_at_idx ON public.import_audit_log USING btree (imported_at);


--
-- Name: ial_jornada_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ial_jornada_idx ON public.import_audit_log USING btree (league_id, jornada);


--
-- Name: ial_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ial_league_idx ON public.import_audit_log USING btree (league_id);


--
-- Name: idx_player_profiles_claimed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_player_profiles_claimed ON public.player_profiles USING btree (claimed_player_id);


--
-- Name: idx_player_profiles_normalized; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_player_profiles_normalized ON public.player_profiles USING btree (normalized_name);


--
-- Name: idx_player_profiles_org; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_player_profiles_org ON public.player_profiles USING btree (organization_id);


--
-- Name: leagues_name_trgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leagues_name_trgm_idx ON public.leagues USING gin (public.f_unaccent(name) public.gin_trgm_ops);


--
-- Name: leagues_org_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX leagues_org_slug_idx ON public.leagues USING btree (organization_id, slug) WHERE (organization_id IS NOT NULL);


--
-- Name: leagues_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX leagues_slug_idx ON public.leagues USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: matches_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matches_date_idx ON public.matches USING btree (match_date);


--
-- Name: matches_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matches_league_idx ON public.matches USING btree (league_id);


--
-- Name: matches_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matches_status_idx ON public.matches USING btree (status);


--
-- Name: organizations_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organizations_slug_idx ON public.organizations USING btree (slug);


--
-- Name: players_alias_trgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX players_alias_trgm_idx ON public.players USING gin (public.f_unaccent(alias) public.gin_trgm_ops);


--
-- Name: players_fullname_trgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX players_fullname_trgm_idx ON public.players USING gin (public.f_unaccent(full_name) public.gin_trgm_ops);


--
-- Name: pss_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pss_league_idx ON public.player_season_stats USING btree (league_id);


--
-- Name: pss_legacy_player_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pss_legacy_player_idx ON public.player_season_stats USING btree (legacy_player_id);


--
-- Name: pss_profile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pss_profile_idx ON public.player_season_stats USING btree (player_profile_id);


--
-- Name: psss_jornada_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX psss_jornada_idx ON public.player_season_stats_snapshot USING btree (jornada);


--
-- Name: psss_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX psss_league_idx ON public.player_season_stats_snapshot USING btree (league_id);


--
-- Name: psss_player_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX psss_player_idx ON public.player_season_stats_snapshot USING btree (player_id);


--
-- Name: psss_profile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX psss_profile_idx ON public.player_season_stats_snapshot USING btree (player_profile_id);


--
-- Name: pv_page_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_page_idx ON public.page_views USING btree (page);


--
-- Name: pv_visited_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_visited_at_idx ON public.page_views USING btree (visited_at);


--
-- Name: pv_visitor_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pv_visitor_idx ON public.page_views USING btree (visitor_id);


--
-- Name: registrations_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registrations_league_idx ON public.player_registrations USING btree (league_id);


--
-- Name: registrations_legacy_player_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registrations_legacy_player_idx ON public.player_registrations USING btree (legacy_player_id);


--
-- Name: registrations_profile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registrations_profile_idx ON public.player_registrations USING btree (player_profile_id);


--
-- Name: registrations_team_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX registrations_team_idx ON public.player_registrations USING btree (team_id);


--
-- Name: teams_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX teams_league_idx ON public.teams USING btree (league_id);


--
-- Name: teams_name_trgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX teams_name_trgm_idx ON public.teams USING gin (public.f_unaccent(name) public.gin_trgm_ops);


--
-- Name: tss_jornada_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tss_jornada_idx ON public.team_standings_snapshot USING btree (jornada);


--
-- Name: tss_league_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tss_league_idx ON public.team_standings_snapshot USING btree (league_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_organization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_organization_idx ON public.users USING btree (organization_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: import_audit_log import_audit_log_imported_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_audit_log
    ADD CONSTRAINT import_audit_log_imported_by_users_id_fk FOREIGN KEY (imported_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: import_audit_log import_audit_log_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_audit_log
    ADD CONSTRAINT import_audit_log_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: leagues leagues_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leagues
    ADD CONSTRAINT leagues_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: match_events match_events_legacy_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_legacy_player_id_players_id_fk FOREIGN KEY (legacy_player_id) REFERENCES public.players(id) ON DELETE SET NULL;


--
-- Name: match_events match_events_match_id_matches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_matches_id_fk FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_player_profile_id_player_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_player_profile_id_player_profiles_id_fk FOREIGN KEY (player_profile_id) REFERENCES public.player_profiles(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: matches matches_away_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_away_team_id_teams_id_fk FOREIGN KEY (away_team_id) REFERENCES public.teams(id);


--
-- Name: matches matches_home_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_home_team_id_teams_id_fk FOREIGN KEY (home_team_id) REFERENCES public.teams(id);


--
-- Name: matches matches_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: player_profiles player_profiles_claimed_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT player_profiles_claimed_player_id_players_id_fk FOREIGN KEY (claimed_player_id) REFERENCES public.players(id) ON DELETE SET NULL;


--
-- Name: player_profiles player_profiles_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT player_profiles_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: player_registrations player_registrations_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_registrations
    ADD CONSTRAINT player_registrations_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: player_registrations player_registrations_legacy_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_registrations
    ADD CONSTRAINT player_registrations_legacy_player_id_players_id_fk FOREIGN KEY (legacy_player_id) REFERENCES public.players(id) ON DELETE SET NULL;


--
-- Name: player_registrations player_registrations_player_profile_id_player_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_registrations
    ADD CONSTRAINT player_registrations_player_profile_id_player_profiles_id_fk FOREIGN KEY (player_profile_id) REFERENCES public.player_profiles(id) ON DELETE CASCADE;


--
-- Name: player_registrations player_registrations_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_registrations
    ADD CONSTRAINT player_registrations_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: player_season_stats player_season_stats_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: player_season_stats player_season_stats_legacy_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_legacy_player_id_players_id_fk FOREIGN KEY (legacy_player_id) REFERENCES public.players(id) ON DELETE SET NULL;


--
-- Name: player_season_stats player_season_stats_player_profile_id_player_profiles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_player_profile_id_player_profiles_id_fk FOREIGN KEY (player_profile_id) REFERENCES public.player_profiles(id) ON DELETE CASCADE;


--
-- Name: player_season_stats_snapshot player_season_stats_snapshot_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT player_season_stats_snapshot_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: player_season_stats_snapshot player_season_stats_snapshot_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT player_season_stats_snapshot_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE SET NULL;


--
-- Name: player_season_stats_snapshot player_season_stats_snapshot_player_profile_id_player_profiles_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT player_season_stats_snapshot_player_profile_id_player_profiles_ FOREIGN KEY (player_profile_id) REFERENCES public.player_profiles(id) ON DELETE SET NULL;


--
-- Name: player_season_stats_snapshot player_season_stats_snapshot_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats_snapshot
    ADD CONSTRAINT player_season_stats_snapshot_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: player_season_stats player_season_stats_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: team_standings_snapshot team_standings_snapshot_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_standings_snapshot
    ADD CONSTRAINT team_standings_snapshot_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: team_standings_snapshot team_standings_snapshot_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_standings_snapshot
    ADD CONSTRAINT team_standings_snapshot_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: teams teams_league_id_leagues_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_league_id_leagues_id_fk FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_organizations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: import_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: leagues; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: player_registrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.player_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: player_season_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.player_season_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: player_season_stats_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.player_season_stats_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: players; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

--
-- Name: team_standings_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.team_standings_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO service_role;


--
-- Name: FUNCTION gtrgm_out(public.gtrgm); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION f_unaccent(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.f_unaccent(text) TO anon;
GRANT ALL ON FUNCTION public.f_unaccent(text) TO authenticated;
GRANT ALL ON FUNCTION public.f_unaccent(text) TO service_role;


--
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO service_role;


--
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_same(public.gtrgm, public.gtrgm, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO service_role;


--
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO anon;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO service_role;


--
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.set_limit(real) TO postgres;
GRANT ALL ON FUNCTION public.set_limit(real) TO anon;
GRANT ALL ON FUNCTION public.set_limit(real) TO authenticated;
GRANT ALL ON FUNCTION public.set_limit(real) TO service_role;


--
-- Name: FUNCTION show_limit(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_limit() TO postgres;
GRANT ALL ON FUNCTION public.show_limit() TO anon;
GRANT ALL ON FUNCTION public.show_limit() TO authenticated;
GRANT ALL ON FUNCTION public.show_limit() TO service_role;


--
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.show_trgm(text) TO postgres;
GRANT ALL ON FUNCTION public.show_trgm(text) TO anon;
GRANT ALL ON FUNCTION public.show_trgm(text) TO authenticated;
GRANT ALL ON FUNCTION public.show_trgm(text) TO service_role;


--
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity(text, text) TO service_role;


--
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO service_role;


--
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION unaccent(text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent(text) TO postgres;
GRANT ALL ON FUNCTION public.unaccent(text) TO anon;
GRANT ALL ON FUNCTION public.unaccent(text) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent(text) TO service_role;


--
-- Name: FUNCTION unaccent(regdictionary, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO postgres;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO anon;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO service_role;


--
-- Name: FUNCTION unaccent_init(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent_init(internal) TO postgres;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO anon;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent_init(internal) TO service_role;


--
-- Name: FUNCTION unaccent_lexize(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO postgres;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO anon;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO authenticated;
GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO service_role;


--
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO service_role;


--
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO postgres;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO anon;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO authenticated;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE import_audit_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.import_audit_log TO anon;
GRANT ALL ON TABLE public.import_audit_log TO authenticated;
GRANT ALL ON TABLE public.import_audit_log TO service_role;


--
-- Name: TABLE import_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.import_templates TO anon;
GRANT ALL ON TABLE public.import_templates TO authenticated;
GRANT ALL ON TABLE public.import_templates TO service_role;


--
-- Name: TABLE leagues; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.leagues TO anon;
GRANT ALL ON TABLE public.leagues TO authenticated;
GRANT ALL ON TABLE public.leagues TO service_role;


--
-- Name: TABLE match_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.match_events TO anon;
GRANT ALL ON TABLE public.match_events TO authenticated;
GRANT ALL ON TABLE public.match_events TO service_role;


--
-- Name: TABLE matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.matches TO anon;
GRANT ALL ON TABLE public.matches TO authenticated;
GRANT ALL ON TABLE public.matches TO service_role;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organizations TO anon;
GRANT ALL ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;


--
-- Name: TABLE page_views; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.page_views TO anon;
GRANT ALL ON TABLE public.page_views TO authenticated;
GRANT ALL ON TABLE public.page_views TO service_role;


--
-- Name: TABLE player_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.player_profiles TO anon;
GRANT ALL ON TABLE public.player_profiles TO authenticated;
GRANT ALL ON TABLE public.player_profiles TO service_role;


--
-- Name: TABLE player_registrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.player_registrations TO anon;
GRANT ALL ON TABLE public.player_registrations TO authenticated;
GRANT ALL ON TABLE public.player_registrations TO service_role;


--
-- Name: TABLE player_season_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.player_season_stats TO anon;
GRANT ALL ON TABLE public.player_season_stats TO authenticated;
GRANT ALL ON TABLE public.player_season_stats TO service_role;


--
-- Name: TABLE players; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.players TO anon;
GRANT ALL ON TABLE public.players TO authenticated;
GRANT ALL ON TABLE public.players TO service_role;


--
-- Name: TABLE player_global_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.player_global_stats TO anon;
GRANT ALL ON TABLE public.player_global_stats TO authenticated;
GRANT ALL ON TABLE public.player_global_stats TO service_role;


--
-- Name: TABLE player_season_stats_snapshot; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.player_season_stats_snapshot TO anon;
GRANT ALL ON TABLE public.player_season_stats_snapshot TO authenticated;
GRANT ALL ON TABLE public.player_season_stats_snapshot TO service_role;


--
-- Name: TABLE team_standings_snapshot; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.team_standings_snapshot TO anon;
GRANT ALL ON TABLE public.team_standings_snapshot TO authenticated;
GRANT ALL ON TABLE public.team_standings_snapshot TO service_role;


--
-- Name: TABLE teams; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.teams TO anon;
GRANT ALL ON TABLE public.teams TO authenticated;
GRANT ALL ON TABLE public.teams TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict cVrpH78AXkb30me0isVpIoWv3300uXjk3PFxdb4rIyiHZXVvhzN9sykWLrVdCpC

