import fs from 'fs';
import os from 'os';
import { sep } from 'path';
import { red } from 'kleur';
import {
  Exists, GetFile, WriteFile, GetFileList, GetScriptsContent,
} from './file.util';
import { PreRequestTestScript } from '../converter/converter.model';

function consoleErrorTextHelper(text: string): string {
  return `${red('ERROR: ')}${text}${'\n'}`;
}

function prepare(): string {
  const tmpDir = os.tmpdir();
  const dir = fs.mkdtempSync(`${tmpDir}${sep}`);
  const fullPath = fs.mkdtempSync(`${dir}${sep}`);

  // empty dir
  fs.mkdirSync(`${fullPath}${sep}empty`);
  // pre-request script files

  fs.mkdirSync(`${fullPath}${sep}pre-request`);
  fs.mkdirSync(`${fullPath}${sep}empty${sep}pre-request`);

  fs.writeFileSync(`${fullPath}${sep}pre-request${sep}correct-file1.js`, 'pre-request1');
  fs.writeFileSync(`${fullPath}${sep}pre-request${sep}correct-file2.js`, 'pre-request2');
  fs.writeFileSync(`${fullPath}${sep}pre-request${sep}correct-file4.js`, 'pre-request4');
  fs.writeFileSync(`${fullPath}${sep}pre-request${sep}empty-file.js`, '');

  // test script files

  fs.mkdirSync(`${fullPath}${sep}test`);
  fs.mkdirSync(`${fullPath}${sep}empty${sep}test`);

  fs.writeFileSync(`${fullPath}${sep}test${sep}correct-file1.js`, 'test1');
  fs.writeFileSync(`${fullPath}${sep}test${sep}correct-file2.js`, 'test2');
  fs.writeFileSync(`${fullPath}${sep}test${sep}correct-file3.js`, 'test3');
  fs.writeFileSync(`${fullPath}${sep}test${sep}empty-file.js`, '');

  // other files
  fs.writeFileSync(`${fullPath}${sep}correct-file.js`, 'correctFile');
  fs.writeFileSync(`${fullPath}${sep}correct-file2.js`, 'correctFile 2');
  fs.writeFileSync(`${fullPath}${sep}correct-file3.js`, 'correctFile 3');
  fs.writeFileSync(`${fullPath}${sep}correct-file4.js`, 'correctFile 4');
  fs.writeFileSync(`${fullPath}${sep}correct-file5.js`, 'correctFile 5');
  return fullPath;
}

function cleanUp(dir: string) {
  try {
    fs.rmdirSync(dir, { recursive: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to delete ${dir}, due to error: ${error}. Please remove it manually if necessary`);
  }
}

let path: string;

beforeAll(() => {
  path = prepare();
});
afterAll(() => {
  cleanUp(path);
});

describe('Exists', () => {
  test('exists: true', () => {
    expect(Exists(path)).toBe(true);
    expect(Exists(`${path}${sep}correct-file.js`)).toBe(true);
  });
  test('exists: false', () => {
    expect(Exists(`${path}${sep}incorrect-file.js`)).toBe(false);
    expect(Exists(`some-random-path-123${sep}do${sep}no${sep}exists`)).toBe(false);
    expect(Exists(`some-random-path-123${sep}do${sep}no${sep}exists${sep}file${sep}random-file.js`)).toBe(false);
    expect(Exists(undefined)).toBe(false);
  });
});

describe('GetFile', () => {
  test('get file content', () => {
    expect(GetFile(`${path}${sep}correct-file.js`)).toBe('correctFile');
  });
  test('get empty content if file not found', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
    expect(GetFile(`${path}${sep}random-file.js`)).toBe('');
    expect(mockConsoleError).toHaveBeenCalledWith(consoleErrorTextHelper(`File ${path}${sep}random-file.js not found`));
  });
});

describe('WriteFile', () => {
  afterAll(() => {
    fs.rmdirSync('localTmpPath', { recursive: true });
    fs.unlinkSync('file-to-write.js');
  });
  test('create directory and write to file', () => {
    try {
      WriteFile(`${path}${sep}rnd${sep}tmp${sep}file-to-write.js`, 'content');
    } catch (err) {
      expect(err).toBeUndefined();
    }

    try {
      WriteFile(`localTmpPath${sep}true${sep}file-to-write.js`, 'content');
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });
  test('write to file', () => {
    try {
      WriteFile('file-to-write.js', 'content');
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });
});

describe('GetFileList', () => {
  test('get list of files', () => {
    const expectedResult: string[] = ['correct-file.js', 'correct-file2.js', 'correct-file3.js', 'correct-file4.js', 'correct-file5.js'];
    expect(GetFileList(path)).toMatchObject(expectedResult);
  });
  test('non existing path should throw', () => {
    try {
      GetFileList(`${path}${sep}no-exist`);
    } catch (err) {
      expect(err.message).toBe(`ENOENT: no such file or directory, scandir '${path}${sep}no-exist'`);
    }
  });
});

describe('GetScriptsContent', () => {
  test('successfully get script content', () => {
    const expectedResult: PreRequestTestScript[] = [
      { normalizedName: 'correct-file1', preRequestScriptContent: 'pre-request1', testScriptContent: 'test1' },
      { normalizedName: 'correct-file2', preRequestScriptContent: 'pre-request2', testScriptContent: 'test2' },
      { normalizedName: 'correct-file3', preRequestScriptContent: '', testScriptContent: 'test3' },
      { normalizedName: 'correct-file4', preRequestScriptContent: 'pre-request4', testScriptContent: '' },
      { normalizedName: 'empty-file', preRequestScriptContent: '', testScriptContent: '' },
    ];

    const scripts = GetScriptsContent(path);

    // eslint-disable-next-line no-restricted-syntax
    for (const er of expectedResult) {
      expect(scripts).toContainEqual<PreRequestTestScript>(er);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const script of scripts) {
      expect(expectedResult).toContainEqual<PreRequestTestScript>(script);
    }
  });
  test('empty catalog', () => {
    const expectedResult: PreRequestTestScript[] = [];

    const scripts = GetScriptsContent(`${path}${sep}empty`);

    // eslint-disable-next-line no-restricted-syntax
    for (const er of expectedResult) {
      expect(scripts).toContainEqual<PreRequestTestScript>(er);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const script of scripts) {
      expect(expectedResult).toContainEqual<PreRequestTestScript>(script);
    }
  });
});
