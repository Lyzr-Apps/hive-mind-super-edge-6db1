'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { getDocuments, uploadAndTrainDocument, deleteDocuments } from '@/lib/ragKnowledgeBase'
import {
  RiDatabase2Line,
  RiFileTextLine,
  RiFilePdf2Line,
  RiFileWordLine,
  RiDeleteBinLine,
  RiUploadCloud2Line,
  RiSearchLine,
  RiRefreshLine,
  RiLoader4Line,
  RiCheckLine,
  RiCloseLine,
} from 'react-icons/ri'

const RAG_ID = '69a3022d00c2d274880f7f58'

interface KBDocument {
  fileName: string
  fileType: string
  status?: string
  uploadedAt?: string
  id?: string
}

export default function KnowledgeBaseManager() {
  const [documents, setDocuments] = useState<KBDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [deletingFile, setDeletingFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getDocuments(RAG_ID)
      if (result.success && Array.isArray(result.documents)) {
        setDocuments(result.documents.map((d) => ({
          fileName: d.fileName || 'Unknown',
          fileType: d.fileType || 'txt',
          status: d.status || 'active',
          uploadedAt: d.uploadedAt,
          id: d.id,
        })))
      } else {
        setDocuments([])
      }
    } catch {
      setError('Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')
    setUploadProgress(10)

    let successCount = 0
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i]
      try {
        setUploadProgress(Math.round(((i + 0.5) / fileArr.length) * 100))
        const result = await uploadAndTrainDocument(RAG_ID, file)
        if (result.success) {
          successCount++
        }
      } catch {
        setError(`Failed to upload ${file.name}`)
      }
      setUploadProgress(Math.round(((i + 1) / fileArr.length) * 100))
    }

    if (successCount > 0) {
      setSuccess(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully.`)
      setTimeout(() => setSuccess(''), 4000)
    }
    setUploading(false)
    setUploadProgress(0)
    fetchDocs()
  }, [fetchDocs])

  const handleDelete = useCallback(async (fileName: string) => {
    setDeletingFile(fileName)
    setError('')
    try {
      const result = await deleteDocuments(RAG_ID, [fileName])
      if (result.success) {
        setSuccess(`"${fileName}" deleted.`)
        setTimeout(() => setSuccess(''), 3000)
        fetchDocs()
      } else {
        setError(result.error || 'Failed to delete document.')
      }
    } catch {
      setError('Failed to delete document.')
    } finally {
      setDeletingFile(null)
    }
  }, [fetchDocs])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) {
      handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <RiFilePdf2Line className="w-5 h-5 text-red-400" />
    if (fileType === 'docx') return <RiFileWordLine className="w-5 h-5 text-blue-400" />
    return <RiFileTextLine className="w-5 h-5 text-muted-foreground" />
  }

  const filtered = documents.filter((d) =>
    !search.trim() || d.fileName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base</h2>
            <p className="text-sm text-muted-foreground mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} indexed</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading} className="border-border text-muted-foreground hover:text-foreground hover:border-primary/50">
            <RiRefreshLine className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="relative mb-4">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          <RiUploadCloud2Line className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Drag files here or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">.pdf, .docx, .txt accepted</p>
        </div>

        {uploading && (
          <div className="mt-3">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">{uploadProgress}% uploaded</p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <RiCloseLine className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
            <RiCheckLine className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        {loading && documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RiLoader4Line className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <RiDatabase2Line className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">
                {search ? 'No matching documents' : 'No documents yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search ? 'Try a different search term.' : 'Upload documents to build your knowledge base.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((doc, i) => (
              <Card key={doc.id || doc.fileName + i} className="bg-card border-border hover:border-primary/30 transition-all duration-200 shadow-[0_2px_10px_rgba(139,92,246,0.08)] group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={`text-xs border-0 ${doc.status === 'active' ? 'bg-green-500/10 text-green-400' : doc.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-secondary text-muted-foreground'}`}>
                        {doc.status || 'active'}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase">{doc.fileType}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.fileName)}
                    disabled={deletingFile === doc.fileName}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    {deletingFile === doc.fileName ? (
                      <RiLoader4Line className="w-4 h-4 animate-spin" />
                    ) : (
                      <RiDeleteBinLine className="w-4 h-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
