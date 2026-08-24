export interface GlossaryTerm {
  term: string;
  definition: string;
  companyUsage: string;
  whereFound: string;
}

export interface GlossaryDepartment {
  id: string;
  name: string;
  terms: GlossaryTerm[];
}

// Статичное наполнение удалено (зачистка демо-данных).
// Глоссарий будет наполняться из реального источника данных.
export const GLOSSARY_DATA: GlossaryDepartment[] = [];
