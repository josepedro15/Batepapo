"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingCta() {
    return (
        <section className="py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative rounded-3xl overflow-hidden"
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-violet-700 to-purple-700" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

                    {/* Glow Effects */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-800/50 rounded-full blur-3xl" />

                    {/* Content */}
                    <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-6"
                        >
                            <Sparkles className="h-4 w-4" />
                            Oferta por tempo limitado
                        </motion.div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
                            Pronto para escalar suas vendas?
                        </h2>

                        <p className="text-lg lg:text-xl text-white/80 max-w-2xl mx-auto mb-10">
                            Junte-se a mais de 500 empresas que já transformaram seu
                            atendimento via WhatsApp. Comece seu teste grátis de 14 dias hoje
                            mesmo.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-violet-700 font-bold text-lg shadow-2xl hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                Começar Teste Gratuito
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-lg transition-all"
                            >
                                Ver Demo ao Vivo
                            </Link>
                        </div>

                        <p className="mt-6 text-sm text-white/60">
                            Sem cartão de crédito • Cancele quando quiser • Suporte em português
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
