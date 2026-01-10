'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { importContacts } from '@/app/dashboard/contacts/actions'
import { cn } from '@/lib/utils'

export function ImportContactsDialog() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parsedContacts, setParsedContacts] = useState<any[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [errors, setErrors] = useState<string[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseCSV(selectedFile)
        }
    }

    const parseCSV = (file: File) => {
        setIsParsing(true)
        setErrors([])

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setIsParsing(false)

                if (results.errors.length > 0) {
                    setErrors(results.errors.map(e => `Linha ${e.row}: ${e.message}`))
                    return
                }

                // Transform and validate keys
                const contacts = results.data.map((row: any) => {
                    // Try to map various common header names
                    const name = row['nome'] || row['Nome'] || row['name'] || row['Name']
                    const phone = row['numero'] || row['Numero'] || row['phone'] || row['Phone'] || row['celular']
                    const rawTags = row['etiqueta'] || row['Etiqueta'] || row['tags'] || row['Tags'] || ''

                    const tags = rawTags ? rawTags.split(';').map((t: string) => t.trim()) : []

                    return { name, phone, tags }
                })

                // Filter out empty rows or rows without mandatory fields
                const validContacts = contacts.filter((c: any) => c.name && c.phone)

                if (validContacts.length === 0) {
                    setErrors(['Nenhum contato válido encontrado. Verifique se as colunas "nome" e "numero" existem.'])
                }

                setParsedContacts(validContacts)
            },
            error: (error) => {
                setIsParsing(false)
                setErrors(['Erro ao ler arquivo CSV: ' + error.message])
            }
        })
    }

    const handleImport = async () => {
        if (parsedContacts.length === 0) return

        setIsImporting(true)
        try {
            const result = await importContacts(parsedContacts)

            if (result.success) {
                toast.success(`${result.count} contatos importados com sucesso!`)
                setOpen(false)
                resetForm()
            } else {
                toast.error('Erro na importação')
                if (result.errors) {
                    setErrors(result.errors)
                }
            }
        } catch (error) {
            toast.error('Erro inesperado ao importar')
        } finally {
            setIsImporting(false)
        }
    }

    const resetForm = () => {
        setFile(null)
        setParsedContacts([])
        setErrors([])
    }

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,nome,numero,etiqueta\nJoão Silva,5511999999999,Cliente;VIP\nMaria Souza,5511888888888,Lead"
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "modelo_importacao.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importar Contatos</DialogTitle>
                    <DialogDescription>
                        Carregue um arquivo CSV para importar contatos em massa.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* File Drop Area */}
                    {!file && (
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors">
                            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-medium mb-1">Arraste seu arquivo CSV ou clique para selecionar</p>
                            <p className="text-xs text-muted-foreground mb-4">Colunas: nome, numero, etiqueta (opcional)</p>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="csv-upload"
                                onChange={handleFileChange}
                            />
                            <div className="flex justify-center gap-3">
                                <Button variant="secondary" onClick={() => document.getElementById('csv-upload')?.click()}>
                                    Selecionar Arquivo
                                </Button>
                                <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2 text-primary">
                                    <Download className="h-3.5 w-3.5" />
                                    Baixar Modelo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Preview Area */}
                    {file && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={resetForm} className="text-muted-foreground hover:text-destructive">
                                    Trocar
                                </Button>
                            </div>

                            {isParsing ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Lendo arquivo...
                                </div>
                            ) : (
                                <>
                                    {errors.length > 0 ? (
                                        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex gap-3 items-start">
                                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                            <ul className="list-disc list-inside space-y-1">
                                                {errors.slice(0, 5).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                                {errors.length > 5 && <li>...e mais {errors.length - 5} erros</li>}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="bg-success/10 text-success text-sm p-4 rounded-lg flex gap-3 items-center">
                                            <CheckCircle className="h-5 w-5 shrink-0" />
                                            <div>
                                                <p className="font-semibold">{parsedContacts.length} contatos encontrados</p>
                                                <p className="opacity-80">Pronto para importar.</p>
                                            </div>
                                        </div>
                                    )}

                                    {parsedContacts.length > 0 && (
                                        <div className="max-h-[200px] overflow-y-auto border border-border rounded-lg">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-medium">Nome</th>
                                                        <th className="px-3 py-2 text-left font-medium">Telefone</th>
                                                        <th className="px-3 py-2 text-left font-medium">Etiquetas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {parsedContacts.slice(0, 10).map((c, i) => (
                                                        <tr key={i}>
                                                            <td className="px-3 py-2">{c.name}</td>
                                                            <td className="px-3 py-2 font-mono">{c.phone}</td>
                                                            <td className="px-3 py-2 text-muted-foreground">{c.tags.join(', ')}</td>
                                                        </tr>
                                                    ))}
                                                    {parsedContacts.length > 10 && (
                                                        <tr>
                                                            <td colSpan={3} className="px-3 py-2 text-center text-muted-foreground bg-muted/10">
                                                                ...e mais {parsedContacts.length - 10} contatos
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleImport}
                        disabled={isParsing || isImporting || parsedContacts.length === 0 || errors.length > 0}
                        className="gap-2"
                    >
                        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isImporting ? 'Importando...' : 'Confirmar Importação'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
