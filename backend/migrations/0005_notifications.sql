-- Admin notifications (scheduled publish, future alert types).

create table notifications (
    id            uuid primary key,
    kind          text not null,
    title         text not null,
    body          text not null,
    href          text,
    document_slug text,
    read_at       timestamptz,
    created_at    timestamptz not null default now()
);

create index notifications_unread_idx on notifications (read_at, created_at desc);
