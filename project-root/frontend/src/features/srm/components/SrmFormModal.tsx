import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Paperclip } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export interface SrmFieldOption {
  value: string;
  label: string;
}

export interface SrmField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: SrmFieldOption[];
  defaultValue?: string;
  /** Заблокировать редактирование (для автогенерируемых значений) */
  readOnly?: boolean;
  /** Растянуть на всю ширину сетки (для textarea и длинных полей) */
  fullWidth?: boolean;
}

interface SrmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  fields: SrmField[];
  /** Связанные поля: например, выбор поставщика подставляет supplier_name */
  onFieldChange?: (key: string, value: string, setValue: (key: string, value: string) => void) => void;
  onSubmit: (values: Record<string, string>, files: Record<string, File>) => Promise<void>;
}

/** Универсальная модалка создания сущности раздела «Закупка/МТО». */
export default function SrmFormModal({
  isOpen,
  onClose,
  title,
  submitLabel,
  fields,
  onFieldChange,
  onSubmit,
}: SrmFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        initial[f.key] = f.defaultValue ?? '';
      });
      setValues(initial);
      setFiles({});
    }
    // fields читаются на момент открытия; опции селектов могут догружаться асинхронно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleChange = (key: string, value: string) => {
    setValue(key, value);
    onFieldChange?.(key, value, setValue);
  };

  const isValid = fields.every((f) => {
    if (!f.required) return true;
    if (f.type === 'file') return Boolean(files[f.key]);
    return (values[f.key] ?? '').trim();
  });

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(values, files);
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" className="text-black">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const value = values[field.key] ?? '';
          const wrapperClass = field.fullWidth || field.type === 'textarea' || field.type === 'file' ? 'md:col-span-2' : '';
          if (field.type === 'file') {
            return (
              <div key={field.key} className={wrapperClass}>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'inherit' }}>
                  {field.label}
                  {field.required ? <span className="ml-1" style={{ color: 'var(--error)' }}>*</span> : null}
                </label>
                <input
                  ref={(el) => { fileInputRefs.current[field.key] = el; }}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFiles((prev) => {
                      const next = { ...prev };
                      if (f) next[field.key] = f;
                      else delete next[field.key];
                      return next;
                    });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Paperclip size={13} />}
                  onClick={() => fileInputRefs.current[field.key]?.click()}
                >
                  {files[field.key] ? files[field.key].name : 'Вложить файл'}
                </Button>
              </div>
            );
          }
          if (field.type === 'select') {
            return (
              <Select
                key={field.key}
                className={wrapperClass}
                label={field.label}
                value={value}
                onChange={(e) => handleChange(field.key, e.target.value)}
                options={field.options ?? []}
                placeholder={field.placeholder ?? 'Выберите…'}
                required={field.required}
              />
            );
          }
          if (field.type === 'textarea') {
            return (
              <div key={field.key} className={wrapperClass}>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'inherit' }}>
                  {field.label}
                  {field.required ? <span className="ml-1" style={{ color: 'var(--error)' }}>*</span> : null}
                </label>
                <textarea
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors duration-150"
                  style={{
                    backgroundColor: 'var(--bg-surface-2, #f8fafc)',
                    borderColor: 'var(--border-default, #e2e8f0)',
                  }}
                />
              </div>
            );
          }
          return (
            <Input
              key={field.key}
              className={wrapperClass}
              label={field.label}
              type={field.type ?? 'text'}
              value={value}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              readOnly={field.readOnly}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-2 mt-6">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          Отмена
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!isValid || submitting}>
          {submitting ? 'Сохранение…' : submitLabel}
        </Button>
      </div>
    </Modal>
  );
}
