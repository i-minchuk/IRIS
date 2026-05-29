export function Pagination({ page, pages, onPageChange }: { page: number; pages: number; onPageChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex gap-2 justify-center mt-4">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
      <span>{page} / {pages}</span>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}>→</button>
    </div>
  );
}
