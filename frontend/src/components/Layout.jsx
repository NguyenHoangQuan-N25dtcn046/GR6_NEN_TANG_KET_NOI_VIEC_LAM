import Navbar from './Navbar.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400">
          JobLink — Nền tảng kết nối việc làm · © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
