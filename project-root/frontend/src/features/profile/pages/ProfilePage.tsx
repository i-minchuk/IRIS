import { ProfileCard } from "../components/ProfileCard";
import { SignatureBlock } from "../components/SignatureBlock";
import { CalendarWidget } from "../components/CalendarWidget";
import { VacationStatus } from "../components/VacationStatus";
import { MentorshipBlock } from "../components/MentorshipBlock";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ApiTokensBlock } from "../components/ApiTokensBlock";
import { SystemInfo } from "../components/SystemInfo";
import { getMockProfile } from "../data/mockProfile";
import { useLanguageContext } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { useAppVersion } from "../hooks/useAppVersion";

export function ProfilePage() {
  const { lang } = useLanguageContext();
  const user = getMockProfile(lang);
  const { version } = useAppVersion();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-x-hidden">
      <div className="w-full px-4 py-4 md:px-8 md:py-6 lg:px-12 lg:py-8">
        
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--text-main)] tracking-tight">
            {t("profile", lang)}
          </h1>
          <span className="text-xs md:text-sm text-purple-400 font-mono bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            v{version}
          </span>
        </div>

        <div className="mb-6 md:mb-8">
          <ProfileCard
            name={user.name}
            role={user.role}
            department={user.department}
            email={user.email}
            lang={lang}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          <SignatureBlock status={user.signatureStatus} lang={lang} />
          <CalendarWidget 
            events={user.upcomingEvents} 
            birthdays={user.birthdays} 
            lang={lang} 
          />
          <VacationStatus 
            status={user.vacationStatus} 
            endDate={user.vacationEndDate} 
            lang={lang} 
          />
          <MentorshipBlock 
            mentor={user.mentor} 
            mentees={user.mentees} 
            lang={lang} 
          />
          <LanguageSwitcher />
          <ApiTokensBlock tokens={user.apiTokens} lang={lang} />
          <SystemInfo lang={lang} />
        </div>

        <div className="mt-8 md:mt-12 py-6 border-t border-[var(--border-color)] text-center">
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            ДокПоток IRIS — {lang === "ru" ? "Система управления инженерной документацией" : "Engineering Document Management System"}
          </p>
          <p className="text-xs text-[var(--text-muted)]/60 mt-2">
            © 2026 ДокПоток IRIS. {lang === "ru" ? "Все права защищены." : "All rights reserved."}
          </p>
        </div>
        
      </div>
    </div>
  );
}