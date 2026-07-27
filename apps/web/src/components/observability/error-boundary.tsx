"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/observability/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("error-boundary", "Unhandled React rendering error", {
      error: { name: error.name, message: error.message },
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      componentStack: process.env.NODE_ENV === "development" ? errorInfo.componentStack : undefined,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", color: "#1a1a1a" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#666", maxWidth: "400px", marginBottom: "1.5rem" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "#f5f5f5",
                borderRadius: "8px",
                fontSize: "0.75rem",
                textAlign: "left",
                maxWidth: "100%",
                overflow: "auto",
                color: "#c00",
              }}
            >
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
