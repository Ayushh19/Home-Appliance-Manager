import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type AssetDocument,
  type DocumentType,
} from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Image, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { api, fieldErrorsOf } from '../../lib/api';
import { formatBytes, formatDate } from '../../lib/format';
import { keys } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { SelectField } from '../../ui/SelectField';

const iconButton =
  'grid size-9 place-items-center rounded-sm text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-ink';

export function DocumentsSection({ assetId, documents }: { assetId: string; documents: AssetDocument[] }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<DocumentType | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<AssetDocument | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });

  const upload = useMutation({
    mutationFn: (body: FormData) => api(`/assets/${assetId}/documents`, { method: 'POST', body }),
    onSuccess: () => {
      refresh();
      setType('');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh();
      setDeleting(null);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!type) next.type = 'Choose a document type';
    if (!file) next.file = 'Choose a file';
    else if (file.size > MAX_DOCUMENT_BYTES) next.file = 'File is too large (max 10 MB)';
    else if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) next.file = 'Use a PDF, JPG, PNG or WebP file';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = new FormData();
    body.append('type', type);
    body.append('file', file!);
    upload.mutate(body);
  };

  return (
    <Card className="animate-fade-up">
      <h2 className="text-[1.5rem] font-bold">Documents</h2>
      <p className="mt-1 text-sm text-muted">Bills, warranty cards, manuals and service papers.</p>

      {documents.length > 0 && (
        <ul className="mt-5 divide-y divide-line/70">
          {documents.map((doc) => {
            const Icon = doc.fileName.toLowerCase().endsWith('.pdf') ? FileText : Image;
            const url = `/api/documents/${doc.id}/file`;
            return (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-blush">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <a href={url} target="_blank" rel="noreferrer" className="block truncate font-medium underline-offset-4 hover:underline">
                    {doc.fileName}
                  </a>
                  <div className="text-xs text-muted">
                    {DOCUMENT_TYPE_LABELS[doc.type]} · <span className="font-mono">{formatBytes(doc.sizeBytes)}</span> · {formatDate(doc.uploadedAt)}
                  </div>
                </div>
                <a href={`${url}?download=1`} className={iconButton} aria-label={`Download ${doc.fileName}`}>
                  <Download className="size-4" aria-hidden />
                </a>
                <button type="button" className={iconButton} aria-label={`Delete ${doc.fileName}`} onClick={() => setDeleting(doc)}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-sm bg-surface p-4 shadow-neu-inset">
        <FormError message={upload.error?.message} />
        <SelectField
          label="Document type"
          placeholder="Select a type"
          options={DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] }))}
          value={type}
          onChange={(e) => setType(e.target.value as DocumentType | '')}
          error={errors.type}
        />
        <div>
          <label htmlFor="document-file" className="mb-1.5 block text-sm font-medium tracking-wide">
            File
          </label>
          <input
            id="document-file"
            ref={fileInput}
            type="file"
            accept={ALLOWED_DOCUMENT_MIME_TYPES.join(',')}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            aria-invalid={errors.file ? true : undefined}
            className={
              'block w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-[1.5px] file:border-line file:bg-surface ' +
              'file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-surface-raised'
            }
          />
          <p className={`mt-1.5 text-sm ${errors.file ? 'text-danger' : 'text-muted'}`}>
            {errors.file ?? 'PDF, JPG, PNG or WebP, up to 10 MB.'}
          </p>
        </div>
        <Button type="submit" variant="ghost" loading={upload.isPending} className="w-full sm:w-auto">
          <Upload className="size-4" aria-hidden />
          Upload
        </Button>
      </form>

      <ConfirmModal
        open={deleting !== null}
        title="Delete document?"
        message={`"${deleting?.fileName}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
