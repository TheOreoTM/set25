import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <main className="page-wrap page-wrap--placeholder">
      <EmptyState
        title="This page"
        description="The destination does not exist in the SET25 HQ foundation."
      />
    </main>
  );
}
