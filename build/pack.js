'use strict'

const packager = require('electron-packager')
const fs = require('fs')
const archiver = require('archiver')
const path = require('path')
const { name, buildOptions, version } = require('../package.json')
// const { name, version } = require('../package.json')

// const appPaths = [
//   'dist\\packed\\data-cleaner-win32-ia32',
//   'dist\\packed\\data-cleaner-win32-x64' ]

packager(buildOptions)
  .then((appPaths) => {
    console.log(appPaths)
    return zipPatch(appPaths[0])
  })

// zipPatch(appPaths[0])

function zipPatch (appPath) {
  return new Promise((resolve, reject) => {
    let patchName = path.resolve(__dirname, '..', path.dirname(appPath), `${name}-patch-v${version}_ia32_x64.zip`)
    var output = fs.createWriteStream(patchName)
    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })

    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes')
      console.log('archiver has been finalized and the output file descriptor has closed.')
      resolve()
    })

    archive.on('warning', err => {
      if (err.code === 'ENOENT') {
        reject(err)
      } else {
        reject(err)
      }
    })

    archive.on('error', err => {
      reject(err)
    })

    archive.pipe(output)
    archive.directory(appPath + '/resources/', 'resources')
    archive.finalize()
  })
}
