import { resolve } from 'path'
import { readdirSync } from 'fs'

import ts from 'rollup-plugin-typescript2'

const PACKAGES_DIR = resolve(__dirname, 'packages')
const packagesNames = readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)


const config = packagesNames.map(packageName => {
  const packageDir = resolve(PACKAGES_DIR, packageName)

  return {
    input: resolve(packageDir, 'src/index.ts'),
    output: [
      {
        file: resolve(packageDir, `dist/${packageName}.js`),
        format: 'cjs'
      },
      {
        file: resolve(packageDir, `dist/${packageName}.esm.js`),
        format: 'esm'
      }
    ],
    plugins: [
      ts({
        tsconfig: resolve(__dirname, 'tsconfig.json')
      })
    ]
  }
})

export default config
