'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Globe, MapPin, Loader2 } from 'lucide-react'
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
                toast.success('Informações da empresa salvas!')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="glass-heavy border-border/50">
            <CardContent className="pt-6">
                <form action={handleSubmit} className="space-y-5">
                    {/* Row 1: Name & Website */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium">Nome da Empresa</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={organization.name}
                                placeholder="Minha Loja"
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="website" className="text-sm font-medium">Site</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="website"
                                    name="website"
                                    defaultValue={organization.website || ''}
                                    placeholder="https://suaempresa.com.br"
                                    className="pl-9 h-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Descrição / Contexto para IA
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={organization.description || ''}
                            placeholder="Ex: 'Somos uma loja de roupas feminina focada em moda casual chic. Atendimento humanizado, envio para todo Brasil. Tom de voz: descolado e acolhedor.'"
                            rows={3}
                            className="resize-none text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Quanto mais detalhes, melhor a IA responderá pelos seus atendentes.
                        </p>
                    </div>

                    {/* Row 3: Social Media */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Redes Sociais</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                                name="instagram"
                                defaultValue={organization.instagram || ''}
                                placeholder="@instagram"
                                className="h-10"
                            />
                            <Input
                                name="facebook"
                                defaultValue={organization.facebook || ''}
                                placeholder="facebook.com/..."
                                className="h-10"
                            />
                            <Input
                                name="linkedin"
                                defaultValue={organization.linkedin || ''}
                                placeholder="linkedin.com/..."
                                className="h-10"
                            />
                        </div>
                    </div>

                    {/* Row 4: Address */}
                    <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                id="address"
                                name="address"
                                defaultValue={organization.address || ''}
                                placeholder="Rua, Número - Bairro, Cidade/UF"
                                className="pl-9 h-10"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
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
