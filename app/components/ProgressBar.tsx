export function ProgressBar() {
  return (
    <div className="relative h-0.5 rounded-full bg-transparent">
      <div className="absolute bottom-0 top-0 w-2/4 animate-progress rounded-full bg-stone-800" />
    </div>
  );
}
