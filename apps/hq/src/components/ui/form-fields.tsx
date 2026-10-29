// Shared editor-form building blocks, so every form labels, prefixes and
// explains its inputs the same way.

export type FieldProps = {
  label: string;
  name: string;
  error?: string;
  /** Fixed text shown inside the input, before the value (e.g. "@", "MVR"). */
  prefix?: string;
  hint?: string;
  /** Spans both columns of a `.form-grid`. */
  wide?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "prefix">;

export function Field({
  label,
  name,
  error,
  prefix,
  hint,
  wide = false,
  ...props
}: FieldProps) {
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span>{label}</span>
      <div className={prefix ? "input-with-prefix" : undefined}>
        {prefix ? <span>{prefix}</span> : null}
        <input name={name} aria-invalid={Boolean(error)} {...props} />
      </div>
      {error ? (
        <small className="field-error">{error}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}

export function NotesSection({
  defaultValue,
  error,
}: {
  defaultValue?: string | null;
  error?: string;
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">
        <p className="kicker">Context</p>
        <h2>Notes</h2>
        <p>Keep only useful operational context here.</p>
      </div>
      <label className="field">
        <span>Notes</span>
        <textarea
          name="notes"
          rows={5}
          maxLength={2000}
          defaultValue={defaultValue ?? ""}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <small className="field-error">{error}</small>
        ) : (
          <small>Optional · maximum 2,000 characters</small>
        )}
      </label>
    </div>
  );
}
