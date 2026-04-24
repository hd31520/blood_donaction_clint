import { Component } from 'react';

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'অ্যাপে অপ্রত্যাশিত সমস্যা হয়েছে।';
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
          <p className="error-boundary-kicker">কিছু সমস্যা হয়েছে</p>
          <h1>অ্যাপে অপ্রত্যাশিত সমস্যা হয়েছে।</h1>
          <p>
            পেজ রিফ্রেশ করলে সাধারণত ঠিক হয়ে যায়। বারবার হলে অ্যাডমিন টিমকে জানান।
          </p>
          <pre className="error-boundary-message">{this.state.errorMessage}</pre>
          <div className="error-boundary-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              পেজ রিলোড
            </button>
            <button type="button" className="btn btn-soft" onClick={this.handleGoHome}>
              হোমে যান
            </button>
          </div>
        </section>
      </main>
    );
  }
}
