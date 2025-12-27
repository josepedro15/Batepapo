import { createOrganization } from './actions'

export default function OnboardingPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-950">
            <div className="w-full max-w-lg p-8 glass rounded-2xl border border-white/10 text-center">
                <div className="mb-8">
                    <div className="h-16 w-16 bg-gradient-to-tr from-cyan-400 to-violet-500 rounded-2xl mx-auto mb-6 shadow-xl shadow-violet-500/20"></div>
                    <h1 className="text-3xl font-bold text-white mb-2">Vamos configurar sua empresa</h1>
                    <p className="text-slate-400">Dê um nome para sua organização para começar.</p>
                </div>

                <form action={createOrganization} className="space-y-6 text-left">
                    <div>
                        <label className="text-sm font-medium text-slate-300">Nome da Empresa</label>
                        <input
                            name="orgName"
                            type="text"
                            placeholder="Ex: Minha Loja Inc."
                            required
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white text-lg focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/25 transition-all transform hover:scale-[1.02]"
                    >
                        Criar Espaço de Trabalho
                    </button>
                </form>
            </div>
        </div>
    )
}
