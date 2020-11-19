/* eslint-disable no-console */
import { red, green, cyan } from 'kleur';
import * as figlet from 'figlet';

import { ConsoleMessage } from '../models/console-message';

const newLine = '\n';

export const ShowTitleAndBanner = (): void => {
  // optional font 'Calvin S' to look more clear
  console.log(cyan(figlet.textSync(ConsoleMessage.TITLE, { horizontalLayout: 'full', font: 'Elite' })));
  console.info(cyan(ConsoleMessage.BANNER));
};

export const ShowError = (message: string | Error | undefined = undefined): void => {
  console.error(red(ConsoleMessage.ERROR) + message + newLine);
};

export const ShowSuccess = (message: string): void => {
  console.log(green(ConsoleMessage.SUCCESS) + message + newLine);
};

export const ShowInfo = (message: string): void => {
  console.info(cyan(ConsoleMessage.INFO) + message + newLine);
};
