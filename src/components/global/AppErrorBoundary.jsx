import { Component } from 'react';

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An unexpected application error occurred.';
};

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: getErrorMessage(error),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep detailed crash details in developer console for debugging.
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="error-boundary-shell" role="alert" aria-live="assertive">
        <section className="error-boundary-card">
          <p className="error-boundary-kicker">Something went wrong</p>
          <h1>We hit an unexpected error.</h1>
          <p>
            The app can usually recover after a refresh. If this keeps happening, please contact the
            admin team.
          </p>
          <pre className="error-boundary-message">{this.state.errorMessage}</pre>
          <div className="error-boundary-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Reload page
            </button>
            <button type="button" className="btn btn-soft" onClick={this.handleGoHome}>
              Go to home
            </button>
          </div>
        </section>
      </main>
    );
  }
}
