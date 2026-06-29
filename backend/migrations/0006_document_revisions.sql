-- Document revision history (Phase 5). Each admin save snapshots the document so
-- versions can be browsed, diffed, and restored from the editor. Linked by the
-- stable `documents.id` (upsert is ON CONFLICT (slug) and never changes the id).

create table document_revisions (
    id            uuid primary key,
    document_id   uuid not null references documents (id) on delete cascade,
    title         text not null,
    summary       text,
    body_markdown text not null,
    cover_image   text,
    status        text not null,
    metadata      jsonb not null default '{}'::jsonb,
    created_at    timestamptz not null default now()
);

create index document_revisions_doc_idx on document_revisions (document_id, created_at desc);
