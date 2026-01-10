'use client'

import { useState } from 'react'
import {
    MessageSquare,
    MousePointer2,
    List,
    FileText,
    LayoutGrid,
    Plus,
    Trash2,
    Link2,
    Reply,
    Copy,
    Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Message types matching UAZAPI
export type MessageType = 'text' | 'button' | 'list' | 'document' | 'carousel'

export interface MessageContent {
    type: MessageType
    text?: string
    file?: string
    docName?: string
    footerText?: string
    imageButton?: string
    listButton?: string
    choices?: string[]
}

interface MessageBuilderProps {
    value: MessageContent[]
    onChange: (messages: MessageContent[]) => void
}

const messageTypes = [
    { type: 'text' as MessageType, label: 'Texto', icon: MessageSquare, description: 'Mensagem de texto simples' },
    { type: 'button' as MessageType, label: 'Botões', icon: MousePointer2, description: 'Mensagem com botões interativos' },
    { type: 'list' as MessageType, label: 'Lista', icon: List, description: 'Menu de opções em lista' },
    { type: 'document' as MessageType, label: 'Documento', icon: FileText, description: 'Envio de PDF ou arquivo' },
    { type: 'carousel' as MessageType, label: 'Carrossel', icon: LayoutGrid, description: 'Produtos em carrossel' },
]

export function MessageBuilder({ value, onChange }: MessageBuilderProps) {
    const [activeTab, setActiveTab] = useState<MessageType>('text')

    const addMessage = (type: MessageType) => {
        const newMessage: MessageContent = { type }

        switch (type) {
            case 'text':
                newMessage.text = ''
                break
            case 'button':
                newMessage.text = ''
                newMessage.footerText = ''
                newMessage.choices = []
                break
            case 'list':
                newMessage.text = ''
                newMessage.listButton = 'Ver Opções'
                newMessage.choices = []
                break
            case 'document':
                newMessage.file = ''
                newMessage.docName = ''
                break
            case 'carousel':
                newMessage.text = ''
                newMessage.choices = []
                break
        }

        onChange([...value, newMessage])
    }

    const updateMessage = (index: number, updates: Partial<MessageContent>) => {
        const newMessages = [...value]
        newMessages[index] = { ...newMessages[index], ...updates }
        onChange(newMessages)
    }

    const removeMessage = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    const addChoice = (messageIndex: number, choice: string) => {
        const message = value[messageIndex]
        if (message.choices) {
            updateMessage(messageIndex, { choices: [...message.choices, choice] })
        }
    }

    const removeChoice = (messageIndex: number, choiceIndex: number) => {
        const message = value[messageIndex]
        if (message.choices) {
            updateMessage(messageIndex, {
                choices: message.choices.filter((_, i) => i !== choiceIndex)
            })
        }
    }

    const renderMessageEditor = (message: MessageContent, index: number) => {
        switch (message.type) {
            case 'text':
                return (
                    <div className="space-y-3">
                        <textarea
                            value={message.text || ''}
                            onChange={(e) => updateMessage(index, { text: e.target.value })}
                            placeholder="Digite sua mensagem... Use {{nome}} para personalizar"
                            className="w-full h-32 bg-muted/50 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            💡 Use <code className="bg-muted px-1 rounded">{'{{nome}}'}</code> para inserir o nome do contato
                        </p>
                    </div>
                )

            case 'button':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Texto Principal</label>
                            <textarea
                                value={message.text || ''}
                                onChange={(e) => updateMessage(index, { text: e.target.value })}
                                placeholder="Promoção Especial! Confira nossas ofertas"
                                className="w-full h-20 mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Rodapé (opcional)</label>
                                <input
                                    value={message.footerText || ''}
                                    onChange={(e) => updateMessage(index, { footerText: e.target.value })}
                                    placeholder="Válido até 31/12"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Imagem (URL)</label>
                                <input
                                    value={message.imageButton || ''}
                                    onChange={(e) => updateMessage(index, { imageButton: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Botões</label>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                                Formatos: <code className="bg-muted px-1 rounded">Texto|url</code> ou <code className="bg-muted px-1 rounded">Texto|reply:id</code> ou <code className="bg-muted px-1 rounded">Texto|copy:texto</code>
                            </p>
                            <div className="space-y-2">
                                {message.choices?.map((choice, choiceIdx) => (
                                    <div key={choiceIdx} className="flex items-center gap-2">
                                        <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                                            {choice.includes('http') && <Link2 className="h-4 w-4 text-primary" />}
                                            {choice.includes('reply:') && <Reply className="h-4 w-4 text-accent" />}
                                            {choice.includes('copy:') && <Copy className="h-4 w-4 text-success" />}
                                            <span className="text-sm">{choice}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeChoice(index, choiceIdx)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <ButtonChoiceAdder onAdd={(choice) => addChoice(index, choice)} />
                            </div>
                        </div>
                    </div>
                )

            case 'list':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Texto da Mensagem</label>
                            <textarea
                                value={message.text || ''}
                                onChange={(e) => updateMessage(index, { text: e.target.value })}
                                placeholder="Escolha uma opção:"
                                className="w-full h-20 mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Texto do Botão</label>
                            <input
                                value={message.listButton || ''}
                                onChange={(e) => updateMessage(index, { listButton: e.target.value })}
                                placeholder="Ver Opções"
                                className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Opções da Lista</label>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                                Use <code className="bg-muted px-1 rounded">[Título da Seção]</code> para agrupar e <code className="bg-muted px-1 rounded">Item|id</code> para opções
                            </p>
                            <div className="space-y-2">
                                {message.choices?.map((choice, choiceIdx) => (
                                    <div key={choiceIdx} className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex-1 p-2 rounded-lg text-sm",
                                            choice.startsWith('[')
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "bg-muted/30"
                                        )}>
                                            {choice}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeChoice(index, choiceIdx)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <ListChoiceAdder onAdd={(choice) => addChoice(index, choice)} />
                            </div>
                        </div>
                    </div>
                )

            case 'document':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">URL do Documento</label>
                            <input
                                value={message.file || ''}
                                onChange={(e) => updateMessage(index, { file: e.target.value })}
                                placeholder="https://example.com/documento.pdf"
                                className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Nome do Arquivo</label>
                            <input
                                value={message.docName || ''}
                                onChange={(e) => updateMessage(index, { docName: e.target.value })}
                                placeholder="Catalogo.pdf"
                                className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                )

            case 'carousel':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Texto Introdutório</label>
                            <textarea
                                value={message.text || ''}
                                onChange={(e) => updateMessage(index, { text: e.target.value })}
                                placeholder="Conheça nossos produtos"
                                className="w-full h-20 mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Itens do Carrossel</label>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                                Formato: <code className="bg-muted px-1 rounded">[Título\nDescrição]</code> + <code className="bg-muted px-1 rounded">{'{url_imagem}'}</code> + botões
                            </p>
                            <div className="space-y-2">
                                {message.choices?.map((choice, choiceIdx) => (
                                    <div key={choiceIdx} className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex-1 p-2 rounded-lg text-sm",
                                            choice.startsWith('[') ? "bg-primary/10 text-primary font-semibold" :
                                                choice.startsWith('{') ? "bg-accent/10 text-accent" :
                                                    "bg-muted/30"
                                        )}>
                                            {choice.startsWith('{') && <ImageIcon className="inline h-3 w-3 mr-1" />}
                                            {choice}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeChoice(index, choiceIdx)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                <CarouselChoiceAdder onAdd={(choice) => addChoice(index, choice)} />
                            </div>
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="space-y-6">
            {/* Message Type Tabs */}
            <div className="flex flex-wrap gap-2">
                {messageTypes.map((mt) => (
                    <button
                        key={mt.type}
                        type="button"
                        onClick={() => setActiveTab(mt.type)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                            activeTab === mt.type
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <mt.icon className="h-4 w-4" />
                        {mt.label}
                    </button>
                ))}
            </div>

            {/* Add Message Button */}
            <button
                type="button"
                onClick={() => addMessage(activeTab)}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
                <Plus className="h-5 w-5" />
                Adicionar {messageTypes.find(m => m.type === activeTab)?.label}
            </button>

            {/* Messages List */}
            {value.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">
                        Mensagens da Campanha ({value.length})
                    </h4>
                    {value.map((message, index) => {
                        const typeInfo = messageTypes.find(m => m.type === message.type)
                        return (
                            <div
                                key={index}
                                className="glass p-5 rounded-xl border border-border/50 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            {typeInfo && <typeInfo.icon className="h-5 w-5 text-primary" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{typeInfo?.label}</p>
                                            <p className="text-xs text-muted-foreground">Mensagem #{index + 1}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeMessage(index)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                                {renderMessageEditor(message, index)}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// Helper component for adding button choices
function ButtonChoiceAdder({ onAdd }: { onAdd: (choice: string) => void }) {
    const [label, setLabel] = useState('')
    const [action, setAction] = useState('')
    const [actionType, setActionType] = useState<'url' | 'reply' | 'copy'>('url')

    const handleAdd = () => {
        if (!label || !action) return
        const choice = actionType === 'url'
            ? `${label}|${action}`
            : `${label}|${actionType}:${action}`
        onAdd(choice)
        setLabel('')
        setAction('')
    }

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Texto do botão"
                className="flex-1 min-w-[120px] bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as 'url' | 'reply' | 'copy')}
                className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
            >
                <option value="url">URL</option>
                <option value="reply">Resposta</option>
                <option value="copy">Copiar</option>
            </select>
            <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder={actionType === 'url' ? 'https://...' : actionType === 'reply' ? 'ID da resposta' : 'Texto para copiar'}
                className="flex-1 min-w-[150px] bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
                type="button"
                onClick={handleAdd}
                disabled={!label || !action}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    )
}

// Helper component for adding list choices
function ListChoiceAdder({ onAdd }: { onAdd: (choice: string) => void }) {
    const [text, setText] = useState('')
    const [isSection, setIsSection] = useState(false)

    const handleAdd = () => {
        if (!text) return
        const choice = isSection ? `[${text}]` : text.includes('|') ? text : `${text}|${text.toLowerCase().replace(/\s/g, '_')}`
        onAdd(choice)
        setText('')
    }

    return (
        <div className="flex gap-2 mt-3">
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={isSection}
                    onChange={(e) => setIsSection(e.target.checked)}
                    className="rounded"
                />
                Seção
            </label>
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isSection ? "Título da seção" : "Item|id"}
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
                type="button"
                onClick={handleAdd}
                disabled={!text}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    )
}

// Helper component for adding carousel choices
function CarouselChoiceAdder({ onAdd }: { onAdd: (choice: string) => void }) {
    const [text, setText] = useState('')
    const [choiceType, setChoiceType] = useState<'title' | 'image' | 'button'>('title')

    const handleAdd = () => {
        if (!text) return
        let choice = text
        if (choiceType === 'title') choice = `[${text}]`
        if (choiceType === 'image') choice = `{${text}}`
        onAdd(choice)
        setText('')
    }

    return (
        <div className="flex gap-2 mt-3">
            <select
                value={choiceType}
                onChange={(e) => setChoiceType(e.target.value as 'title' | 'image' | 'button')}
                className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
            >
                <option value="title">Título</option>
                <option value="image">Imagem</option>
                <option value="button">Botão</option>
            </select>
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                    choiceType === 'title' ? "Título\\nDescrição" :
                        choiceType === 'image' ? "URL da imagem" :
                            "Texto|ação"
                }
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
                type="button"
                onClick={handleAdd}
                disabled={!text}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    )
}
