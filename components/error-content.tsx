"use client";

interface ErrorContentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Inline SVG alert icon (matches AlertCircleIcon from Hugeicons)
function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="40"
      height="40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function ErrorContent({ error, reset }: ErrorContentProps) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "60vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          height: "5rem",
          width: "5rem",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
        }}
      >
        <AlertIcon />
      </div>

      <h1
        style={{
          marginBottom: "0.5rem",
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        Something went wrong
      </h1>

      <p
        style={{
          marginBottom: "1.5rem",
          maxWidth: "28rem",
          color: "#737373",
        }}
      >
        An unexpected error occurred. Please try again, or contact support if
        the problem persists.
      </p>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#171717",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            color: "#171717",
            border: "1px solid #e5e5e5",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          Go home
        </button>
      </div>

      {error.digest && (
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.75rem",
            color: "#a3a3a3",
          }}
        >
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
