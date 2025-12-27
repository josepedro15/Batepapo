"use client";

import { motion } from "framer-motion";
import { QrCode, Settings, Rocket } from "lucide-react";

const steps = [
    {
        icon: QrCode,
        step: "01",
        title: "Conecte seu WhatsApp",
        description:
            "Escaneie o QR Code e conecte seu número em segundos. Simples como usar o WhatsApp Web.",
        gradient: "from-green-500 to-emerald-600",
    },
    {
        icon: Settings,
        step: "02",
        title: "Configure seu CRM",
        description:
            "Personalize seu pipeline de vendas, crie tags, importe contatos e configure sua equipe.",
        gradient: "from-violet-500 to-purple-600",
    },
    {
        icon: Rocket,
        step: "03",
        title: "Escale suas Vendas",
        description:
            "Comece a atender, automatize campanhas e veja seus resultados crescerem exponencialmente.",
        gradient: "from-cyan-500 to-blue-600",
    },
];

export function LandingHowItWorks() {
    return (
        <section id="how-it-works" className="py-24 lg:py-32 bg-muted/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
                        Como Funciona
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Comece em
                        </span>{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                            3 passos simples
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Configuração rápida e intuitiva. Em poucos minutos você estará
                        pronto para transformar seu atendimento.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="relative"
                        >
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-border via-violet-500/30 to-border" />
                            )}

                            <div className="relative text-center lg:text-left">
                                {/* Step Number */}
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 border border-border/30 text-2xl font-bold text-muted-foreground mb-6">
                                    {step.step}
                                </div>

                                {/* Icon Card */}
                                <div
                                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.gradient} shadow-xl mb-6 ml-4`}
                                >
                                    <step.icon className="h-8 w-8 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-foreground mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto lg:mx-0">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
