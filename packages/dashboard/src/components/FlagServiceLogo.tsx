interface FlagServiceLogoProps {
  collapsed?: boolean;
}

export default function FlagServiceLogo({ collapsed }: FlagServiceLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="4" width="24" height="24" rx="6" className="fill-indigo-600" />
        <path
          d="M11 9v14M11 9h8.5c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H11"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!collapsed && (
        <span className="text-lg font-bold text-white whitespace-nowrap">FlagService</span>
      )}
    </div>
  );
}
