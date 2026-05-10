import { Plane, BriefcaseMedical, Building2, FileText } from "lucide-react";
import { useState } from "react";
import { VacationModal } from "./VacationModal";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";

interface Props {
  status: "office" | "vacation" | "sick";
  endDate?: string;
  lang: Language;
}

export function VacationStatus({ status, endDate, lang }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentEndDate, setCurrentEndDate] = useState(endDate);

  const config = {
    office: {
      icon: Building2,
      label: t("inOffice", lang),
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
    },
    vacation: {
      icon: Plane,
      label: t("onVacation", lang),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    sick: {
      icon: BriefcaseMedical,
      label: t("onSickLeave", lang),
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    },
  };

  const current = config[currentStatus];
  const Icon = current.icon;

  const handleSubmit = (data: { type: "vacation" | "sick"; startDate: string; endDate: string }) => {
    setCurrentStatus(data.type);
    setCurrentEndDate(data.endDate);
    alert(`${data.type === "vacation" ? t("vacation", lang) : t("sickLeave", lang)}: ${data.startDate} — ${data.endDate}`);
  };

  return (
    <>
      <div className="glass-card neon-border-purple p-5 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-[var(--text-main)]">{t("availability", lang)}</h3>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${current.bg} ${current.border} border mb-4`}>
          <Icon className={`w-4 h-4 ${current.color}`} />
          <span className={`text-sm font-medium ${current.color}`}>
            {current.label}
            {currentEndDate && ` (${t("until", lang)} ${currentEndDate})`}
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors border border-purple-500/30"
        >
          <FileText className="w-4 h-4" />
          {t("apply", lang)}
        </button>
      </div>

      <VacationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        lang={lang}
      />
    </>
  );
}