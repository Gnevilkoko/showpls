import { MimeType } from "@share"
import { fromBuffer } from "file-type"
import { imageSize } from "image-size"
import { z, ZodString } from "zod"

type ImageValidationOptions = {
  maxSize: number
  accept: (MimeType.jpeg | MimeType.png | MimeType.webp | MimeType.gif)[]
  dimensions?: {
    width: number
    height: number
  }
}

export class ImageService {
  static getValidator({ maxSize, accept, dimensions }: ImageValidationOptions) {
    z.object({
      maxSize: z.number().int().positive(),
      accept: z.array(z.enum([MimeType.jpeg, MimeType.png, MimeType.webp, MimeType.gif])),
      dimensions: z
        .object({
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        })
        .optional(),
    }).parse({
      maxSize,
      accept,
      dimensions,
    })

    let schema = z
      .string()
      .base64()
      .transform((v) => Buffer.from(v, "base64")) as any

    schema = schema.pipe(z.custom((v) => Buffer.isBuffer(v), `Provided value isn't buffer`))

    schema = schema.pipe(
      z.custom((buffer: any) => {
        const size = Buffer.byteLength(buffer)
        return size <= maxSize
      }, "The file size is larger than allowed"),
    )

    schema = schema.pipe(
      z.custom(async (buffer: any) => {
        try {
          const fileTypeResult = await fromBuffer(buffer)

          if (!fileTypeResult) {
            return false
          }
          const { mime: mimeType } = fileTypeResult

          return accept.includes(mimeType as any)
        } catch (e) {
          if (e instanceof TypeError) {
            return false
          }
          throw e
        }
      }, `Content is not an image, or type of this image does not exist in the [${accept}]`),
    )

    if (dimensions) {
      schema = schema.pipe(
        z.custom((buffer: any) => {
          const { width, height } = imageSize(buffer)
          return width === dimensions.width && height === dimensions.height
        }, `The image has invalid dimensions`),
      )
    }

    return schema as ZodString
  }
}
