import fs from "fs"
import path from "path"
import { rimraf } from "rimraf"
import { ConfigService } from "../../../config"
import { UploadService } from "../upload.service"

describe.skip("UploadService", () => {
  const image = fs.readFileSync(path.join(__dirname, "fox.jpg"))

  afterAll(async () => {
    await rimraf(`${ConfigService.mediaRoot}/*`, { glob: true })
  })

  it("should upload() works", async () => {
    const filePath = await UploadService.upload({
      file: image,
      location: "private/profiles",
    })

    expect(path.extname(filePath)).toBe(".jpg")
    expect(fs.existsSync(UploadService.getAbsoluteFilePath(filePath))).toBe(true)
  })

  it("should delete() works", async () => {
    const filePath = await UploadService.upload({
      file: image,
      location: "private/profiles",
    })
    await UploadService.delete(filePath)
    expect(fs.existsSync(UploadService.getAbsoluteFilePath(filePath))).toBe(false)
  })
})
