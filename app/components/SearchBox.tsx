import { twMerge } from 'tailwind-merge';

export function SearchBox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={twMerge(
        'm-[2px] flex grow flex-row items-center rounded-md focus-within:ring-2 focus-within:ring-stone-50',
        'bg-stone-200 transition-all duration-200 hover:bg-stone-200 focus:bg-stone-100',
      )}
    >
      <div className="pointer-events-none flex items-center pl-2">
        <svg
          aria-hidden="true"
          className="h-5 w-5 text-stone-500 dark:text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
      <input
        type="text"
        className={`text-md max-w-96 grow rounded-none bg-transparent px-2 py-2 font-thin focus:outline-none`}
        {...props}
      />
    </div>
  );
}
