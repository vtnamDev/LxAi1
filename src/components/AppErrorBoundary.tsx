import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'LX AI gặp lỗi giao diện không xác định.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LXAI_UI_ERROR]', error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#070913] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">LX AI Recovery</div>
          <h1 className="mt-3 text-xl font-semibold">Giao diện gặp lỗi thay vì hiển thị màn hình trống.</h1>
          <p className="mt-2 text-sm text-white/60 break-words">{this.state.message}</p>
          <button
            type="button"
            onClick={this.reload}
            className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Tải lại ứng dụng
          </button>
        </div>
      </div>
    );
  }
}
