export type DocMetadata = Record<string, unknown>;

export type AdminItem = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  published_at?: string | null;
  metadata?: DocMetadata;
};

export type EditDoc = {
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  status: string;
  body_markdown: string;
  cover_image: string | null;
  metadata: DocMetadata;
};

export type SaveReq = {
  slug: string;
  kind: string;
  title: string;
  summary: string;
  status: string;
  body: string;
  cover_image: string | null;
  metadata: DocMetadata;
};

export type AdminNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  document_slug: string | null;
  read_at: string | null;
  created_at: string;
};

export type AdminNotificationList = {
  items: AdminNotification[];
  unread: number;
};
