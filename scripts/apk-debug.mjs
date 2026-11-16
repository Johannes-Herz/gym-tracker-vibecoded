// Builds the debug APK. JAVA_HOME is taken from the environment or, on Windows, from the
// usual Temurin install folder, so no system-wide setup is needed. The SDK path comes from
// android/local.properties (gitignored; created here from the default Android Studio location).
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const env = { ...process.env }

if (!env.JAVA_HOME) {
  const root = 'C:/Program Files/Eclipse Adoptium'
  const jdk = existsSync(root) ? readdirSync(root).filter((d) => d.startsWith('jdk-21')).sort().pop() : undefined
  if (!jdk) {
    console.error('JDK 21 not found. Install Temurin 21 or set JAVA_HOME.')
    process.exit(1)
  }
  env.JAVA_HOME = join(root, jdk)
}

const props = join('android', 'local.properties')
if (!existsSync(props) && !env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
  const sdk = join(env.LOCALAPPDATA ?? '', 'Android', 'Sdk')
  if (!existsSync(sdk)) {
    console.error('Android SDK not found. Install Android Studio or set ANDROID_HOME.')
    process.exit(1)
  }
  // Forward slashes are valid in Windows paths and need no escaping in .properties files.
  writeFileSync(props, 'sdk.dir=' + sdk.split('\\').join('/') + '\n')
}

const result = spawnSync(join(process.cwd(), 'android', 'gradlew.bat'), ['assembleDebug'], {
  cwd: 'android',
  env,
  stdio: 'inherit',
  shell: true,
})
if (result.status === 0) {
  console.log('\nAPK: android/app/build/outputs/apk/debug/app-debug.apk')
}
process.exit(result.status ?? 1)
