export function ProgressBar() {
  return (
    <div className="relative h-1 rounded-full bg-transparent">
      <div className="absolute bottom-0 top-0 w-2/4 animate-progress rounded-full bg-indigo-600" />
    </div>
  );
}
