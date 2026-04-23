import React, { useEffect, useRef, useState } from 'react';
import { getDocument, updateDocument, createDocument, createRevision, createRemark, updateRemarkStatus, type DocumentDetail, type Remark } from '@/api/documents';
import { DocumentEditor } from '../components/DocumentEditor';
import { DocumentDetailPanels } from '../components/DocumentDetailPanels';
import { projectsApi, type Project, type ProjectTree, type ProjectTreeDoc } from '@/features/projects/api/projects';
import { ProjectTreeView } from '@/features/projects/components/ProjectTree';
import { VariablePanel } from '@/features/variables/components/VariablePanel';
import { variablesApi } from '@/features/variables/api/variables';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCollaborationStore } from '@/features/collaboration/store/collaborationStore';
import { lockDocument, unlockDocument } from '@/features/collaboration/api/lock';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700',
  note: 'bg-gray-100 text-gray-600',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  crs_pending: 'bg-purple-100 text-purple-700',
  crs_approved: 'bg-emerald-100 text-emerald-700',
};

export const DocumentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const collab = useCollaborationStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [tree, setTree] = useState<ProjectTree | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newDoc, setNewDoc] = useState<{ number: string; name: string; doc_type: string; project_id: number; section_id?: number }>({ number: '', name: '', doc_type: 'KM', project_id: 1 });
  const [activeTab, setActiveTab] = useState<'info' | 'editor' | 'revisions' | 'remarks' | 'variables' | 'preview'>('info');
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [newRemark, setNewRemark] = useState({ title: '', description: '', severity: 'minor' as string });
  const [showRemarkForm, setShowRemarkForm] = useState(false);
  const [renderedContent, setRenderedContent] = useState('');
  const [editorReadOnly, setEditorReadOnly] = useState(false);
  const [lockBanner, setLockBanner] = useState<string | null>(null);
  const lockedDocRef = useRef<number | null>(null);

  useEffect(() => {
    projectsApi.list().then((res: { data: Project[] }) => {
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    projectsApi.getTree(selectedProjectId)
      .then((res: { data: ProjectTree }) => setTree(res.data))
      .catch(() => setTree(null))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  // Lock / unlock on tab change
  useEffect(() => {
    const manageLock = async () => {
      if (!selectedDoc || !user) return;
      const docId = selectedDoc.id;

      // Leaving editor: unlock current if any
      if (activeTab !== 'editor' && lockedDocRef.current) {
        try {
          await unlockDocument(lockedDocRef.current);
          collab.sendMessage({ type: 'unsubscribe_document', payload: { document_id: lockedDocRef.current } });
        } catch {}
        lockedDocRef.current = null;
        setEditorReadOnly(false);
        setLockBanner(null);
        return;
      }

      // Entering editor
      if (activeTab === 'editor') {
        // If already locked by someone else
        if (selectedDoc.locked_by_user && selectedDoc.locked_by_user.id !== user.id) {
          setEditorReadOnly(true);
          setLockBanner(`🔒 Документ занят: ${selectedDoc.locked_by_user.full_name}`);
          lockedDocRef.current = null;
          collab.sendMessage({ type: 'subscribe_document', payload: { document_id: docId } });
          return;
        }

        // Try to lock
        try {
          await lockDocument(docId);
          lockedDocRef.current = docId;
          setEditorReadOnly(false);
          setLockBanner(null);
          collab.sendMessage({ type: 'subscribe_document', payload: { document_id: docId } });
        } catch (err: any) {
          if (err?.response?.status === 409) {
            const locker = err?.response?.data?.detail?.locked_by || 'другой пользователь';
            setEditorReadOnly(true);
            setLockBanner(`🔒 Документ занят: ${locker}`);
          }
          collab.sendMessage({ type: 'subscribe_document', payload: { document_id: docId } });
        }
      }
    };
    manageLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedDoc?.id]);

  // Presence update on document change
  useEffect(() => {
    if (collab.isConnected && user) {
      collab.sendMessage({
        type: 'presence_update',
        payload: { page: '/documents', document_id: selectedDoc?.id || null },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collab.isConnected, selectedDoc?.id]);

  const handleSelectDoc = async (doc: ProjectTreeDoc) => {
    // Unlock previous document if locked
    if (lockedDocRef.current && lockedDocRef.current !== doc.id) {
      try {
        await unlockDocument(lockedDocRef.current);
        collab.sendMessage({ type: 'unsubscribe_document', payload: { document_id: lockedDocRef.current } });
      } catch {}
      lockedDocRef.current = null;
    }
    setEditorReadOnly(false);
    setLockBanner(null);
    const detail = await getDocument(doc.id);
    setSelectedDoc(detail);
    setActiveTab('info');
  };

  const handleCreateDoc = async () => {
    await createDocument(newDoc);
    setShowCreate(false);
    setNewDoc({ number: '', name: '', doc_type: 'KM', project_id: selectedProjectId || 1 });
    if (selectedProjectId) {
      const res = await projectsApi.getTree(selectedProjectId);
      setTree(res.data);
    }
  };

  const handleAddRemark = async () => {
    if (!selectedDoc) return;
    await createRemark(selectedDoc.id, { ...newRemark, remark_type: 'internal' });
    setShowRemarkForm(false);
    setNewRemark({ title: '', description: '', severity: 'minor' });
    handleSelectDoc({ id: selectedDoc.id, number: selectedDoc.number, name: selectedDoc.name, doc_type: selectedDoc.doc_type, status: selectedDoc.status, crs_code: selectedDoc.crs_code });
  };

  const handleCloseRemark = async (remarkId: number) => {
    await updateRemarkStatus(remarkId, { status: 'resolved_confirmed', response: 'Исправлено' });
    if (selectedDoc) handleSelectDoc({ id: selectedDoc.id, number: selectedDoc.number, name: selectedDoc.name, doc_type: selectedDoc.doc_type, status: selectedDoc.status, crs_code: selectedDoc.crs_code });
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Документы</h2>
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Новый документ</Button>
      </div>

      {/* Main content: Tree + Details */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left: Project Tree */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 overflow-auto p-3">
          {loading && <p className="text-gray-500 text-sm">Загрузка…</p>}
          {tree && (
            <ProjectTreeView
              tree={tree}
              selectedDocId={selectedDoc?.id}
              onSelectDoc={handleSelectDoc}
            />
          )}
          {!loading && !tree && (
            <p className="text-gray-400 text-sm">Выберите проект</p>
          )}
        </div>

        {/* Right: Document details */}
        <div className="col-span-9 bg-white rounded-lg border border-gray-200 overflow-auto flex flex-col">
          {selectedDoc ? (
            <>
              {/* Header */}
              <div className="border-b border-gray-200 px-4 py-3 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedDoc.number}</h3>
                    <p className="text-sm text-gray-500">{selectedDoc.name}</p>
                  </div>
                  <Badge className={statusColors[selectedDoc.status] || ''}>{selectedDoc.status}</Badge>
                </div>
                <div className="flex space-x-4 mt-3">
                  {(['info', 'editor', 'revisions', 'remarks', 'variables', 'preview'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={async () => {
                        setActiveTab(tab);
                        if (tab === 'preview') {
                          try {
                            const res = await variablesApi.renderDocument(selectedDoc.id);
                            setRenderedContent(res.data.rendered);
                          } catch {
                            setRenderedContent('Ошибка рендеринга');
                          }
                        }
                        if (tab === 'editor') {
                          const body = (selectedDoc.content as any)?.body || (selectedDoc.content as any)?.template || '<p></p>';
                          setEditorContent(body);
                        }
                      }}
                      className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab === 'info' && 'Информация'}
                      {tab === 'editor' && 'Редактор'}
                      {tab === 'revisions' && `Ревизии (${selectedDoc.revisions?.length || 0})`}
                      {tab === 'remarks' && `Замечания (${selectedDoc.remarks?.length || 0})`}
                      {tab === 'variables' && 'Переменные'}
                      {tab === 'preview' && 'Предпросмотр'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 overflow-auto min-h-0">
                {activeTab === 'editor' && selectedDoc && (
                  <div className="h-full flex flex-col">
                    {lockBanner && (
                      <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                        {lockBanner}
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">
                        {saveStatus === 'saved' && '💾 Сохранено'}
                        {saveStatus === 'saving' && '⏳ Сохранение...'}
                        {saveStatus === 'unsaved' && '● Не сохранено'}
                      </span>
                    </div>
                    <div className="flex-1 min-h-0">
                      <DocumentEditor
                        content={editorContent}
                        readOnly={editorReadOnly}
                        onChange={async (html) => {
                          if (editorReadOnly) return;
                          setSaveStatus('unsaved');
                          setEditorContent(html);
                          // debounced save
                          setTimeout(async () => {
                            try {
                              setSaveStatus('saving');
                              await updateDocument(selectedDoc.id, {
                                content: { ...(selectedDoc.content as any), body: html },
                              });
                              setSaveStatus('saved');
                            } catch {
                              setSaveStatus('unsaved');
                            }
                          }, 1500);
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Тип:</span> <span className="ml-2 font-medium">{selectedDoc.doc_type}</span></div>
                      <div><span className="text-gray-500">Автор ID:</span> <span className="ml-2 font-medium">{selectedDoc.author_id}</span></div>
                      <div><span className="text-gray-500">CRS код:</span> <span className="ml-2 font-medium">{selectedDoc.crs_code || '—'}</span></div>
                      <div><span className="text-gray-500">CRS утверждён:</span> <span className="ml-2 font-medium">{selectedDoc.crs_approved_date || '—'}</span></div>
                      {selectedDoc.locked_by_user && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Блокировка:</span>{' '}
                          <span className="ml-2 font-medium text-amber-600">
                            🔒 {selectedDoc.locked_by_user.full_name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Переменные документа</h4>
                      <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto">{JSON.stringify(selectedDoc.variables_snapshot, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {activeTab === 'revisions' && (
                  <div className="space-y-3">
                    {selectedDoc.revisions?.map((rev) => (
                      <div key={rev.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">Ревизия {rev.number}</span>
                          <Badge className={rev.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{rev.status}</Badge>
                        </div>
                        {rev.trigger_type && <p className="text-xs text-gray-400 mt-1">Причина: {rev.trigger_type}</p>}
                      </div>
                    ))}
                    {!selectedDoc.revisions?.length && <p className="text-gray-400">Нет ревизий</p>}
                    <Button size="sm" onClick={async () => {
                      const num = prompt('Номер ревизии (A, B, C...):');
                      if (num) {
                        await createRevision(selectedDoc.id, { number: num });
                        handleSelectDoc({ id: selectedDoc.id, number: selectedDoc.number, name: selectedDoc.name, doc_type: selectedDoc.doc_type, status: selectedDoc.status, crs_code: selectedDoc.crs_code });
                      }
                    }}>+ Добавить ревизию</Button>
                  </div>
                )}

                {activeTab === 'remarks' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setShowRemarkForm(true)}>+ Добавить замечание</Button>
                    </div>
                    {selectedDoc.remarks?.map((remark: Remark) => (
                      <div key={remark.id} className={`border rounded-lg p-3 ${severityColors[remark.severity] || ''} bg-opacity-20`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm">{remark.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{(remark as any).description || ''}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={severityColors[remark.severity] || ''}>{remark.severity}</Badge>
                            {remark.status !== 'resolved_confirmed' && (
                              <Button size="sm" variant="ghost" onClick={() => handleCloseRemark(remark.id)}>Закрыть</Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 flex justify-between">
                          <span>{remark.remark_type}</span>
                          <span>{remark.status}</span>
                        </div>
                      </div>
                    ))}
                    {!selectedDoc.remarks?.length && <p className="text-gray-400">Нет замечаний</p>}
                  </div>
                )}

                {activeTab === 'variables' && selectedDoc && (
                  <VariablePanel
                    projectId={selectedDoc.project_id}
                    documentId={selectedDoc.id}
                    onChange={async () => {
                      try {
                        await variablesApi.cascadeUpdate(selectedDoc.project_id, ['*']);
                      } catch {}
                    }}
                  />
                )}

                {activeTab === 'preview' && (
                  <div className="space-y-4">
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Рендеринг документа</h4>
                      <div className="whitespace-pre-wrap text-sm text-gray-800 bg-white rounded p-3 border border-gray-100 min-h-[120px]">
                        {renderedContent || 'Нет содержимого'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Panels (P6-стиль) */}
              <div className="shrink-0 border-t border-gray-200 p-3 bg-white">
                <DocumentDetailPanels doc={selectedDoc} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Выберите документ из дерева проекта
            </div>
          )}
        </div>
      </div>

      {/* Create Document Modal */}
      {showCreate && (
        <Modal title="Новый документ" isOpen={showCreate} onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <Input placeholder="Номер документа" value={newDoc.number} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc({ ...newDoc, number: e.target.value })} />
            <Input placeholder="Название" value={newDoc.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc({ ...newDoc, name: e.target.value })} />
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={newDoc.doc_type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDoc({ ...newDoc, doc_type: e.target.value })}>
              <option value="KM">КМ (конструкторские)</option>
              <option value="PD">ПД (проектная документация)</option>
              <option value="AK">АК (арматурные конструкции)</option>
              <option value="EM">ЭМ (электромонтаж)</option>
              <option value="TK">ТК (технологические карты)</option>
            </select>
            <Input placeholder="ID раздела" type="number" value={newDoc.section_id || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDoc({ ...newDoc, section_id: Number(e.target.value) })} />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
              <Button onClick={handleCreateDoc}>Создать</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Remark Modal */}
      {showRemarkForm && (
        <Modal title="Новое замечание" isOpen={showRemarkForm} onClose={() => setShowRemarkForm(false)}>
          <div className="space-y-4">
            <Input placeholder="Заголовок" value={newRemark.title} onChange={(e) => setNewRemark({ ...newRemark, title: e.target.value })} />
            <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Описание" value={newRemark.description} onChange={(e) => setNewRemark({ ...newRemark, description: e.target.value })} />
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={newRemark.severity} onChange={(e) => setNewRemark({ ...newRemark, severity: e.target.value })}>
              <option value="minor">Незначительное</option>
              <option value="major">Значительное</option>
              <option value="critical">Критичное</option>
              <option value="note">Примечание</option>
            </select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRemarkForm(false)}>Отмена</Button>
              <Button onClick={handleAddRemark}>Добавить</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
