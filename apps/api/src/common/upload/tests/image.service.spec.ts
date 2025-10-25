import { MimeType } from "@share"
import bytes from "bytes"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import { ZodError } from "zod"
import { ImageService } from "../image.service"

describe.skip("ImageService", () => {
  const image = fs.readFileSync(path.join(__dirname, "fox.jpg"))

  it("should maxSize validator be successfully completed", async () => {
    const validator = ImageService.getValidator({
      maxSize: bytes(`3.8KB`) as number,
      accept: [MimeType["jpeg"]],
    })
    await validator.parseAsync(image.toString("base64"))
  })

  it("should maxSize validator be failed", async () => {
    const validator = ImageService.getValidator({
      maxSize: bytes(`1KB`) as number,
      accept: [MimeType["jpeg"]],
    })

    await expect(() => validator.parseAsync(image.toString("base64"))).rejects.toThrow(ZodError)
  })

  it("should imageType validator be successfully completed", async () => {
    const validator = ImageService.getValidator({
      maxSize: bytes(`3.8KB`) as number,
      accept: [MimeType["jpeg"]],
    })
    await validator.parseAsync(image.toString("base64"))
  })

  it("should maxSize validator be failed", async () => {
    const validator = ImageService.getValidator({
      maxSize: bytes(`3.8KB`) as number,
      accept: [MimeType["jpeg"]],
    })
    await expect(() => validator.parseAsync(crypto.randomBytes(32).toString("base64"))).rejects.toThrow(ZodError)
  })

  it("should image dimensions validator be successfully completed", async () => {
    const validator = ImageService.getValidator({
      maxSize: bytes(`3.8KB`) as number,
      accept: [MimeType["jpeg"]],
      dimensions: {
        width: 100,
        height: 100,
      },
    })
    await validator.parseAsync(image.toString("base64"))
  })

  it("should image dimensions validator be failed", async () => {
    const validator = ImageService.getValidator({
      maxSize: bytes(`3.8KB`) as number,
      accept: [MimeType["jpeg"]],
      dimensions: {
        width: 105,
        height: 105,
      },
    })
    await expect(() => validator.parseAsync(crypto.randomBytes(32).toString("hex"))).rejects.toThrow(ZodError)
  })
})
