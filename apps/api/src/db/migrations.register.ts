import type { MigrationInterface } from "typeorm"
import { InitialSchema1765016242418 } from "./migrations/1765016242418-InitialSchema"
import { IdxLedgerTransactionsMetadataId1765016242419 } from "./migrations/1765016242419-idx_ledger_transactions_metadata_id"
import { IdxFileAttachment1765016242420 } from "./migrations/1765016242420-idx_file_attachment"
import { AddInvoicePayloadToStarsTopUp1765016242421 } from "./migrations/1765016242421-AddInvoicePayloadToStarsTopUp"
import { Phase1Updates1765016242422 } from "./migrations/1765016242422-Phase1Updates"
import { ChatMessageAddRequestResponseIds1765016242423 } from "./migrations/1765016242423-ChatMessageAddRequestResponseIds"
import { AddDealReviews1765016242424 } from "./migrations/1765016242424-AddDealReviews"
import { AddSpecials1765016242425 } from "./migrations/1765016242425-AddSpecials"
import { AddUserPhoneNullableTgId1765016242426 } from "./migrations/1765016242426-AddUserPhoneNullableTgId"
import { AddDeviceTokenTable1765016242427 } from "./migrations/1765016242427-AddDeviceTokenTable"
import { ChatMessageSupportHumanAuthor1765016242428 } from "./migrations/1765016242428-ChatMessageSupportHumanAuthor"
import { AddPerformerVerification1765016242429 } from "./migrations/1765016242429-AddPerformerVerification"
import { AddBalanceUpdatedAtDefault1765016242430 } from "./migrations/1765016242430-AddBalanceUpdatedAtDefault"

/**
 * Полная цепочка для CLI (`migration:run` с data-source) и пустой БД.
 * Не подставлять целиком в Nest на уже заполненный прод без baseline — InitialSchema упадёт.
 */
export const allMigrationsOrdered: (new () => MigrationInterface)[] = [
  InitialSchema1765016242418,
  IdxLedgerTransactionsMetadataId1765016242419,
  IdxFileAttachment1765016242420,
  AddInvoicePayloadToStarsTopUp1765016242421,
  Phase1Updates1765016242422,
  ChatMessageAddRequestResponseIds1765016242423,
  AddDealReviews1765016242424,
  AddSpecials1765016242425,
  AddUserPhoneNullableTgId1765016242426,
  AddDeviceTokenTable1765016242427,
  ChatMessageSupportHumanAuthor1765016242428,
  AddPerformerVerification1765016242429,
  AddBalanceUpdatedAtDefault1765016242430,
]

/**
 * Инкрементальные миграции для уже существующей БД (тестнет/прод).
 * NestJS production: migrationsRun при старте API.
 */
export const runtimeIncrementalMigrations: (new () => MigrationInterface)[] = [
  AddUserPhoneNullableTgId1765016242426,
  AddDeviceTokenTable1765016242427,
  ChatMessageSupportHumanAuthor1765016242428,
  AddPerformerVerification1765016242429,
  AddBalanceUpdatedAtDefault1765016242430,
]
