import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered as an overlay when the current children throw. `reset` retries. */
  renderError: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  /** The last children that rendered without throwing. */
  lastGood: ReactNode;
}

/**
 * Non-destructive error boundary for the ECharts render tree.
 *
 * When a bad option makes ECharts throw during render, React would otherwise
 * unwind the whole app. Instead this boundary keeps showing the last chart that
 * rendered successfully and overlays an error message; when a new (valid) option
 * arrives it retries automatically.
 */
export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, lastGood: props.children };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.children === this.props.children) return;
    if (this.state.hasError) {
      // New children arrived after a failure — retry rendering them.
      this.setState({ hasError: false, error: null });
    } else {
      // Committed successfully with new children: remember them as last-good.
      this.setState({ lastGood: this.props.children });
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <>
          {this.state.lastGood}
          {this.props.renderError(this.state.error, this.reset)}
        </>
      );
    }
    return this.props.children;
  }
}

export default ChartErrorBoundary;
