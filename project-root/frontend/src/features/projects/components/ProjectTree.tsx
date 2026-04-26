import React, { useState } from 'react';
import type { ProjectTree, ProjectTreeDoc, ProjectTreeSection, ProjectTreeKit, ProjectTreeStage } from '../api/projects';

interface Props {
  tree: ProjectTree;
  selectedDocId?: number;
  onSelectDoc: (doc: ProjectTreeDoc) => void;
}

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const DocIcon: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, string> = {
    KM: 'text-blue-500',
    PD: 'text-emerald-500',
    AK: 'text-amber-500',
    EM: 'text-purple-500',
    TK: 'text-cyan-500',
  };
  return <span className={`text-xs font-bold ${colors[type] || 'text-gray-500 dark:text-gray-400'}`}>{type}</span>;
};

const CrsBadge: React.FC<{ code?: string }> = ({ code }) => {
  if (!code) return null;
  const colors: Record<string, string> = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-yellow-100 text-yellow-700',
    C: 'bg-red-100 text-red-700',
  };
  return <span className={`text-[10px] px-1 rounded ${colors[code] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{code}</span>;
};

export const ProjectTreeView: React.FC<Props> = ({ tree, selectedDocId, onSelectDoc }) => {
  const [openStages, setOpenStages] = useState<Set<number>>(new Set());
  const [openKits, setOpenKits] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) => {
    set((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="text-sm">
      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2 px-1 truncate" title={tree.name}>
        {tree.name}
      </div>
      {tree.stages.map((stage: ProjectTreeStage) => (
        <div key={stage.id}>
          <button
            onClick={() => toggle(setOpenStages, stage.id)}
            className="flex items-center w-full gap-1 px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left"
          >
            <Chevron open={openStages.has(stage.id)} />
            <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{stage.name}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">{stage.code}</span>
          </button>
          {openStages.has(stage.id) && (
            <div className="ml-3 border-l border-gray-200 dark:border-gray-700 pl-1">
              {stage.kits.map((kit: ProjectTreeKit) => (
                <div key={kit.id}>
                  <button
                    onClick={() => toggle(setOpenKits, kit.id)}
                    className="flex items-center w-full gap-1 px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left"
                  >
                    <Chevron open={openKits.has(kit.id)} />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{kit.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">{kit.code}</span>
                  </button>
                  {openKits.has(kit.id) && (
                    <div className="ml-3 border-l border-gray-200 dark:border-gray-700 pl-1">
                      {kit.sections.map((section: ProjectTreeSection) => (
                        <div key={section.id}>
                          <button
                            onClick={() => toggle(setOpenSections, section.id)}
                            className="flex items-center w-full gap-1 px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-left"
                          >
                            <Chevron open={openSections.has(section.id)} />
                            <span className="text-gray-600 dark:text-gray-400 truncate">{section.name}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">{section.code}</span>
                          </button>
                          {openSections.has(section.id) && (
                            <div className="ml-3">
                              {section.documents.map((doc: ProjectTreeDoc) => (
                                <button
                                  key={doc.id}
                                  onClick={() => onSelectDoc(doc)}
                                  className={`flex items-center w-full gap-1.5 px-1 py-0.5 rounded text-left ${selectedDocId === doc.id ? 'bg-emerald-50 border-emerald-200 border' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                >
                                  <DocIcon type={doc.doc_type} />
                                  <span className="truncate text-gray-700 dark:text-gray-300">{doc.number}</span>
                                  <CrsBadge code={doc.crs_code} />
                                </button>
                              ))}
                              {section.documents.length === 0 && (
                                <div className="px-1 py-0.5 text-[10px] text-gray-400 dark:text-gray-500">Нет документов</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
