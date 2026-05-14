import { FileSignature, CheckCircle, XCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";

interface Props {
  status: "active" | "inactive";
  lang: Language;
}

export function SignatureBlock({ status, lang }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = status === "active" || fileName !== null;

  const handleUpload = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="glass-card neon-border-purple p-5 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <FileSignature className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-[var(--text-main)]">{t("signature", lang)}</h3>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {isActive ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">
              {fileName ? `${fileName}` : t("signatureActive", lang)}
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{t("signatureInactive", lang)}</span>
          </>
        )}
      </div>

      <input
        type="file"
        ref={inputRef}
        accept=".cer,.pfx,.p12"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={handleUpload}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors border border-purple-500/30"
      >
        <Upload className="w-4 h-4" />
        {fileName ? t("replaceCertificate", lang) : t("uploadCertificate", lang)}
      </button>

      {fileName && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          .cer, .pfx, .p12
        </p>
      )}
    </div>
  );
}