import { Outlet } from 'react-router';

export default function LoginLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-accent w-full border-b border-[#e5e5ea] dark:border-[#343436]">
        <div className="px-4 py-1">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <img
                src="/logo.svg"
                alt="Logo"
                className="dark:invert"
                style={{ width: '82px', height: '31px', marginTop: '-1px' }}
              />
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
