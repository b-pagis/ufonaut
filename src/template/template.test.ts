import { red } from 'kleur';
import { Interpolate, LoadTemplate } from './template';
import * as fileUtil from '../utils/file.util';

const newLine = '\n';

function consoleErrorTextHelper(text: string): string {
  return `${red('ERROR: ')}${text}${newLine}`;
}

const template = `
var requestBody = <%%=requestBody=%%>;

<%%=  scriptContent =%%>

pm.environment.set('requestBody', requestBody);
`;

const requestBody = {
  demo: 'value',
  array: [
    'test',
    'array',
  ],
};

const scriptContent = `// this is comment
pm.variables.get("requestBody");`;

const expectedResult = `
var requestBody = {
  "demo": "value",
  "array": [
    "test",
    "array"
  ]
};

// this is comment
pm.variables.get("requestBody");

pm.environment.set('requestBody', requestBody);
`;

describe('Interpolate', () => {
  test('interpolate pre-request template', () => {
    expect(Interpolate(template, { requestBody: JSON.stringify(requestBody, null, 2), scriptContent })).toBe(expectedResult);
  });
});

describe('LoadTemplate', () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

  test('get template content', () => {
    const mockedGetFile = jest.mock('../utils/file.util');
    mockedGetFile.spyOn(fileUtil, 'GetFile').mockImplementationOnce((path) => ((path === 'existingPath') ? template : ''));
    expect(LoadTemplate('existingPath')).toBe(template);
    expect(mockConsoleError).not.toBeCalled();
  });

  test('file does not exist', () => {
    expect(LoadTemplate('random-path-123456798/file-7.template')).toBe('');
    expect(mockConsoleError).toBeCalledWith(consoleErrorTextHelper('File random-path-123456798/file-7.template not found'));
  });
});
