import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { STORAGE_KEY } from "../../config/rules";
import { S } from "../../config/strings";

/**
 * Last line of defence. If anything in the UI throws while rendering, show a friendly card
 * instead of a blank screen. "Start over" clears the saved game, because a corrupt saved
 * game is the most likely reason something would keep crashing on reload.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Kallan um Police crashed:", error, info.componentStack);
  }

  private startOver = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
    location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex h-full items-center justify-center bg-[#1c1108] px-4 text-center">
        <section className="paper w-full max-w-sm rounded-lg p-6">
          <h1 className="font-display text-2xl font-bold">{S.error.title}</h1>
          <p className="mt-2 font-hand text-lg">{S.error.body}</p>
          <button
            type="button"
            onClick={this.startOver}
            className="mt-4 min-h-12 w-full rounded-xl bg-ink px-5 py-2 font-display text-lg font-bold text-paper active:scale-95"
          >
            {S.error.reset}
          </button>
        </section>
      </main>
    );
  }
}
