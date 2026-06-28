-- Core content schema: documents (posts/projects/pages), tags, and the join.

create table tags (
    id     uuid primary key,
    slug   text not null unique,
    name   text not null,
    accent text
);

create table documents (
    id            uuid primary key,
    slug          text not null unique,
    kind          text not null,                 -- 'post' | 'project' | 'page'
    title         text not null,
    summary       text,
    body_markdown text not null,
    body_html     text not null,                 -- rendered on save
    reading_min   int  not null default 1,
    status        text not null default 'draft', -- 'draft' | 'published'
    cover_image   text,
    metadata      jsonb not null default '{}',
    published_at  timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    search_tsv    tsvector generated always as (
        to_tsvector('english', title || ' ' || coalesce(summary, ''))
    ) stored
);

create index documents_kind_status_idx on documents (kind, status, published_at desc);
create index documents_search_idx on documents using gin (search_tsv);

create table document_tags (
    document_id uuid not null references documents (id) on delete cascade,
    tag_id      uuid not null references tags (id) on delete cascade,
    primary key (document_id, tag_id)
);
