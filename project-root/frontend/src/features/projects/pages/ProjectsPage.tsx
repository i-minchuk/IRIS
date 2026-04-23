import React, { useEffect, useState } from 'react';
import { getProjects, getProject, createProject, createStage, createKit, createSection, type Project, type Stage, type Section } from '@/api/projects';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetail, setProjectDetail] = useState<(Project & { stages: Stage[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', code: '', customer_name: '', stage: 'Эскизный' });
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [expandedKit, setExpandedKit] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    const detail = await getProject(project.id);
    setProjectDetail(detail);
  };

  const handleCreateProject = async () => {
    await createProject(newProject);
    setShowCreate(false);
    setNewProject({ name: '', code: '', customer_name: '', stage: 'Эскизный' });
    loadProjects();
  };

  const handleAddStage = async () => {
    if (!projectDetail) return;
    const name = prompt('Название стадии:');
    if (!name) return;
    await createStage(projectDetail.id, { name });
    handleSelectProject(projectDetail);
  };

  const handleAddKit = async (stageId: number) => {
    const name = prompt('Название комплекта:');
    if (!name) return;
    await createKit(stageId, { name });
    handleSelectProject(selectedProject!);
  };

  const handleAddSection = async (kitId: number) => {
    const name = prompt('Название раздела:');
    if (!name) return;
    await createSection(kitId, { name });
    handleSelectProject(selectedProject!);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Проекты</h2>
        <Button onClick={() => setShowCreate(true)}>+ Новый проект</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {loading && <p className="text-gray-500">Загрузка...</p>}
          {projects.map((project) => (
            <Card
              key={project.id}
              className={`cursor-pointer transition-colors ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => handleSelectProject(project)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.code}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {project.status}
                </span>
              </div>
              {project.customer_name && <p className="text-xs text-gray-400 mt-1">{project.customer_name}</p>}
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {projectDetail ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{projectDetail.name}</h3>
                    <p className="text-gray-500">{projectDetail.code} • {projectDetail.stage}</p>
                  </div>
                  <Button variant="outline" onClick={handleAddStage}>+ Добавить стадию</Button>
                </div>

                <div className="space-y-2">
                  {projectDetail.stages?.map((stage) => (
                    <div key={stage.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center text-left hover:bg-gray-100"
                        onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                      >
                        <span className="font-medium text-gray-700">{stage.name}</span>
                        <span className="text-gray-400">{expandedStage === stage.id ? '▼' : '▶'}</span>
                      </button>
                      {expandedStage === stage.id && (
                        <div className="p-4 space-y-2">
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleAddKit(stage.id)}>+ Комплект</Button>
                          </div>
                          {stage.kits?.map((kit) => (
                            <div key={kit.id} className="border border-gray-100 rounded">
                              <button
                                className="w-full px-3 py-2 flex justify-between items-center text-left hover:bg-gray-50"
                                onClick={() => setExpandedKit(expandedKit === kit.id ? null : kit.id)}
                              >
                                <span className="text-sm font-medium text-gray-600">{kit.name}</span>
                                <span className="text-gray-400 text-xs">{expandedKit === kit.id ? '▼' : '▶'}</span>
                              </button>
                              {expandedKit === kit.id && (
                                <div className="px-3 pb-3 space-y-1">
                                  <div className="flex justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => handleAddSection(kit.id)}>+ Раздел</Button>
                                  </div>
                                  {kit.sections?.map((section: Section) => (
                                    <div key={section.id} className="text-sm text-gray-500 pl-2 py-1 hover:bg-gray-50 rounded">
                                      {section.name}
                                    </div>
                                  ))}
                                  {!kit.sections?.length && <p className="text-xs text-gray-400 pl-2">Нет разделов</p>}
                                </div>
                              )}
                            </div>
                          ))}
                          {!stage.kits?.length && <p className="text-sm text-gray-400">Нет комплектов</p>}
                        </div>
                      )}
                    </div>
                  ))}
                  {!projectDetail.stages?.length && <p className="text-gray-400">Нет стадий</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-400">
              Выберите проект для просмотра структуры
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <Modal title="Новый проект" isOpen={showCreate} onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <Input placeholder="Название проекта" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
            <Input placeholder="Код проекта" value={newProject.code} onChange={(e) => setNewProject({ ...newProject, code: e.target.value })} />
            <Input placeholder="Заказчик" value={newProject.customer_name} onChange={(e) => setNewProject({ ...newProject, customer_name: e.target.value })} />
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={newProject.stage}
              onChange={(e) => setNewProject({ ...newProject, stage: e.target.value })}
            >
              <option>Эскизный</option>
              <option>Технический</option>
              <option>Рабочий</option>
            </select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
              <Button onClick={handleCreateProject}>Создать</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
