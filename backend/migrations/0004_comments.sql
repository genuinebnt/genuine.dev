-- Comments on posts (Phase 4). Intentionally simple — no threading yet.
-- Each comment is tied to a document; name is display-only (no auth required to comment).

create table comments (
    id          uuid primary key,
    document_id uuid not null references documents (id) on delete cascade,
    name        text not null,
    body        text not null,
    created_at  timestamptz not null default now()
);

create index comments_document_id_idx on comments (document_id, created_at desc);
