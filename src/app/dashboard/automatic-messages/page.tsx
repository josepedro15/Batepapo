import { createClient } from '@/lib/supabase/server'
import { getAutomaticMessageRules, deleteAutomaticMessageRule, toggleAutomaticMessageRule } from './actions'
import { AutomaticMessageForm } from '@/components/automatic-messages/automatic-message-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Trash2, Clock, MessageSquare } from 'lucide-react'
import { DeleteButton } from './delete-button' // Extracting delete logic to client component
import { ToggleSwitch } from './toggle-switch' // Extracting toggle logic to client component

export default async function AutomaticMessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Não autorizado</div>

    // Reset to getting org properly - assuming single org for now or fetching first
    // In a real multi-tenant setup, we'd get the org from context or params
    const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    const organizationId = orgMember?.organization_id

    if (!organizationId) return <div>Organização não encontrada</div>

    const rules = await getAutomaticMessageRules(organizationId)

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mensagens Automáticas</h2>
                    <p className="text-muted-foreground">
                        Configure mensagens para serem enviadas automaticamente para novos leads.
                    </p>
                </div>
                <AutomaticMessageForm organizationId={organizationId} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rules?.map((rule) => (
                    <Card key={rule.id} className={!rule.is_active ? 'opacity-75' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                {rule.name}
                            </CardTitle>
                            <ToggleSwitch id={rule.id} isActive={rule.is_active} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 mt-4">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                                </div>
                                <div className="flex items-start text-sm">
                                    <MessageSquare className="mr-2 h-4 w-4 mt-1" />
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {rule.message}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <AutomaticMessageForm
                                organizationId={organizationId}
                                rule={rule}
                                trigger={
                                    <Button variant="secondary" size="sm">
                                        Editar
                                    </Button>
                                }
                            />
                            <DeleteButton id={rule.id} />
                        </CardFooter>
                    </Card>
                ))}

                {rules?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-4" />
                        <p className="text-lg font-medium">Nenhuma regra configurada</p>
                        <p className="text-sm">Crie sua primeira regra de mensagem automática.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
