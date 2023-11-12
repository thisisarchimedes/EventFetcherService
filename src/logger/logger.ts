// export class Logger {
//   info(message: string, metaData?: any): void {
//     console.info(message, metaData ? metaData : '');
//   }

//   // Function to log warnings
//   warn(message: string, metaData?: any): void {
//     console.warn(message, metaData ? metaData : '');
//   }

//   // Function to log errors
//   error(message: string, error: Error, metaData?: any): void {
//     console.error(message, error, metaData ? metaData : '');
//   }
// }

import newrelic from 'newrelic';

export class Logger {
  // Function to log information
  info(message: string, metaData?: any): void {
    console.info(message);
    if (metaData) {
      newrelic.addCustomAttribute('info', metaData);
    }
    newrelic.recordCustomEvent('InfoEvent', { message });
  }

  // Function to log warnings
  warn(message: string, metaData?: any): void {
    console.warn(message);
    if (metaData) {
      newrelic.addCustomAttribute('warn', metaData);
    }
    newrelic.recordCustomEvent('WarnEvent', { message });
  }

  // Function to log errors
  error(message: string, error: Error, metaData?: any): void {
    console.error(message, error);
    newrelic.noticeError(error, { message });
    if (metaData) {
      newrelic.addCustomAttribute('error', metaData);
    }
  }
}
