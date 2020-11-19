import fs from 'fs';
import path, { sep } from 'path';
import { ShowError } from './logger.util';
import { PreRequestTestScript } from '../converter/converter.model';
import { ScriptsFilePath } from '../models/paths';

export function GetFile(filePath: string): string {
  let file = '';
  try {
    file = fs.readFileSync(filePath).toString('utf8');
  } catch (error) {
    ShowError(`File ${filePath} not found`);
  }
  return file;
}

export function Exists(filePath: string | undefined): boolean {
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

export function WriteFile(filePath: string, content: string): void {
  const folders = filePath.split(sep).slice(0, -1);

  if (folders.length) {
    fs.mkdirSync(folders.join(sep), { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'UTF-8');
}

export function GetFileList(filePath: string): string[] {
  const dirents = fs.readdirSync(filePath, { withFileTypes: true });
  return dirents
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
}

export function GetScriptsContent(filePath: string): PreRequestTestScript[] {
  const testFileList = GetFileList(`${filePath}${sep}${ScriptsFilePath.TEST_FILES_PATH}`);
  const preRequestFileList = GetFileList(`${filePath}${sep}${ScriptsFilePath.PRE_REQUEST_FILES_PATH}`);
  const commonFileList = testFileList.concat(preRequestFileList.filter((item) => testFileList.indexOf(item) < 0));

  if (commonFileList.length > 0) {
    const scripts: PreRequestTestScript[] = new Array<PreRequestTestScript>();
    // eslint-disable-next-line no-restricted-syntax
    for (const filename of commonFileList) {
      const testFilePath = `${filePath}${sep}${ScriptsFilePath.TEST_FILES_PATH}${sep}${filename}`;
      const preRequestFilePath = `${filePath}${sep}${ScriptsFilePath.PRE_REQUEST_FILES_PATH}${sep}${filename}`;
      const script: PreRequestTestScript = {
        normalizedName: path.parse(filename).name,
        testScriptContent: Exists(testFilePath) ? GetFile(testFilePath) : '',
        preRequestScriptContent: Exists(preRequestFilePath) ? GetFile(preRequestFilePath) : '',
      };
      scripts.push(script);
    }
    return scripts;
  }

  return new Array<PreRequestTestScript>();
}
