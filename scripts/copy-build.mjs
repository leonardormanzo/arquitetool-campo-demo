import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

await copyFile(resolve('dist/index.html'), resolve('index.html'))
console.log('Standalone pronto: index.html')
