'use client';
import { useState } from 'react';
import { Edit2, Trash2, X, Mail, Phone, Calendar, Hash, FileText } from 'lucide-react';
import styles from '../app/(crm)/crm.module.css';
import { StatusBadge } from './DataTable';

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  /** If set, this field's options are looked up from optionsByDependency using the value of `dependsOn` field */
  dependsOn?: string;
  /** Map of dependency value → options list */
  optionsByDependency?: Record<string, string[]>;
  required?: boolean;
  span?: 1 | 2;
  placeholder?: string;
  highlight?: boolean;
  format?: (value: string | number) => string;
};

type Values = Record<string, string | number>;

type EntityDrawerProps = {
  open: boolean;
  mode: 'view' | 'edit' | 'create';
  entity: Values | null;
  fields: FieldConfig[];
  titleField: string;
  statusField?: string;
  statusColors?: Record<string, { bg: string; text: string }>;
  entityLabel: string;
  onClose: () => void;
  onEdit: () => void;
  onSubmit: (values: Values) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  saving?: boolean;
  canEdit?: boolean;   // defaults to true
  canDelete?: boolean; // defaults to true
};

const fieldIcon = (field: FieldConfig) => {
  if (field.type === 'email') return Mail;
  if (field.type === 'tel') return Phone;
  if (field.type === 'date') return Calendar;
  if (field.type === 'textarea') return FileText;
  return Hash;
};

function emptyValues(fields: FieldConfig[]): Values {
  const values: Values = {};
  for (const f of fields) {
    values[f.key] = f.type === 'select' ? (f.options?.[0] ?? '') : f.type === 'number' ? 0 : '';
  }
  return values;
}

function EntityForm({
  fields,
  entity,
  onSubmit,
}: {
  fields: FieldConfig[];
  entity: Values | null;
  onSubmit: (values: Values) => void;
}) {
  const [values, setValues] = useState<Values>(() => {
    if (!entity) return emptyValues(fields);
    const next: Values = {};
    for (const f of fields) next[f.key] = entity[f.key] ?? (f.type === 'number' ? 0 : '');
    return next;
  });

  const setField = (key: string, val: string | number) =>
    setValues(v => {
      const next = { ...v, [key]: val };
      // When a parent field changes, clear dependent children so stale values don't persist
      for (const f of fields) {
        if (f.dependsOn === key) next[f.key] = '';
      }
      return next;
    });

  const resolveOptions = (f: FieldConfig): string[] => {
    if (f.dependsOn && f.optionsByDependency) {
      const parentVal = values[f.dependsOn] as string;
      return f.optionsByDependency[parentVal] ?? [];
    }
    return f.options ?? [];
  };

  return (
    <form
      id="entityForm"
      onSubmit={e => { e.preventDefault(); onSubmit(values); }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {fields.map(f => {
          const opts = resolveOptions(f);
          return (
            <div key={f.key} style={{ gridColumn: f.span === 2 || f.type === 'textarea' ? '1 / -1' : undefined }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={values[f.key] as string}
                  onChange={e => setField(f.key, e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }}
                >
                  {!f.required && <option value="">— Select —</option>}
                  {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={values[f.key] as string}
                  onChange={e => setField(f.key, e.target.value)}
                  required={f.required}
                  placeholder={f.placeholder}
                  rows={4}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type={f.type}
                  value={values[f.key] as string | number}
                  onChange={e => setField(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  required={f.required}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px', border: '1px solid #E5E9F2', borderRadius: '8px' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </form>
  );
}

export default function EntityDrawer({
  open,
  mode,
  entity,
  fields,
  titleField,
  statusField,
  statusColors = {},
  entityLabel,
  onClose,
  onEdit,
  onSubmit,
  onDelete,
  saving,
  canEdit = true,
  canDelete = true,
}: EntityDrawerProps) {
  if (!open) return null;

  const handleDelete = () => {
    if (window.confirm(`Delete this ${entityLabel.toLowerCase()}? This cannot be undone.`)) {
      onDelete();
    }
  };

  const title = mode === 'create' ? `Add ${entityLabel}` : mode === 'edit' ? `Edit ${entityLabel}` : entity ? String(entity[titleField]) : entityLabel;
  const status = statusField && entity ? String(entity[statusField]) : null;

  const highlightFields = fields.filter(f => f.highlight);
  const listFields = fields.filter(f => !f.highlight && f.key !== titleField && f.key !== statusField);

  return (
    <div className={styles.rightDrawerOverlay} onClick={onClose}>
      <div className={styles.rightDrawer} onClick={e => e.stopPropagation()}>
        <div className={styles.rightDrawerHeader}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {mode === 'view' && entity && (
              <>
                {canEdit && <Edit2 size={20} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={onEdit} />}
                {canDelete && <Trash2 size={20} color="#EF4444" style={{ cursor: 'pointer' }} onClick={handleDelete} />}
              </>
            )}
            <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
          </div>
        </div>

        <div className={styles.rightDrawerContent}>
          {mode === 'view' && entity ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>{String(entity[titleField])}</h1>
                {status && <StatusBadge status={status} colors={statusColors} />}
              </div>

              {highlightFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {highlightFields.map(f => {
                    const Icon = fieldIcon(f);
                    return (
                      <div key={f.key} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>{f.label}</h3>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={18} color="#3B82F6" /> {entity[f.key] != null && f.format ? f.format(entity[f.key] as string | number) : String(entity[f.key] ?? '—')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {listFields.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', borderBottom: '1px solid #E5E9F2', paddingBottom: '8px' }}>Details</h3>
                  {listFields.map(f => {
                    const Icon = fieldIcon(f);
                    return (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#475569' }}>
                        <Icon size={18} color="#3B82F6" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>{f.label}</div>
                          <div style={{ fontSize: '15px', whiteSpace: 'pre-wrap' }}>{entity[f.key] != null && f.format ? f.format(entity[f.key] as string | number) : String(entity[f.key] ?? '—')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <EntityForm key={`${mode}-${entity?.id ?? 'new'}`} fields={fields} entity={entity} onSubmit={onSubmit} />
          )}
        </div>

        {mode !== 'view' && (
          <div className={styles.rightDrawerFooter}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', background: 'white', border: '1px solid #E5E9F2', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" form="entityForm" disabled={saving} className={styles.quickActionBtnPrimary} style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : `Add ${entityLabel}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
