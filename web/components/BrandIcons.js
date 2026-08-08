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

/** Google's "G" mark uses fixed brand colors — their guidelines don't allow recoloring it. */
export function GoogleMark({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.5Z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46Z"
      />
      <path
        fill="#FBBC05"
        d="M11.8 28.3c-.4-1.3-.7-2.8-.7-4.3s.2-3 .7-4.3v-5.7H4.5C3 16.9 2 20.3 2 24s1 7.1 2.5 10l7.3-5.7Z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9Z"
      />
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
