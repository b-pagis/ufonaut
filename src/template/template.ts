import { GetFile } from '../utils/file.util';

interface interpolationProperties {
  requestBody: string,
  scriptContent: string
}

export function Interpolate(content: string, props: interpolationProperties): string {
  return content
    .replace(/<%%=\s*requestBody\s*=%%>/g, props.requestBody)
    .replace(/<%%=\s*scriptContent\s*=%%>/g, props.scriptContent);
}

export function LoadTemplate(path:string): string {
  return GetFile(path);
}
