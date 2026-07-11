import Link from "next/link";

export function AdminTools() {
  return (
    <aside aria-label="Admin tools" className="admin-tools">
      <span>CMS</span>
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/collections/projects/create">New project</Link>
      <Link href="/admin/collections/posts/create">New musing</Link>
    </aside>
  );
}
