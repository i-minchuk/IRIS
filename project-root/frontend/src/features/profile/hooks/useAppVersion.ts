// @ts-ignore
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '4.0.0';
// @ts-ignore
const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString().split('T')[0];

export function useAppVersion(): { version: string; buildDate: string } {
  return { version, buildDate };
}