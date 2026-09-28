import React, { StrictMode, Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RootErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('mg_supplytech_active_doc_id');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#002E26',
          color: '#FFFFFF',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            backgroundColor: '#014136',
            borderRadius: '16px',
            border: '1px solid #DFBC64',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#DFBC64', marginBottom: '8px', letterSpacing: '0.05em' }}>
              MG SUPPLYTECH COMMERCIAL SUITE
            </h1>
            <p style={{ fontSize: '14px', color: '#E3ECE8', marginBottom: '20px', lineHeight: '1.5' }}>
              An unexpected display issue occurred while loading this view.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11px',
                overflowX: 'auto',
                color: '#FFB8B8',
                marginBottom: '20px',
                fontFamily: 'monospace'
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#DFBC64',
                  color: '#003A30',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reload App
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#DFBC64',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #DFBC64',
                  cursor: 'pointer'
                }}
              >
                Reset Draft &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
