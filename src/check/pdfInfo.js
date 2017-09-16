const fs = require('fs')
const readline = require('readline')
const path = require('path')
const glob = require('glob')

const catalogPattern = /\/Type\s+\/Catalog/ // /(^\s*<<|^\s*>>|^\s*\/[A-Z][a-z]+|obj)/
const objStartPattern = /^([0-9]+) 0 obj/ // /^\s*([0-9]+)\s+0\s+obj\s*$/
const objEndPattern = /^endobj$/
const objContentPattern = /(^\s*<<|^\s*>>|^\s*\/[A-Z][a-z]+)/
const pagePattern = /\/Type\s*\/Pages/
const childPagePattern = /\/Parent/
const pageNodePattern = /\/Type\s*\/Page(?!s)/

export function pdfPageCount (fileName) {
  console.log(fileName)
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.resolve('.', fileName))
    })
    let stop = false

    let currentObj
    let pageObjPattern
    let pageNodeCount = 0

    rl.on('line', (line) => {
      if (stop) return
      let pageLine
      if (!currentObj) {
        let pattern = pageObjPattern || objStartPattern
        pageLine = line.match(pattern)
        if (pageLine) {
          currentObj = { id: pageLine[1] * 1, text: line.replace(pattern, ''), pageObjID: '' }
        }
        if (line.match(pageNodePattern)) pageNodeCount++
        return
      }
      if (line.match(pageNodePattern)) pageNodeCount++

      if (line.match(objEndPattern)) {
        if (!pageObjPattern && currentObj.text.match(catalogPattern)) { // object is catalog
          let pageObjID = currentObj.text.match(/Pages (\d+)/)[1]
          pageObjPattern = new RegExp(`${pageObjID}\\s+0\\s+obj`)
        } else if (currentObj.text.match(pagePattern) && !currentObj.text.match(childPagePattern)) {
          let page = currentObj.text.match(/Count (\d+)/)[1]
          stop = true
          rl.close()
          resolve([page, fileName])
        }
        currentObj = null
      }

      try {
        if (line.match(objContentPattern)) currentObj.text += line
      } catch (e) {
        rl.close()
        reject(e)
      }
    })

    rl.on('close', () => {
      if (!stop) {
        if (pageNodeCount <= 0) {
          reject(new Error('not found:' + fileName + pageNodeCount))
        } else {
          resolve([pageNodeCount, fileName])
        }
      }
    })
  })
}

export function pdfObjStr (fileName) {
  return new Promise((resolve, reject) => {
    let linesReaded = 0
    let stop = false

    const output = fs.createWriteStream(path.resolve('.', path.basename(fileName) + '.txt'))
    const rl = readline.createInterface({
      input: fs.createReadStream(path.resolve('.', fileName))
    })
    // let pattern = /\/N (\d+)/
    let pattern = /(^<<|^\s*>>|^\s*\/[A-Z][a-z]+|obj)/
    let pattern2 = /\/N (\d+)/
    let pattern3 = /\/Type\/Pages\/Count\s+(\d+)/

    let objStartPattern = /\/Type\s*\/Page(?!s)/
    rl.on('line', (line) => {
      if (stop) return
      linesReaded++
      // console.log(line)
      if (line.match(objStartPattern)) console.log(line, linesReaded)
      let pageLine = line.match(pattern)
      if (pageLine) {
        // console.log('1-->', line)
        output.write(line + '\n')
      }
      if (line.match(pattern2)) {
        // stop = true
        // rl.close()
      }
      if (line.match(pattern3)) {
        console.log('1-->', line)
        // stop = true
        // rl.close()
      }
    })
    rl.on('close', () => { resolve(linesReaded) })
  })
}

export function getPages (name) {
  let stat = fs.statSync(name)
  return new Promise((resolve, reject) => {
    if (stat.isFile()) {
      resolve(pdfPageCount(name))
    } else if (stat.isDirectory()) {
      glob(path.join(name, '*.pdf'), (err, pdfs) => {
        if (err) {
          reject(err)
        } else {
          resolve(Promise.all(pdfs.map(pdf => pdfPageCount(pdf))))
        }
      })
    }
  })
}

// module.exports = { pdfPageCount, getPages, pdfObjStr }

// let fileName = process.argv[2] || '../gxgd_desktop/.data/REPOSITORY/sample_repo/人月神话.pdf'

// getPages(fileName)
//   .then(data => console.log(data))
//   .catch(err => console.log(err))

// format 1 ../gxgd_desktop/.data/REPOSITORY/sample_repo/Wired UK - January-February 2016.pdf
// 6289 0 obj
// <</Kids[6287 0 R 6288 0 R]/Type/Pages/Count 188>>
// endobj
// 6290 0 obj
// <</Type/Catalog/Pages 6289 0 R>>
// endobj

// format 2 ../gxgd_desktop/.data/REPOSITORY/sample_repo/人月神话.pdf
// 1 0 obj
// <<
// /Metadata 4358 0 R
// /PageLayout /TwoPageRight
// /Pages 2 0 R
// /Type /Catalog
// /ViewerPreferences <<
// /HideWindowUI true
// >>
// >>
// endobj
// 2 0 obj
// <<
// /ITXT (5.0.5)
// /Type /Pages
// /Count 148
// /Kids [ 4 0 R 5 0 R 6 0 R 7 0 R 8 0 R 9 0 R 10 0 R 11 0 R 12 0 R 13 0 R 14 0 R 15 0 R 16 0 R
// >>
// endobj
