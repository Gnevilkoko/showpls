import { format, LoggerOptions, transports } from "winston"
import { color, colorize } from "json-colorizer"
import { serializeError } from "serialize-error-cjs"
import { ConfigService } from "./config"
import { ClsServiceManager } from 'nestjs-cls';


function deepSerializeError(err: unknown): unknown {
  if (!(err instanceof Error)) return err;

  const serialized = serializeError(err) as Record<string, unknown>;

  if (err.cause instanceof Error) {
    serialized.cause = deepSerializeError(err.cause);
  } else if (err.cause && typeof err.cause === 'object') {
    serialized.cause = err.cause;
  }

  return serialized;
}

export const clsFormat = format((info) => {
  const cls = ClsServiceManager.getClsService();
  if (cls) {
    const traceId = cls.get("id")
    if (traceId) {
      info.id = traceId;
    }
  }
  return info;
});


const jsonColorFormat = format.printf(({ level, message, timestamp, context, data, ...meta }) => {
  const logObject = {
    timestamp,
    level,
    context,
    message,
    data,
    ...meta,
  }

  return colorize(logObject, {
    indent: 2,
    colors: {
      StringKey: color.magenta,
      StringLiteral: color.yellow,
      NumberLiteral: color.blue,
      NullLiteral: color.blue,
      BooleanLiteral: color.blue,
    } as any,
  })
})

const serializeErrorsFormat = format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      error: deepSerializeError(info),
      message: info.message,
      test: "here",
    }
  }

  if (info.error instanceof Error) {
    info.error = deepSerializeError(info.error)
  }

  return info
})

export function getWinstonOptions(): LoggerOptions {
  return {
    level: "silly",
    format: format.combine(
      clsFormat(),
      serializeErrorsFormat(),
      format.timestamp({
        format: ConfigService.isProduction() ? undefined : `dd.MM.YYYY HH:mm:ss.SSS`,
        // format: `YYYY-MM-DD HH:mm:ss.SSS`,
      }),
      // format.errors({ stack: true }),
      jsonColorFormat,
      ...(ConfigService.isProduction() ? [format.json()] : [jsonColorFormat])
    ),
    transports: [new transports.Console()],
  }
}
