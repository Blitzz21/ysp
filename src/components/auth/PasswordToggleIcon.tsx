type PasswordToggleIconProps = {
  visible: boolean;
};

export function PasswordToggleIcon({ visible }: PasswordToggleIconProps) {
  if (visible) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M3 3 21 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.58 10.58a2 2 0 0 0 2.84 2.84"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.88 4.24A10.8 10.8 0 0 1 12 4c5.2 0 8.98 3.2 10 8-0.42 1.98-1.47 3.63-3 4.86M6.62 6.63C4.5 8 3.27 9.76 2 12c1.02 4.8 4.8 8 10 8 1.3 0 2.52-0.2 3.63-0.58"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path
        d="M2 12c1.02-4.8 4.8-8 10-8s8.98 3.2 10 8c-1.02 4.8-4.8 8-10 8S3.02 16.8 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
