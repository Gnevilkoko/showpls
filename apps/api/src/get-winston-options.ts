import { format, LoggerOptions, transports } from "winston"
import {colorize} from 'json-colorizer';

const jsonColorFormat = format.printf(({ level, message, timestamp, context, data, ...meta }) => {
  const logObject = {
    timestamp,
    level,
    context,
    message,
    data,
    ...meta,
  };

  return colorize(
   logObject,
    {
      pretty: true,
      colors: {
        STRING_KEY: 'cyan',
        STRING_LITERAL: 'green',
        NUMBER_LITERAL: 'yellow',
        NULL_LITERAL: 'gray',
        BOOLEAN_LITERAL: 'magenta',
      },
    } as any
  );
});


export function getWinstonOptions(): LoggerOptions {
  return {
    level: "silly",
    format: format.combine(
      format.timestamp({
        format: `dd.MM.YYYY HH:mm:ss.SSS`,
        // format: `YYYY-MM-DD HH:mm:ss.SSS`,
      }),
      jsonColorFormat,
    ),
    transports: [new transports.Console()],
  }
}
