import React, { useState } from 'react';
import { ProductionProject } from './types/production';
import { useProjects } from './hooks/useProjects';
import { useOperations } from './hooks/useOperations';
import { useWorkloads } from './hooks/useWorkloads';
import { useDocuments } from './hooks/useDocuments';
import { mockMTO } from './mocks/productionData';
import { ProjectPipeline } from './components/ProjectPipeline';
import { OperationBoard } from './components/OperationBoard';
import { WorkloadHeatmap } from './components/WorkloadHeatmap';
import { DocumentTracker } from './components/DocumentTracker';
import { MTOStatus } from './components/MTOStatus';
import { ProjectCard } from './components/ProjectCard';

type TabId = 'pipeline' | 'operations' | 'workload' | 'documents' | 'mto';

export const ProductionControlPage: React.FC = () => {
  const { projects } = useProjects();
  const { operations } = useOperations();
  const { workCenters } = useWorkloads();
  const { documents } = useDocuments();
  const [mtoItems] = useState(mockMTO);

  const [activeTab, setActiveTab] = useState<TabId>('pipeline');
  const [selectedProject, setSelectedProject] = useState<ProductionProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'pipeline' as TabId, label: '🎯 Портфель', color: '#3b82f6' },
    { id: 'operations' as TabId, label: '🔧 Операции', color: '#06b6d4' },
    { id: 'workload' as TabId, label: '⚡ Загрузка', color: '#f59e0b' },
    { id: 'documents' as TabId, label: '📄 Документы', color: '#8b5cf6' },
    { id: 'mto' as TabId, label: '🛒 МТО', color: '#22c55e' },
  ];

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProject = (p: ProductionProject) => {
    setSelectedProject(p);
  };

  return (
    <div className="h-[calc(100vh-180px)] min-h-[600px] flex flex-col" style={{ background: 'var(--iris-bg-app)', color: 'var(--text-primary)' }}>
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3"
        style={{ background: 'var(--iris-bg-surface)', borderBottom: '1px solid var(--iris-border-subtle)' }}
      >
        <div>
          <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            🏭 Производственный контроль
          </h1>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Технологические карты, загрузка, документы, МТО
          </p>
        </div>

        {/* Поиск проекта для быстрого ответа */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍 Поиск по проекту / заказчику..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm w-64 transition-colors"
            style={{
              background: 'var(--iris-bg-app)',
              border: '1px solid var(--iris-border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110"
            style={{
              background: 'var(--iris-accent-cyan)',
              color: '#ffffff',
              boxShadow: '0 0 12px var(--iris-glow-cyan)',
            }}
            onClick={() => {
              if (selectedProject) {
                alert(`📞 Ответ для ${selectedProject.customer}:\n\n«Проект ${selectedProject.name} (${selectedProject.code}) на стадии ${selectedProject.currentOperation || '—'}, готовность ${selectedProject.progressPercent}%. Следующий этап — ${selectedProject.nextMilestone || '—'} (${selectedProject.nextMilestoneDate ? new Date(selectedProject.nextMilestoneDate).toLocaleDateString('ru-RU') : '—'})»`);
              }
            }}
          >
            📞 Ответить заказчику
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 px-4 sm:px-6 py-2"
        style={{ background: 'var(--iris-bg-surface)', borderBottom: '1px solid var(--iris-border-subtle)' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? ''
                : 'hover:brightness-110'
            }`}
            style={activeTab === tab.id ? { backgroundColor: tab.color, boxShadow: `0 0 12px ${tab.color}40`, color: '#ffffff' } : { backgroundColor: 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-hidden flex">
        {/* Основная зона */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'pipeline' && (
            <ProjectPipeline
              projects={filteredProjects}
              onSelect={handleSelectProject}
            />
          )}
          {activeTab === 'operations' && (
            <OperationBoard
              operations={operations}
              projects={filteredProjects}
            />
          )}
          {activeTab === 'workload' && (
            <WorkloadHeatmap
              workCenters={workCenters}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentTracker
              documents={documents}
              projects={filteredProjects}
            />
          )}
          {activeTab === 'mto' && (
            <MTOStatus
              mtoItems={mtoItems}
              projects={filteredProjects}
            />
          )}
        </div>

        {/* Правая панель — карточка проекта для ответа по телефону */}
        <div className="w-80 lg:w-96 border-l overflow-y-auto hidden lg:block"
          style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-surface)' }}
        >
          <ProjectCard
            project={selectedProject}
            operations={operations}
            documents={documents}
            mtoItems={mtoItems}
          />
        </div>
      </div>
    </div>
  );
};
