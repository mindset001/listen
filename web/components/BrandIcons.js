/**
 * Placeholder App Store / Google Play marks — custom-drawn, matching the
 * prototype. Swap for Apple's and Google's official badge artwork before
 * shipping; their guidelines require it.
 */

export function AppleMark({ size = 24, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.7 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.7 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-3.8Z" />
      <path d="M14.2 5.6c.7-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.9-1 2.9 1 .1 2.1-.5 2.8-1.3Z" />
    </svg>
  );
}

export function PlayStoreMark({ size = 24, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 3.5v17a1 1 0 0 0 1.5.9l13-8.5a1 1 0 0 0 0-1.7l-13-8.5A1 1 0 0 0 4 3.5Z" />
    </svg>
  );
}
