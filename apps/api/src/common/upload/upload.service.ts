import { fromBuffer } from "file-type"
import fs from "fs"
import path from "path"
import { v4 as uuidV4 } from "uuid"
import { ConfigService } from "../../config"

type UploadFileParams = {
  file: Buffer
  location?: string
}

export class UploadService {
  protected static mediaRoot = ConfigService.mediaRoot

  /**
   * @returns возвращает относительный путь до файла
   * @example
   * const path = await upload({file: docxFile, location: "private/user-documents"}) // private/user-documents/<file>.docx
   */
  static async upload({ file, location }: UploadFileParams) {
    if (typeof location === "string") {
      if (UploadService.isInvalidPath(location)) {
        throw new Error(`[location] isn't valid path`)
      }

      if (path.isAbsolute(location)) {
        throw new Error(`[location] must be relative path`)
      }
    }

    if (!Buffer.isBuffer(file)) {
      throw new Error(`[file] isn't Buffer`)
    }

    const fileResult = await fromBuffer(file)
    if (!fileResult) {
      throw new Error(`Unable to determine file type`)
    }

    const { ext } = fileResult
    const filename = UploadService.generateFileName(ext)

    const mediaRoot = ConfigService.mediaRoot

    if (!location) {
      const absolutePath = path.join(mediaRoot, filename)
      await fs.promises.writeFile(absolutePath, file)
      return filename
    }

    const locationPath = path.join(UploadService.mediaRoot, location)
    if (!fs.existsSync(locationPath)) {
      await fs.promises.mkdir(locationPath, { recursive: true })
    }

    const absolutePath = path.join(locationPath, filename)
    await fs.promises.writeFile(absolutePath, file)

    return path.join(location, filename)
  }

  static async delete(filePath: string) {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(UploadService.mediaRoot, filePath)

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not exists, cannot delete`)
    }
    await fs.promises.rm(absolutePath)
  }

  protected static generateFileName(extension: string) {
    return uuidV4() + `.${extension}`
  }

  public static getAbsoluteFilePath(filePath: string) {
    return path.join(UploadService.mediaRoot, filePath)
  }

  protected static isInvalidPath(fp: string | undefined, options: { file: boolean } = { file: false }) {
    if (fp === "" || typeof fp !== "string") {
      return true
    }

    const MAX_PATH = 260
    if (typeof fp !== "string" || fp.length > MAX_PATH - 12) {
      return true
    }

    const rootPath = path.parse(fp).root
    if (rootPath) {
      fp = fp.slice(rootPath.length)
    }

    if (options.file) {
      return /[<>:"/\\|?*]/.test(fp)
    }
    return /[<>:"|?*]/.test(fp)
  }
}
