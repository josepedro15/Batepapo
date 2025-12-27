"use client";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    MessageCircle,
    Users,
    Megaphone,
    Plug,
    BarChart3,
} from "lucide-react";

const features = [
    {
        icon: LayoutDashboard,
        title: "Kanban CRM",
        description:
            "Arraste e solte seus leads pelas etapas do funil. Visualize todo seu pipeline de vendas em um só lugar.",
        gradient: "from-violet-500 to-purple-600",
    },
    {
        icon: MessageCircle,
        title: "Chat Multi-atendente",
        description:
            "Atenda vários clientes simultaneamente com sua equipe. Histórico completo de conversas e templates.",
        gradient: "from-cyan-500 to-blue-600",
    },
    {
        icon: Users,
        title: "Multi-tenancy",
        description:
            "Gerencie múltiplas equipes e organizações. Controle de acesso e permissões por usuário.",
        gradient: "from-green-500 to-emerald-600",
    },
    {
        icon: Megaphone,
        title: "Campanhas em Massa",
        description:
            "Envie mensagens personalizadas para milhares de contatos. Segmentação inteligente por tags.",
        gradient: "from-orange-500 to-red-600",
    },
    {
        icon: Plug,
        title: "API & Integrações",
        description:
            "Conecte com n8n, Zapier, Make e mais. Webhooks para automação completa do seu fluxo.",
        gradient: "from-pink-500 to-rose-600",
    },
    {
        icon: BarChart3,
        title: "Relatórios",
        description:
            "Dashboards em tempo real. Métricas de conversão, tempo de resposta e performance da equipe.",
        gradient: "from-indigo-500 to-blue-600",
    },
];

export function LandingFeatures() {
    return (
        <section id="features" className="py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
                        Funcionalidades
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Tudo que você precisa para
                        </span>{" "}
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            escalar suas vendas
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Uma plataforma completa para gerenciar relacionamentos com clientes,
                        automatizar processos e aumentar suas conversões via WhatsApp.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-6 lg:p-8 rounded-2xl bg-card/50 border border-border/30 hover:border-violet-500/30 hover:bg-card/80 transition-all duration-300"
                        >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative">
                                {/* Icon */}
                                <div
                                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-5 shadow-lg`}
                                >
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-violet-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
