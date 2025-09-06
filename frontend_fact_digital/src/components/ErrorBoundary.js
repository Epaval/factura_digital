import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center" style={{ minHeight: "200px" }}>
          <h2 className="text-danger">⚠️ ¡Algo salió mal!</h2>
          <p>Lo sentimos, ocurrió un error inesperado.</p>

          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </button>

          {/* Solo en desarrollo y si hay errorInfo */}
          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="mt-3 text-start">
              <summary className="text-danger">Detalles del error</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {/* ✅ Validamos que errorInfo no sea null */}
                <strong>Component Stack:</strong>
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;