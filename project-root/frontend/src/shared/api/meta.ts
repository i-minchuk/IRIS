// frontend/src/shared/api/meta.ts
import client from './client';

export interface AppModeFeatures {
  demo_data_seed: boolean;
  exports: boolean;
  external_integrations: boolean;
  feedback_button: boolean;
  demo_banner: boolean;
}

export interface AppMeta {
  mode: 'demo' | 'prod';
  version: string;
  features: AppModeFeatures;
}

export const getMeta = () => client.get<AppMeta>('/meta');
