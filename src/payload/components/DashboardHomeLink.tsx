import Link from "next/link";

export default function DashboardHomeLink() {
  return (
    <div className="dashboard-home-link">
      <p>Return to the public portfolio and blog.</p>
      <Link href="/">View portfolio</Link>
    </div>
  );
}
