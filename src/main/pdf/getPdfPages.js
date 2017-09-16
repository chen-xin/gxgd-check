
global.DOMParser = require('./domparsermock.js').DOMParserMock
// Run `gulp dist-install` to generate 'pdfjs-dist' npm package files.
const pdfjsLib = require('pdfjs-dist')
// const path = require('path')
const fs = require('fs')
// Loading file from file system into typed array
// var data = new Uint8Array(fs.readFileSync(pdfPath));

exports.getPdfPage = function (pdfPath) {
  return pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) })
    .then(doc => doc.numPages)
}
