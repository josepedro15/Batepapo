"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const integrations = [
    { name: "WhatsApp Business", icon: "💬" },
    { name: "n8n", icon: "⚡" },
    { name: "Zapier", icon: "🔗" },
    { name: "Make", icon: "🔧" },
    { name: "OpenAI", icon: "🤖" },
];

export function LandingLogoCloud() {
    return (
        <section className="py-16 border-y border-border/30 bg-muted/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Integrações Poderosas
                    </p>
                    <h3 className="text-xl font-semibold text-foreground">
                        Conecte com as ferramentas que você já usa
                    </h3>
                </motion.div>

                <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
                    {integrations.map((integration, index) => (
                        <motion.div
                            key={integration.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-card/50 border border-border/30 hover:border-violet-500/30 hover:bg-card/80 transition-all group"
                        >
                            <span className="text-2xl">{integration.icon}</span>
                            <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {integration.name}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center"
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                            API Oficial WhatsApp
                        </span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-border/50" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            🔒 Dados criptografados
                        </span>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-border/50" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            🇧🇷 Servidores no Brasil
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
