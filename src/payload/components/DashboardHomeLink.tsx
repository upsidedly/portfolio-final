import Link from "next/link";

export default function DashboardHomeLink() {
  return (
    <div className="dashboard-home-link">
      <p>Content and project controls.</p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/tools/projects">Project controls</Link>
        <Link href="/">View portfolio</Link>
      </div>
    </div>
  );
}
