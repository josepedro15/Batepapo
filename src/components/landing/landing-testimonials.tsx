"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Maria Santos",
        role: "CEO",
        company: "Loja Virtual Fashion",
        avatar: "MS",
        rating: 5,
        content:
            "Triplicamos nossas vendas em 3 meses! O CRM WhatsApp Pro automatizou todo nosso atendimento e a equipe consegue gerenciar muito mais clientes agora.",
    },
    {
        name: "Carlos Oliveira",
        role: "Gerente Comercial",
        company: "Tech Solutions",
        avatar: "CO",
        rating: 5,
        content:
            "A integração com n8n foi game changer. Automatizamos o follow-up e nenhum lead é esquecido. Nossa taxa de conversão subiu 45%.",
    },
    {
        name: "Ana Paula",
        role: "Fundadora",
        company: "Consultoria AP",
        avatar: "AP",
        rating: 5,
        content:
            "Finalmente um CRM pensado para o WhatsApp brasileiro! A interface é intuitiva, o suporte é excelente e consigo ver todo meu pipeline em um único lugar.",
    },
    {
        name: "Roberto Lima",
        role: "Diretor",
        company: "Imobiliária Premium",
        avatar: "RL",
        rating: 5,
        content:
            "Com as campanhas em massa, conseguimos nurturar nossa base de contatos de forma profissional. O retorno sobre investimento foi imediato.",
    },
];

export function LandingTestimonials() {
    return (
        <section className="py-24 lg:py-32 bg-muted/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
                        Depoimentos
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Empresas que já
                        </span>{" "}
                        <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                            transformaram suas vendas
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Veja o que nossos clientes estão falando sobre a experiência com o
                        CRM WhatsApp Pro.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative p-6 lg:p-8 rounded-2xl bg-card/50 border border-border/30 hover:border-green-500/30 transition-all"
                        >
                            {/* Quote Icon */}
                            <Quote className="absolute top-6 right-6 h-8 w-8 text-muted-foreground/20" />

                            {/* Rating */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-foreground leading-relaxed mb-6">
                                &ldquo;{testimonial.content}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonial.role} · {testimonial.company}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
