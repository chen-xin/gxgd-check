const fs = require('fs')
const readline = require('readline')
const path = require('path')
// const walk require('walk')
const glob = require('glob')

function getPDFPageCount (fileName) {
  return new Promise((resolve, reject) => {
    let pages = 0
    let linesReaded = 0
    let pdfStyle = ''
    let found = false

    const rl = readline.createInterface({
      input: fs.createReadStream(path.resolve('.', fileName))
    })

    rl.on('line', (line) => {
      if (found) return
      linesReaded++
      let pageLine = line.match(/^\/N (\d+)/)
      if (pageLine) { // /\/N \d+\/T/
        pages = pageLine[1] * 1
        pdfStyle = '^/N'
        found = true
      } else {
        pageLine = line.match(/\/Type\/Pages\/Count\s+(\d+)/)
        if (pageLine && !line.match(/\/Parent/)) {
          pages = pageLine[1] * 1
          pdfStyle = '/Type/Pages/Count'
          found = true
        }
      }
      if (found) {
        console.log([fileName, pages, linesReaded, pdfStyle, line])
        rl.close()
        resolve([fileName, pages, linesReaded, pdfStyle, line])
      }
    })
  })
}

function getPages (name) {
  let stat = fs.statSync(name)
  if (stat.isFile()) {
    return getPDFPageCount(name)
  } else if (stat.isDirectory()) {
    glob(path.join(name, '*.pdf'), (err, pdfs) => {
      if (err) {
        return Promise.reject(err)
      } else {
        return Promise.all(pdfs.map(pdf => getPDFPageCount(pdf)))
      }
    })
  }
  return Promise.reject(new Error('Unexpected argument:' + name, stat))
}

// "/Type/Pages/Count 88/Parent" matches "/Type/Pages/Count 8"
// <</Type/Pages/Count 251/Kids 4 0 R >>
// <</Kids[6287 0 R 6288 0 R]/Type/Pages/Count 188>>
// <</Kids[3389 0 R 3730 0 R 4136 0 R 4537 0 R 4845 0 R 5185 0 R 5484 0 R 5767 0 R 6068 0 R]/Type/Pages/Count 88/Parent 6289 0 R>>
// '../gxgd_desktop/.data/REPOSITORY/sample_repo/Wired UK - January-February 2016.pdf'
// ../gxgd_desktop/.data/REPOSITORY/sample_repo/New Scientist - Christmas And New Year Special (December 2015) [CPUL].pdf
// /Type /Catalog
// /Pages 14236 0 R

// format 1
// 6289 0 obj
// <</Kids[6287 0 R 6288 0 R]/Type/Pages/Count 188>>
// endobj
// 6290 0 obj
// <</Type/Catalog/Pages 6289 0 R>>
// endobj

// format 2
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

getPages(process.argv[2])
  .then(data => console.log(data))
  .catch(err => console.log(err))
