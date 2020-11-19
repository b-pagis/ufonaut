/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-empty-function */
import { red, green, cyan } from 'kleur';
import figlet from 'figlet';
import {
  ShowError, ShowSuccess, ShowInfo, ShowTitleAndBanner,
} from './logger.util';

const newLine = '\n';

it('ShowError(string)', () => {
  const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => { });
  ShowError('error');

  // The first argument of the first call to the function was 'hello'
  expect(spy).toHaveBeenCalledWith(`${red('ERROR: ')}error${newLine}`);
  expect(spy).toHaveBeenCalledWith(`${red('ERROR: ')}error${newLine}`);
  spy.mockRestore();
});

it('ShowError(undefined)', () => {
  const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => { });
  ShowError();

  // The first argument of the first call to the function was 'hello'
  expect(spy).toHaveBeenCalledWith(`${red('ERROR: ')}undefined${newLine}`);
  spy.mockRestore();
});

it('ShowError(type Error)', () => {
  const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => { });
  const err: Error = new Error('type Error');
  ShowError(err.message);

  // The first argument of the first call to the function was 'hello'
  expect(spy).toHaveBeenCalledWith(`${red('ERROR: ')}type Error${newLine}`);
  spy.mockRestore();
});

it('ShowSuccess()', () => {
  const spy = jest.spyOn(console, 'log').mockImplementationOnce(() => { });
  ShowSuccess('success');

  // The first argument of the first call to the function was 'hello'
  expect(spy).toHaveBeenCalledWith(`${green('SUCCESS: ')}success${newLine}`);
  spy.mockRestore();
});

it('ShowInfo()', () => {
  const spy = jest.spyOn(console, 'info').mockImplementationOnce(() => { });
  ShowInfo('info');

  // The first argument of the first call to the function was 'hello'
  expect(spy).toHaveBeenCalledWith(`${cyan('INFO: ')}info${newLine}`);
  spy.mockRestore();
});

it('ShowTitleAndBanner()', () => {
  const spyLog = jest.spyOn(console, 'log').mockImplementationOnce(() => { });
  const spyInfo = jest.spyOn(console, 'info').mockImplementationOnce(() => { });
  ShowTitleAndBanner();

  // The first argument of the first call to the function was 'hello'
  expect(spyLog).toHaveBeenCalledWith(cyan(figlet.textSync('ufonaut', { horizontalLayout: 'full', font: 'Elite' })));
  expect(spyInfo).toHaveBeenCalledWith(cyan('CLI for converting open api documentation to postman collection with additional options for integration testing'));
  spyLog.mockRestore();
  spyInfo.mockRestore();
});
