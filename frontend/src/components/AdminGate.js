import React, { useState } from 'react';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';

export default function AdminGate({ children }) {
  const [input, setInput] = useState('');
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true'
  );
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1800);
    }
  };

  if (authenticated) return children;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xs animate-fadeInUp">
        <div className="bg-white border border-zinc-100 rounded-2xl p-8 shadow-sm">
          <div className="w-8 h-px bg-zinc-900 mb-6" />
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">لوحة التحكم</h2>
          <p className="text-xs text-zinc-400 mb-6">أدخل كلمة المرور للمتابعة</p>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="كلمة المرور"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all mb-3 ${
              error
                ? 'border-zinc-400 bg-zinc-50 text-zinc-800'
                : 'border-zinc-200 bg-zinc-50 text-zinc-800 focus:border-zinc-400 focus:bg-white'
            }`}
          />
          {error && (
            <p className="text-xs text-zinc-400 mb-3 text-center">كلمة المرور غير صحيحة</p>
          )}
          <button
            onClick={handleSubmit}
            className="w-full bg-zinc-900 text-white text-sm font-medium rounded-xl py-3 transition-all hover:bg-zinc-700 active:scale-95"
          >
            دخول
          </button>
        </div>
      </div>
    </div>
  );
}
