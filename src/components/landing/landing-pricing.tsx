"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
    {
        name: "Starter",
        description: "Para pequenas empresas que estão começando",
        price: "97",
        period: "/mês",
        features: [
            "1 usuário",
            "1 pipeline de vendas",
            "500 contatos",
            "1.000 mensagens/mês",
            "Suporte por email",
            "Integrações básicas",
        ],
        cta: "Começar Grátis",
        href: "/login",
        popular: false,
        gradient: "from-slate-500 to-slate-600",
    },
    {
        name: "Pro",
        description: "Para equipes que precisam escalar",
        price: "297",
        period: "/mês",
        features: [
            "5 usuários",
            "Pipelines ilimitados",
            "5.000 contatos",
            "10.000 mensagens/mês",
            "Suporte prioritário",
            "API & Webhooks",
            "Relatórios avançados",
            "Campanhas em massa",
        ],
        cta: "Teste Grátis 14 Dias",
        href: "/login",
        popular: true,
        gradient: "from-violet-600 to-purple-600",
    },
    {
        name: "Enterprise",
        description: "Para grandes operações com necessidades customizadas",
        price: "Sob consulta",
        period: "",
        features: [
            "Usuários ilimitados",
            "Tudo do Pro",
            "SLA garantido",
            "Onboarding dedicado",
            "Servidor dedicado",
            "Integrações customizadas",
            "Suporte 24/7",
            "Treinamento da equipe",
        ],
        cta: "Falar com Vendas",
        href: "/login",
        popular: false,
        gradient: "from-cyan-500 to-blue-600",
    },
];

export function LandingPricing() {
    return (
        <section id="pricing" className="py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
                        Preços
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Planos que
                        </span>{" "}
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            cabem no seu bolso
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Sem taxas escondidas. Cancele quando quiser. Teste grátis por 14
                        dias sem compromisso.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className={`relative rounded-2xl ${plan.popular
                                    ? "bg-card border-2 border-violet-500 shadow-2xl shadow-violet-500/20"
                                    : "bg-card/50 border border-border/30"
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium shadow-lg">
                                        <Sparkles className="h-4 w-4" />
                                        Mais Popular
                                    </div>
                                </div>
                            )}

                            <div className="p-8 lg:p-10">
                                {/* Plan Info */}
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        {plan.price !== "Sob consulta" && (
                                            <span className="text-sm text-muted-foreground">R$</span>
                                        )}
                                        <span className="text-4xl lg:text-5xl font-bold text-foreground">
                                            {plan.price}
                                        </span>
                                        {plan.period && (
                                            <span className="text-muted-foreground">{plan.period}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <div
                                                className={`flex-shrink-0 p-1 rounded-full bg-gradient-to-r ${plan.gradient}`}
                                            >
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href={plan.href}
                                    className={`block w-full py-4 rounded-xl text-center font-semibold transition-all hover:scale-105 active:scale-95 ${plan.popular
                                            ? "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white shadow-lg shadow-violet-500/25"
                                            : "bg-muted hover:bg-muted/80 text-foreground"
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Money Back Guarantee */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-sm text-muted-foreground">
                        🛡️ Garantia de 7 dias. Se não gostar, devolvemos 100% do seu
                        dinheiro.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
