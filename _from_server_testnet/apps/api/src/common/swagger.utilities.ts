import { ReferenceObject, SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface"
import { getSchemaPath } from "@nestjs/swagger"

export class SwaggerUtilities {
  public static getPaginatedResponseSchema<T extends object>(
    ref: new () => T
  ): SchemaObject & Partial<ReferenceObject> {
    return {
      type: "object",
      properties: {
        items: { type: "array", items: { $ref: getSchemaPath(ref) } },
        meta: {
          type: "object",
          properties: {
            itemCount: { type: "number" },
            totalItems: { type: "number" },
            itemsPerPage: { type: "number" },
            totalPages: { type: "number" },
            currentPage: { type: "number" },
          },
        },
      },
    }
  }
}
