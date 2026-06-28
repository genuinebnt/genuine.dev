-- Newsletter subscribers (double opt-in).
create table subscribers (
    id           uuid primary key,
    email        text not null unique,
    status       text not null default 'pending', -- pending | confirmed | unsubscribed
    token        text not null,
    created_at   timestamptz not null default now(),
    confirmed_at timestamptz
);
