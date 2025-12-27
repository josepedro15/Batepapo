"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "Como funciona a integração com WhatsApp?",
        answer:
            "Utilizamos a API oficial do WhatsApp Business para garantir estabilidade e segurança. Basta escanear um QR Code, igual ao WhatsApp Web, e seu número estará conectado em segundos. Não é necessário nenhum aparelho físico conectado depois da primeira configuração.",
    },
    {
        question: "Posso testar grátis antes de assinar?",
        answer:
            "Sim! Oferecemos 14 dias de teste grátis em todos os planos, sem precisar de cartão de crédito. Você terá acesso a todas as funcionalidades do plano escolhido durante o período de teste.",
    },
    {
        question: "Quantos atendentes podem usar ao mesmo tempo?",
        answer:
            "Depende do seu plano. O Starter permite 1 atendente, o Pro permite até 5, e o Enterprise oferece usuários ilimitados. Todos podem atender simultaneamente o mesmo número de WhatsApp.",
    },
    {
        question: "Vocês oferecem suporte técnico?",
        answer:
            "Sim! Todos os planos incluem suporte técnico. O Starter tem suporte por email com resposta em até 24h, o Pro tem suporte prioritário com resposta em até 4h, e o Enterprise conta com suporte 24/7 com gerente de conta dedicado.",
    },
    {
        question: "Posso integrar com outras ferramentas?",
        answer:
            "Absolutamente! Oferecemos API pública e webhooks para integração com n8n, Zapier, Make e qualquer outra ferramenta. Você pode automatizar todo seu fluxo de vendas sem limitações.",
    },
    {
        question: "Posso cancelar a qualquer momento?",
        answer:
            "Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou fidelidade. Além disso, oferecemos garantia de 7 dias - se não gostar, devolvemos 100% do valor pago.",
    },
    {
        question: "Meus dados estão seguros?",
        answer:
            "Segurança é prioridade. Utilizamos criptografia de ponta a ponta, servidores no Brasil, backups automáticos diários e estamos em conformidade com a LGPD. Seus dados nunca são compartilhados com terceiros.",
    },
];

export function LandingFaq() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-4">
                        FAQ
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Perguntas
                        </span>{" "}
                        <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                            Frequentes
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Tire suas dúvidas sobre o CRM WhatsApp Pro. Não encontrou sua
                        resposta? Entre em contato conosco.
                    </p>
                </motion.div>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl border border-border/30 bg-card/50 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                            >
                                <span className="font-medium text-foreground pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
