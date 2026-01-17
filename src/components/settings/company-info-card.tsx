'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Save, Globe, MapPin, Instagram, Facebook, Linkedin } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrganizationSettings } from '@/app/dashboard/settings/actions'

interface CompanyInfoCardProps {
    organization: {
        id: string
        name: string
        website?: string | null
        description?: string | null
        instagram?: string | null
        facebook?: string | null
        linkedin?: string | null
        address?: string | null
    }
}

export function CompanyInfoCard({ organization }: CompanyInfoCardProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const result = await updateOrganizationSettings(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Informações da empresa salvas com sucesso!')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Building2 className="w-24 h-24" />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Informações do Negócio
                </CardTitle>
                <CardDescription>
                    Esses dados são usados como contexto global para todas as IAs do sistema (mensagens, campanhas, etc).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Empresa</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={organization.name}
                                placeholder="Minha Loja"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Site (URL)</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="website"
                                    name="website"
                                    defaultValue={organization.website || ''}
                                    placeholder="https://suaempresa.com.br"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição do Negócio (Contexto para IA)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={organization.description || ''}
                            placeholder="Descreva o que sua empresa faz, seus diferenciais, público-alvo, tom de voz, etc. Ex: 'Somos uma loja de roupas feminina focada em moda casual chic, com atendimento humanizado e envio para todo Brasil.'"
                            rows={4}
                            className="bg-muted/30"
                        />
                        <p className="text-xs text-muted-foreground">
                            Quanto mais detalhes, melhor a IA entenderá como responder pelos seus atendentes.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Redes Sociais & Contato</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-pink-500" />
                                <Input
                                    name="instagram"
                                    defaultValue={organization.instagram || ''}
                                    placeholder="@seu_instagram"
                                    className="pl-9"
                                />
                            </div>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-blue-600" />
                                <Input
                                    name="facebook"
                                    defaultValue={organization.facebook || ''}
                                    placeholder="Link Facebook"
                                    className="pl-9"
                                />
                            </div>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-blue-700" />
                                <Input
                                    name="linkedin"
                                    defaultValue={organization.linkedin || ''}
                                    placeholder="Link LinkedIn"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Endereço Físico</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="address"
                                name="address"
                                defaultValue={organization.address || ''}
                                placeholder="Rua Exemplo, 123 - Centro, Cidade/UF"
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>Salvando...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Informações
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
