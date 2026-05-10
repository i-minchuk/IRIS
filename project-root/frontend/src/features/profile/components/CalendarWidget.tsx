import { Calendar, Clock, AlertCircle, Cake } from "lucide-react";
import type { CalendarEvent, Birthday } from "../data/mockProfile";
import { t } from "../i18n/translations";
import type { Language } from "../i18n/translations";

interface Props {
  events: CalendarEvent[];
  birthdays: Birthday[];
  lang: Language;
}

export function CalendarWidget({ events, birthdays, lang }: Props) {
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const todayBirthdays = birthdays.filter(b => b.date === todayStr);
  const upcomingBirthdays = birthdays.filter(b => b.date > todayStr).slice(0, 2);

  const dateLabel = today.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="glass-card neon-border-purple p-5 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-[var(--text-main)]">{t("schedule", lang)}</h3>
      </div>

      <div className="text-sm text-[var(--text-muted)] mb-3">{dateLabel}</div>

      {/* Дни рождения */}
      {(todayBirthdays.length > 0 || upcomingBirthdays.length > 0) && (
        <div className="mb-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Cake className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-400">{t("birthday", lang)}</span>
          </div>
          {todayBirthdays.map(b => (
            <div key={b.id} className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-main)] font-medium">{b.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">{t("todayBirthday", lang)}! 🎉</span>
            </div>
          ))}
          {upcomingBirthdays.map(b => {
            const isTomorrow = b.date === tomorrowStr;
            return (
              <div key={b.id} className="flex items-center gap-2 text-sm mt-1">
                <span className="text-[var(--text-muted)]">{b.name}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {isTomorrow ? t("tomorrow", lang) : `${b.date.slice(3)}.${b.date.slice(0, 2)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* События */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--card-bg)]/50 border border-[var(--border-color)]"
          >
            {event.type === "meeting" ? (
              <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm text-[var(--text-main)] font-medium">{event.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}