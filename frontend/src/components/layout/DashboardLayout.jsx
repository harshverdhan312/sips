import React from 'react';

const DashboardLayout = ({ navItems, activeView, onNavChange, rightSidebar, children, title, subtitle }) => {
  return (
    <div className="h-screen flex bg-[#0a0a0a] text-white overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-[#0e0e0e] border-r border-white/5">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <div className="text-sm font-bold font-['Manrope',sans-serif] tracking-tight">SIPS</div>
              <div className="text-[10px] text-white/30">{subtitle || 'Dashboard'}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                activeView === item.id
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <span className="w-5 h-5 shrink-0">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Center Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {title && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold font-['Manrope',sans-serif] tracking-tight">{title}</h1>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Right Sidebar */}
      {rightSidebar && (
        <aside className="w-72 shrink-0 bg-[#0e0e0e] border-l border-white/5 overflow-y-auto">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
};

export default DashboardLayout;
