"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDelete, adminList, type AdminItem } from "../../lib/auth";

export default function Admin() {
  const [rows, setRows] = useState<AdminItem[] | null>(null);
  const [authed, setAuthed] = useState(true);

  function load() {
    adminList()
      .then(setRows)
      .catch(() => setAuthed(false));
  }
  useEffect(load, []);

  async function del(slug: string) {
    try {
      await adminDelete(slug);
      load();
    } catch {
      setAuthed(false);
    }
  }

  if (!authed) {
    return (
      <p className="muted">
        Please <Link href="/admin/login">log in</Link>.
      </p>
    );
  }

  return (
    <>
      <div className="admin-head">
        <h1>Content</h1>
        <Link className="btn" href="/admin/new">
          + New
        </Link>
      </div>
      {rows === null ? (
        <p className="muted">Loading…</p>
      ) : (
        <table className="admin-table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td>
                  <Link href={`/admin/edit/${r.slug}`}>{r.title}</Link>
                </td>
                <td className="muted">{r.kind}</td>
                <td className="muted">{r.status}</td>
                <td>
                  <button className="link-danger" onClick={() => del(r.slug)}>
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
