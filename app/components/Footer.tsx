import { CenteredView } from './CenteredView';

export function Footer() {
  return (
    <div className="flex flex-col items-stretch border-t border-stone-50 bg-white">
      <CenteredView className="p-4">
        <div className="flex flex-col items-center justify-center gap-1 lg:flex-row lg:gap-4">
          <a
            className="text-sm font-light text-stone-600/80 transition-all duration-300 hover:underline"
            href="https://allansimoyi.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Developed By Allan Simoyi
          </a>
        </div>
      </CenteredView>
    </div>
  );
}
