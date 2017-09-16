import fs from 'fs'
import readline from 'readline'
import EventEmitter from 'events'
import path from 'path'
import walk from 'walk'
// import { pdfPageCount } from './pdfInfo.js'
// cannot use [...treeData, ...newData], for that treeData and newData may both have item1,
// but item1 of treeData contains item2, item3, while item1 of newData contains item2, item4
// function findRoot (tree, newRoot, key = 'label', children = 'children') {
//   // let tree = treeData
//   let newDirLevels = newRoot.split(path.sep)
//   while (newDirLevels.length > 0 && Array.isArray(tree[children]) && tree[children].find(value => value[key] === newDirLevels[0])) {
//     tree = tree[children].find(value => value[key] === newDirLevels[0])
//     newDirLevels.shift()
//   }
//   return tree
// }

// let count = 0
// let relative = path.relative(self.rootDir, root)
// let insertPoint = findRoot(self.dirTree, relative)
// // must have empty children, or tree would not find dynamic added children property
// // try `JSON.stringnify(this.dirTree)` for example
// insertPoint.children = dirStats.map(item => ({label: item.name, children: []}))
// count = count + dirStats.length

export default class GxgdFile extends EventEmitter {
  constructor (rootDir, remote) {
    super()
    this.remote = remote
    this.getPdfPages = remote.app.getPdfPages
    this.rootDir = rootDir
    // this.dirTree = {label: '$root', children: []}
    this.objFiles = []
    this.pakFiles = []
    this.working = false
    this.stop = false
  }

  validataDir () {
    return new Promise((resolve, reject) => {
      fs.readdir(this.rootDir, (err, files) => {
        if (err) {
          reject(err)
        }
        this.objFiles = files.filter(name => name.match(/.+obj.txt$/))
        this.pakFiles = files.filter(name => name.match(/.+pak.txt$/))
        if (this.objFiles.length > 0 && this.pakFiles.length > 0) {
          resolve({ foundFiles: [...this.objFiles, ...this.pakFiles], hasResult: files.indexOf('gxgd_check.db') >= 0 })
        } else {
          reject(new Error('目录下未见数据明码文件: *.obj 或 *.pak'))
        }
      })
    })
  }

  traversDir () {
    // TODO: disable this.selectedDir change while walking
    if (this.working) {
      return Promise.reject(new Error('I am busy.'))
    } else {
      this.working = true
      return new Promise((resolve, reject) => {
        let walker = walk.walk(this.rootDir)

        walker.on('directories', (root, dirStats, next) => {
          let dirInfos = dirStats.map(stat => ({
            uri: path.relative(this.rootDir, path.join(root, stat.name)).replace(/\\/g, '/')
          }))
          this.emit('getDirs', dirInfos)
          next()
        })

        walker.on('files', (root, fileStats, next) => {
          // let fileInfos = fileStats.map(stat => ({
          //   uri: path.relative(this.rootDir, path.join(root, stat.name)).replace(/\\/g, '/'),
          //   size: stat.size,
          //   modify_time: stat.mtime
          // }))
          // this.emit('getFiles', fileInfos)
          // next()

          Promise.all(fileStats.map(stat => {
            return (path.extname(stat.name).toLowerCase() === '.pdf'
              ? this.getPdfPages(path.resolve(root, stat.name))
              : Promise.resolve(1))
              .then(data => ({
                uri: path.relative(this.rootDir, path.join(root, stat.name)).replace(/\\/g, '/'),
                size: stat.size,
                modify_time: stat.mtime,
                pages: data
              }))
          }))
            .then(data => {
              this.emit('getFiles', data)
              next()
            })
        })

        walker.on('end', () => {
          this.working = false
          resolve(this.dirTree)
        })

        walker.on('errors', err => reject(err))
      })
    }
  }

  __readLineEmit (fileName, fileType) {
    let lineCount = 0
    // let self = this
    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: fs.createReadStream(path.resolve(this.rootDir, fileName))
      })
      rl.on('line', (line) => {
        if (this.stop) {
          console.log('error at line: ', lineCount, line)
          rl.close()
        } else {
          lineCount = lineCount + 1
          this.emit('readLine', line, fileType)
        }
      })
      rl.on('close', () => {
        if (this.stop) {
          reject(new Error('stop sign'))
        } else {
          resolve(lineCount)
        }
      })
    })
  }

  readLines () {
    if (this.working) {
      return Promise.reject(new Error('I am busy.'))
    } else {
      this.working = true
      return Promise.all([
        ...this.objFiles.map(value => this.__readLineEmit(value, 'doc')),
        ...this.pakFiles.map(value => this.__readLineEmit(value, 'pak'))
      ]).then(data => {
        this.working = false
        this.emit('read-end', data)
      })
    }
  }
}
