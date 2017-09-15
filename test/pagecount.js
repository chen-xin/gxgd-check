const fs = require('fs')
const readline = require('readline')
const path = require('path')
// const walk require('walk')

function getPDFPageCount (fileName) {
  return new Promise((resolve, reject) => {
    let pages = 0
    let pdfStyle = ''

    const rl = readline.createInterface({
      input: fs.createReadStream(path.resolve('.', fileName))
    })

    rl.on('line', (line) => {
      if (line.match(/<<\/Type\/Pages\/Count/)) console.log(line)
      // if (line.indexOf('/N ') > 0) { // We've got the easy sort of PDF
      // console.log(line)
      if (line.match(/^\/N \d+/)) { // /\/N \d+\/T/
        pages = line.match(/\/N (\d+)/)[1]
        pdfStyle = '/N'
        rl.close()
        console.log([pages, pdfStyle])
        resolve([pages, pdfStyle])
      } else if (line.match(/\/Type\/Pages\/Count\s+(\d+)(?!\/Parent)/)) { // "/Type/Pages/Count 88/Parent" matches "/Type/Pages/Count 8"
        pages = line.match(/\/Type\/Pages\/Count\s+(\d+)(?!\/Parent)/)[1] // <</Type/Pages/Count 251/Kids 4 0 R >> <</Kids[6287 0 R 6288 0 R]/Type/Pages/Count 188>>
        pdfStyle = '/Count ... /Pages>>'
        rl.close()
        console.log([pages, pdfStyle, line])
        resolve([pages, pdfStyle])
      }
    })
  })
}

// <</Kids[3389 0 R 3730 0 R 4136 0 R 4537 0 R 4845 0 R 5185 0 R 5484 0 R 5767 0 R 6068 0 R]/Type/Pages/Count 88/Parent 6289 0 R>>

getPDFPageCount('D:/projects/gxgd-desktop/.data/REPOSITORY/sample_repo/Wired UK - January-February 2016.pdf')
  .then(data => console.log(data))
