declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var Logger: { info: (...args: string[]) => void; warn: (...args: string[]) => void; error: (...args: string[]) => void };
}

export const Logger = {
  info: (...args: any[]) => {
    console.log(...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};

export const initLogger = () => {
  global.Logger = Logger;
};
