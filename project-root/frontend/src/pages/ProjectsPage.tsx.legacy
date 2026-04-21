import { WorkspaceLayout, ExplorerSidebar, InspectorPanel, BottomPanel, EditorArea, useWorkspaceStore } from '../components/workspace';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import type { Remark } from '../components/RemarksPanel';

export default function ProjectsPage() {
  const { addTab } = useWorkspaceStore();
  const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);

  const handleNewTab = () => {
    addTab({
      id: `new-doc-${Date.now()}`,
      type: 'document',
      title: 'Новый документ',
      subtitle: 'Черновик',
      icon: <FileText size={14} />,
      isDirty: true,
    });
  };

  const handleNewRevision = () => {
    // Обработчик создания новой ревизии
    console.log('Создать новую ревизию');
  };

  const handleApprove = () => {
    // Обработчик направления на согласование
    console.log('Направить на согласование');
  };

  const handleVerify = () => {
    // Обработчик направления на проверку
    console.log('Направить на проверку');
  };

  const documentData = {
    code: 'КМ1-А01',
    revision: 'B02',
    status: 'approved' as const,
    author: 'Иванов А.В.',
    reviewer: 'Петров С.К.',
    approver: 'Сидоров В.М.',
    releaseDate: '2025-01-15',
    nextDeadline: '2025-04-15',
    dependencies: ['КМ1-А00'],
    totalRemarks: 3,
    openRemarks: 1,
  };

  return (
    <WorkspaceLayout
      explorer={<ExplorerSidebar />}
      inspector={<InspectorPanel selectedRemark={selectedRemark} onSelectRemark={setSelectedRemark} />}
      bottomPanel={<BottomPanel />}
      documentData={documentData}
      onNewTab={handleNewTab}
      onNewRevision={handleNewRevision}
      onApprove={handleApprove}
      onVerify={handleVerify}
    >
      <EditorArea />
    </WorkspaceLayout>
  );
}
