"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Users, MessageSquare, TrendingUp } from "lucide-react";

const stats = [
    { icon: Users, value: "500+", label: "Empresas ativas" },
    { icon: MessageSquare, value: "1M+", label: "Mensagens enviadas" },
    { icon: TrendingUp, value: "40%", label: "Aumento em vendas" },
];

export function LandingHero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 lg:pt-0 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-600/10 to-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center lg:text-left"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                            </span>
                            Novo: Integração com IA
                        </motion.div>

                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6">
                            <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                                Transforme seu
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-violet-400 via-violet-500 to-cyan-400 bg-clip-text text-transparent">
                                WhatsApp
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                                em uma Máquina
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                de Vendas
                            </span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                            CRM completo com Kanban, chat multi-atendente, campanhas em massa
                            e integração WhatsApp. Gerencie seu time e escale suas vendas.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                            <Link
                                href="/login"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-bold text-lg shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all hover:scale-105 active:scale-95"
                            >
                                Começar Grátis
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-lg transition-all"
                            >
                                <Play className="h-5 w-5" />
                                Ver Demo
                            </Link>
                        </div>

                        {/* Social Proof Stats */}
                        <div className="grid grid-cols-3 gap-4 lg:gap-8">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                    className="text-center lg:text-left"
                                >
                                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                                        <stat.icon className="h-4 w-4 text-violet-400" />
                                        <span className="text-2xl lg:text-3xl font-bold text-white">
                                            {stat.value}
                                        </span>
                                    </div>
                                    <p className="text-xs lg:text-sm text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Content - Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative"
                    >
                        <div className="relative">
                            {/* Glow Effect */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/30 to-cyan-500/30 rounded-3xl blur-2xl" />

                            {/* Dashboard Mockup */}
                            <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
                                {/* Header bar */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <div className="flex-1 text-center text-xs text-muted-foreground">
                                        CRM WhatsApp Pro - Dashboard
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-6 space-y-4">
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: "Conversas", value: "247", color: "from-violet-500 to-violet-600" },
                                            { label: "Leads", value: "1.2k", color: "from-cyan-500 to-cyan-600" },
                                            { label: "Vendas", value: "R$ 45k", color: "from-green-500 to-green-600" },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="p-3 rounded-xl bg-muted/30 border border-border/30"
                                            >
                                                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                                                <p className={`text-xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Kanban Preview */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-foreground">Pipeline de Vendas</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {["Novo", "Em negociação", "Proposta", "Fechado"].map((stage, i) => (
                                                <div key={stage} className="space-y-2">
                                                    <div className="text-xs text-muted-foreground text-center py-1 px-2 bg-muted/30 rounded-lg">
                                                        {stage}
                                                    </div>
                                                    {[...Array(4 - i)].map((_, j) => (
                                                        <div
                                                            key={j}
                                                            className="h-8 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-border/30"
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="absolute -top-4 -right-4 p-3 bg-green-500 rounded-xl shadow-lg shadow-green-500/30"
                            >
                                <MessageSquare className="h-6 w-6 text-white" />
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -bottom-4 -left-4 p-4 bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                        +
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Novo lead!</p>
                                        <p className="text-xs text-muted-foreground">Agora mesmo</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
