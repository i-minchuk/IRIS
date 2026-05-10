import { ProfileCard } from "../components/ProfileCard";
import { SignatureBlock } from "../components/SignatureBlock";
import { CalendarWidget } from "../components/CalendarWidget";
import { VacationStatus } from "../components/VacationStatus";
import { MentorshipBlock } from "../components/MentorshipBlock";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ApiTokensBlock } from "../components/ApiTokensBlock";
import { getMockProfile } from "../data/mockProfile";
import { useLanguageContext } from "../i18n/LanguageContext";
import { t } from "../i18n/translations";
import { SystemInfo } from "../components/SystemInfo";
export function ProfilePage() {
  const { lang } = useLanguageContext();
  const user = getMockProfile(lang);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-main)]">{t("profile", lang)}</h1>
          <span className="text-xs text-[var(--text-muted)]">{t("id")}: 7429</span>
        </div>

        <ProfileCard
          name={user.name}
          role={user.role}
          department={user.department}
          email={user.email}
          lang={lang}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}