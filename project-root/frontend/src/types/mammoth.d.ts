// TypeScript declarations для mammoth.js
declare module 'mammoth' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface ConvertImageOptions {}
  
  export interface ConvertToHtmlResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export interface ConvertOptions {
    arrayBuffer: ArrayBuffer;
    image?: ConvertImageOptions;
  }

  export interface RawDocument {
    styles: Record<string, unknown>;
    body: string;
  }

  export function convertToHtml(options: ConvertOptions): Promise<ConvertToHtmlResult>;
  export function convertToRaw(options: ConvertOptions): Promise<RawDocument>;
}
