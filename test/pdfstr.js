const fs = require('fs')
const readline = require('readline')
const path = require('path')

function pdfstr (fileName) {
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

let fileName = process.argv[2] || '../gxgd_desktop/.data/REPOSITORY/sample_repo/人月神话.pdf'

pdfstr(fileName)

// ../gxgd_desktop/.data/REPOSITORY/sample_repo/New Scientist - Christmas And New Year Special (December 2015) [CPUL].pdf
