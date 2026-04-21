import client from './client';
import type { Project, PortfolioSummary } from '../types';

export const getPortfolio = async (): Promise<{ summary: PortfolioSummary; projects: Project[] }> => {
  const { data } = await client.get('/api/dashboard/portfolio');
  return data;
};

export const getProjects = async (): Promise<Project[]> => {
  const { data } = await client.get('/api/projects/');
  return data;
};
