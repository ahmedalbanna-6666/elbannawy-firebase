export default function RootLoading(): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        <p className="text-sm text-neutral-500">جاري التحميل...</p>
      </div>
    </div>
  );
}
