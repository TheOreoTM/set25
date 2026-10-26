import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <main className="page-wrap page-wrap--placeholder">
      <EmptyState
        kicker="Not found"
        title="This page does not exist."
        description="Check the address, or return to the dashboard to keep working."
      />
    </main>
  );
}
