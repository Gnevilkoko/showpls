import { WINSTON_MODULE_PROVIDER } from "nest-winston"

export function getLoggerToken() {
  return WINSTON_MODULE_PROVIDER
}
