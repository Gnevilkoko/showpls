import { format, LoggerOptions, transports } from "winston"
import {colorize, color} from 'json-colorizer';
import { ConfigService } from "./config"

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
      indent: 2,
      colors: {
        StringKey: color.magenta,
        StringLiteral: color.yellow,
        NumberLiteral: color.blue,
        NullLiteral: color.blue,
        BooleanLiteral: color.blue,
      } as any ,
    }
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
      ...(ConfigService.isDevelopment()  ? [jsonColorFormat] : []),
    ),
    transports: [new transports.Console()],
  }
}
