import type { Language } from "../i18n/translations";


export interface ApiToken {
  id: string;
  name: string;
  createdAt: string;
  last4: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "meeting";
}

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  email: string;
  avatar?: string;
  signatureStatus: "active" | "inactive";
  vacationStatus: "office" | "vacation" | "sick";
  vacationEndDate?: string;
  mentor?: string;
  mentees?: string[];
  language: "ru" | "en";
  apiTokens: ApiToken[];
  upcomingEvents: CalendarEvent[];
  birthdays: Birthday[],
}

export interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD
  role: string;
  avatar?: string;
}

export function getMockProfile(lang: Language): UserProfile {
  if (lang === "en") {
    return {
      name: "Novikova A.V.",
      role: "Chief Engineer",
      department: "Technical Documentation Department",
      email: "a.novikova@dokpotok.ru",
      signatureStatus: "active",
      vacationStatus: "office",
      mentor: "Ivanov P.S. (Lead Engineer)",
      mentees: ["Petrov A.M.", "Sidorov V.K."],
      language: "en",
      apiTokens: [
        { id: "1", name: "1C Integration", createdAt: "2026-04-15", last4: "a7f2" },
        { id: "2", name: "Backend API", createdAt: "2026-03-20", last4: "b3c9" },
      ],
      upcomingEvents: [
        { id: "1", title: "ITD Approval — AEC-2 Project", date: "2026-05-15", type: "deadline" },
        { id: "2", title: "Meeting with Client", date: "2026-05-18 10:00", type: "meeting" },
        { id: "3", title: "KMD Revision Submission", date: "2026-05-22", type: "deadline" },
      ],
      birthdays: [
        { id: "b1", name: "Ivanov P.S.", date: "05-15", role: "Lead Engineer" },
        { id: "b2", name: "Petrova A.M.", date: "05-11", role: "Reinforcement Engineer" },
        { id: "b3", name: "Sidorov V.K.", date: "06-01", role: "Junior Engineer" },
        { id: "b4", name: "Novikova A.V.", date: "12-25", role: "Chief Engineer" },
      ],
    };
  }

  // Russian (default)
  return {
    name: "Новикова А.В.",
    role: "Главный инженер",
    department: "Отдел технической документации",
    email: "a.novikova@dokpotok.ru",
    signatureStatus: "active",
    vacationStatus: "office",
    mentor: "Иванов П.С. (ведущий инженер)",
    mentees: ["Петров А.М.", "Сидоров В.К."],
    language: "ru",
    apiTokens: [
      { id: "1", name: "Интеграция с 1С", createdAt: "2026-04-15", last4: "a7f2" },
      { id: "2", name: "API бэкенда", createdAt: "2026-03-20", last4: "b3c9" },
    ],
    upcomingEvents: [
      { id: "1", title: "Согласование ИТД — Проект АЭС-2", date: "2026-05-15", type: "deadline" },
      { id: "2", title: "Совещание с заказчиком", date: "2026-05-18 10:00", type: "meeting" },
      { id: "3", title: "Сдача ревизии КМД", date: "2026-05-22", type: "deadline" },
    ],
    birthdays: [
      { id: "b1", name: "Иванов П.С.", date: "05-15", role: "Ведущий инженер" },
      { id: "b2", name: "Петрова А.М.", date: "05-11", role: "Инженер КЖ" },
      { id: "b3", name: "Сидоров В.К.", date: "06-01", role: "Младший инженер" },
      { id: "b4", name: "Новикова А.В.", date: "12-25", role: "Главный инженер" },
    ],
  };
}