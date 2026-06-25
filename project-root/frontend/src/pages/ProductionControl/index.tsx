import { useTheme } from '@/providers/ThemeProvider';
import { IRISRecommendations } from '@/components/IRISRecommendations';import { useTabState } from '@/shared/hooks/useTabState';
import { PageTabs } from '@/shared/components/PageTabs';
import React, { useState, useEffect } from 'react';
import { ProductionProject, MTOItem } from './types/production';
import { useProjects } from './hooks/useProjects';
import { useOperations } from './hooks/useOperations';
import { useWorkloads } from './hooks/useWorkloads';
import { useDocuments } from './hooks/useDocuments';
import { ProductionProjectsList } from './components/ProductionProjectsList';
import { OperationBoard } from './components/OperationBoard';
import { WorkloadHeatmap } from './components/WorkloadHeatmap';
import { DocumentTracker } from './components/DocumentTracker';
import { MTOStatus } from './components/MTOStatus';
import { ProjectCard } from './components/ProjectCard';
import { ProductionStrategyTab } from './components/ProductionStrategy';

import {
  Target, Wrench, Zap, FileText, ShoppingCart, TrendingUp
} from 'lucide-react';

type TabId = 'pipeline' | 'operations' | 'workload' | 'documents' | 'mto' | 'strategy';

const TAB_COLOR = '#F59E0B';

const TABS = [
  { key: 'pipeline' as TabId, label: 'Проекты', icon: <Target size={16} />, color: TAB_COLOR },
  { key: 'operations' as TabId, label: 'Операции', icon: <Wrench size={16} />, color: TAB_COLOR },
  { key: 'workload' as TabId, label: 'Загрузка', icon: <Zap size={16} />, color: TAB_COLOR },
  { key: 'documents' as TabId, label: 'Документы', icon: <FileText size={16} />, color: TAB_COLOR },
  { key: 'mto' as TabId, label: 'МТО', icon: <ShoppingCart size={16} />, color: TAB_COLOR },
  { key: 'strategy' as TabId, label: 'Стратегия', icon: <TrendingUp size={16} />, color: TAB_COLOR },
];

export const ProductionControlPage: React.FC = () => {
  const { projects, loading } = useProjects();
  const { operations } = useOperations();
  const { workCenters } = useWorkloads();
  const { documents, addComment } = useDocuments(projects.map(p => p.id));
  const [mtoItems, setMtoItems] = useState<MTOItem[]>([]);
  const [activeTab, setActiveTab] = useTabState<TabId>('iris_production_tab', 'pipeline');
  const [selectedProject, setSelectedProject] = useState<ProductionProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load MTO data from documents API (documents with type 'spec' serve as MTO specs)
  useEffect(() => {
    if (documents.length > 0) {
      // Transform spec documents into MTO items
      const specs = documents.filter((d) => d.type === 'spec');
      const items: MTOItem[] = specs.map((spec) => ({
        id: `mto-${spec.id}`,
        projectId: spec.projectId,
        specificationId: spec.id,
        itemName: spec.name,
        quantity: 1,
        status: spec.status === 'approved' ? 'spec_submitted' : spec.status === 'overdue' ? 'in_procurement' : 'spec_draft',
        submittedToMTO: spec.actualReady,
        plannedDelivery: spec.plannedReady,
      }));
      setMtoItems(items);
    }
  }, [documents]);

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
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            🏭 Производственный контроль
          </h1>
          <p className="text-xs sm:text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Технологические карты, загрузка, документы, МТО
          </p>
        </div>

        {/* Поиск проекта */}
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
        </div>
      </div>

      {/* IRIS Recommendations */}
      <div className="px-4 sm:px-6 py-2" style={{ background: 'var(--iris-bg-surface)' }}>
        <IRISRecommendations page="production" isDark={useTheme().theme === 'dark' || useTheme().theme === 'midnight' || useTheme().theme === 'contrast'} />
      </div>

      {/* Табы — PageTabs с округлыми вкладками */}
      <div className="px-4 sm:px-6 py-2"
        style={{ background: 'var(--iris-bg-surface)', borderBottom: '1px solid var(--iris-border-subtle)' }}
      >
        <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} color={TAB_COLOR} />
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-hidden flex">
        {/* Основная зона */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'pipeline' && (
            <ProductionProjectsList
              projects={filteredProjects}
              loading={loading}
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
              onAddComment={addComment}
            />
          )}
          {activeTab === 'mto' && (
            <MTOStatus
              mtoItems={mtoItems}
              projects={filteredProjects}
            />
          )}
          {activeTab === 'strategy' && (
            <ProductionStrategyTab />
          )}
        </div>

        {/* Правая панель — карточка проекта для ответа по телефону */}
        {activeTab !== 'strategy' && (
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
        )}
      </div>
    </div>
  );
};



export default ProductionControlPage;
