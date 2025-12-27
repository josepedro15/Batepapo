import Link from "next/link"

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center flex-col gap-6">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 to-violet-600 opacity-75 blur-2xl"></div>
        <h1 className="relative text-5xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          CRM WhatsApp
        </h1>
      </div>
      <p className="text-slate-400 text-lg">Plataforma Multi-tenant de Alta Performance</p>

      <Link
        href="/dashboard"
        className="mt-4 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-xl shadow-violet-500/20 transition-all hover:scale-105 active:scale-95"
      >
        Acessar Sistema
      </Link>
    </div>
  )
}
