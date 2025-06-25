create table public.agent_templates (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  icon text null,
  description text null,
  prompts text[] null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint agent_templates_pkey primary key (id)
) TABLESPACE pg_default;

create table public.agent_tools (
  id uuid not null default gen_random_uuid (),
  agent_id uuid null,
  tool_id uuid null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
  constraint agent_tools_pkey primary key (id),
  constraint agent_tools_agent_id_fkey foreign KEY (agent_id) references agents (id),
  constraint agent_tools_tool_id_fkey foreign KEY (tool_id) references tools (id)
) TABLESPACE pg_default;

create table public.agents (
  id uuid not null default gen_random_uuid (),
  name text not null,
  icon text null,
  description text null,
  prompts text null,
  agent_template_id uuid null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone null,
  constraint agents_pkey primary key (id),
  constraint agents_agent_template_id_fkey foreign KEY (agent_template_id) references agent_templates (id)
) TABLESPACE pg_default;

create table public.chats (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text null,
  user_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  agent_id uuid null,
  constraint chats_pkey primary key (id),
  constraint chats_agent_id_fkey foreign KEY (agent_id) references agents (id),
  constraint chats_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chats_user_id on public.chats using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_chats_created_at on public.chats using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_chats_updated_at on public.chats using btree (updated_at) TABLESPACE pg_default;

create trigger handle_chats_updated_at BEFORE
update on chats for EACH row
execute FUNCTION handle_updated_at ();

create table public.documents (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  content text null,
  user_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint documents_pkey primary key (id),
  constraint documents_id_created_at_key unique (id, created_at),
  constraint documents_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_documents_user_id on public.documents using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_documents_created_at on public.documents using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_documents_title_gin on public.documents using gin (title gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_documents_content_gin on public.documents using gin (content gin_trgm_ops) TABLESPACE pg_default;

create table public.file_uploads (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  chat_id uuid not null,
  bucket_id text not null default 'chat_attachments'::text,
  storage_path text not null,
  filename text not null,
  original_name text not null,
  content_type text not null,
  size integer not null,
  url text not null,
  version integer not null default 1,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint file_uploads_pkey primary key (id),
  constraint file_uploads_unique_per_chat unique (user_id, chat_id, filename, version),
  constraint file_uploads_unique_version unique (bucket_id, storage_path, version),
  constraint file_uploads_chat_id_fkey foreign KEY (chat_id) references chats (id) on delete CASCADE,
  constraint file_uploads_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists file_uploads_user_id_idx on public.file_uploads using btree (user_id) TABLESPACE pg_default;

create index IF not exists file_uploads_chat_id_idx on public.file_uploads using btree (chat_id) TABLESPACE pg_default;

create index IF not exists file_uploads_created_at_idx on public.file_uploads using btree (created_at) TABLESPACE pg_default;

create index IF not exists file_uploads_bucket_path_idx on public.file_uploads using btree (bucket_id, storage_path) TABLESPACE pg_default;

create trigger tr_file_version BEFORE INSERT on file_uploads for EACH row
execute FUNCTION set_file_version ();

create table public.messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  chat_id uuid not null,
  role text not null,
  content jsonb not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint messages_pkey primary key (id),
  constraint messages_chat_id_fkey foreign KEY (chat_id) references chats (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_messages_chat_id on public.messages using btree (chat_id) TABLESPACE pg_default;

create index IF not exists idx_messages_created_at on public.messages using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_messages_role on public.messages using btree (role) TABLESPACE pg_default;

create table public.suggestions (
  id uuid not null default extensions.uuid_generate_v4 (),
  document_id uuid not null,
  document_created_at timestamp with time zone not null,
  original_text text not null,
  suggested_text text not null,
  description text null,
  is_resolved boolean not null default false,
  user_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint suggestions_pkey primary key (id),
  constraint suggestions_document_id_document_created_at_fkey foreign KEY (document_id, document_created_at) references documents (id, created_at) on delete CASCADE,
  constraint suggestions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_suggestions_document_id on public.suggestions using btree (document_id) TABLESPACE pg_default;

create index IF not exists idx_suggestions_user_id on public.suggestions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_suggestions_is_resolved on public.suggestions using btree (is_resolved) TABLESPACE pg_default;

create index IF not exists idx_suggestions_created_at on public.suggestions using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_suggestions_unresolved on public.suggestions using btree (created_at) TABLESPACE pg_default
where
  (not is_resolved);

create table public.tool_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint tool_types_pkey primary key (id)
) TABLESPACE pg_default;

create table public.tool_types (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint tool_types_pkey primary key (id)
) TABLESPACE pg_default;

create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(64) not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_created_at on public.users using btree (created_at) TABLESPACE pg_default;

create trigger handle_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION handle_updated_at ();

create table public.votes (
  chat_id uuid not null,
  message_id uuid not null,
  is_upvoted boolean not null,
  constraint votes_pkey primary key (chat_id, message_id),
  constraint votes_chat_id_fkey foreign KEY (chat_id) references chats (id) on delete CASCADE,
  constraint votes_message_id_fkey foreign KEY (message_id) references messages (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_votes_message_id on public.votes using btree (message_id) TABLESPACE pg_default;

create index IF not exists idx_votes_chat_id on public.votes using btree (chat_id) TABLESPACE pg_default;

create index IF not exists idx_votes_composite on public.votes using btree (message_id, chat_id) TABLESPACE pg_default;

create trigger handle_votes_updated_at BEFORE
update on votes for EACH row
execute FUNCTION handle_updated_at ();