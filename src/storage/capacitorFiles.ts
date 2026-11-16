import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import type { FileApi } from './nativeStorage'

/** `FileApi` on top of the Capacitor Filesystem plugin, rooted in one of its directories. */
export function capacitorFiles(directory: Directory): FileApi {
  return {
    async read(path) {
      const { data } = await Filesystem.readFile({ path, directory, encoding: Encoding.UTF8 })
      if (typeof data !== 'string') throw new Error('Unexpected binary data')
      return data
    },
    async write(path, text) {
      await Filesystem.writeFile({ path, data: text, directory, encoding: Encoding.UTF8, recursive: true })
    },
    async rename(from, to) {
      await Filesystem.rename({ from, to, directory, toDirectory: directory })
    },
    async remove(path) {
      try {
        await Filesystem.deleteFile({ path, directory })
      } catch {
        // already gone
      }
    },
    async list(dir) {
      try {
        const { files } = await Filesystem.readdir({ path: dir, directory })
        return files.map((f) => f.name)
      } catch {
        return [] // folder does not exist yet
      }
    },
  }
}
