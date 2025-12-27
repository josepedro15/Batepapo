"use client";

import Link from "next/link";
import { MessageSquare, Github, Linkedin, Instagram } from "lucide-react";

const footerLinks = {
    produto: [
        { name: "Funcionalidades", href: "#features" },
        { name: "Preços", href: "#pricing" },
        { name: "FAQ", href: "#faq" },
        { name: "Demo", href: "/dashboard" },
    ],
    empresa: [
        { name: "Sobre", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Carreiras", href: "#" },
        { name: "Contato", href: "#" },
    ],
    legal: [
        { name: "Termos de Uso", href: "#" },
        { name: "Privacidade", href: "#" },
        { name: "LGPD", href: "#" },
    ],
};

const socialLinks = [
    { name: "GitHub", icon: Github, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
];

export function LandingFooter() {
    return (
        <footer className="border-t border-border/30 bg-muted/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer */}
                <div className="py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="relative">
                                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 opacity-50 blur" />
                                <div className="relative bg-background rounded-lg p-2">
                                    <MessageSquare className="h-6 w-6 text-violet-500" />
                                </div>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                CRM WhatsApp
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
                            Plataforma SaaS multi-tenant para gestão de atendimento via
                            WhatsApp. CRM, automação e vendas em um só lugar.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={social.name}
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Produto</h4>
                        <ul className="space-y-3">
                            {footerLinks.produto.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
                        <ul className="space-y-3">
                            {footerLinks.empresa.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="py-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} CRM WhatsApp Pro. Todos os direitos
                        reservados.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Feito com 💜 no Brasil
                    </p>
                </div>
            </div>
        </footer>
    );
}
