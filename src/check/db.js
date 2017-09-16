// const conf = require('./config.json')
// var dbc = require('knex')(conf)

import knex from 'knex'
import path from 'path'
import fs from 'fs'
import XlsxPopulate from 'xlsx-populate'
import { newDocFields, newPakFields, line2Data, requiredFields } from './field_defs.js'
import QueryComposer from './knexQuerycomposer.js'
import hash from 'hash.js'

const dataNames = { doc: newDocFields, pak: newPakFields }
const queryComposer = new QueryComposer()
// const checkRecord = {errors: 0, error_text: '', fixed: false, line: ''}

const whereDefs = {
  pak: {
    title: 'fullText',
    uri: 'fullText',
    error_text: 'fullText',
    errors: 'between',
    [queryComposer.MAIN_SEARCH]: { title: 'fullText', uri: 'fullText', error_text: 'fullText' }
  },
  doc: {
    title: 'fullText',
    uri: 'fullText',
    error_text: 'fullText',
    doc_pack: 'in',
    errors: 'between',
    [queryComposer.MAIN_SEARCH]: { title: 'fullText', uri: 'fullText', error_text: 'fullText' }
  }
}

var dbid = 0

function normalizeFieldDefs (defs) {
  return typeof defs === 'string' ? dataNames[defs]() : typeof defs === 'function' ? defs() : defs
}

export default class GxgdCheckDb {
  constructor (rootDir, checkConf) {
    this.rootDir = rootDir
    this.conf = checkConf
    this.__id = ++dbid
    this.__rootStem = path.basename(rootDir)
    this.requiredFields = requiredFields
    this.rows = {doc: {total: 0, errors: 0, name: '档案'}, pak: {total: 0, errors: 0, name: '档案盒'}}
    this.pages = []
    this.checkBuff = { doc: { data: [], dir: [] }, pak: { data: [], dir: [] } }
    this.dbFile = path.resolve(rootDir, 'gxgd_check.db')
    this.dbc = knex({
      debug: process.env.NODE_ENV === 'development ', // -- never show, make client slow
      client: 'sqlite3',
      connection: { filename: this.dbFile }
    })
    this.processingLine = 0
    this.dataHash = ''
    this.confHash = Object.keys(this.conf.requiredFields).sort().reduce(
      (b, table) => {
        b.update(this.conf.requiredFields[table].sort((a, b) => a.field > b.field).reduce(
          (a, field) => {
            a.update(field.field)
            return a
          }, hash.sha256()).digest('hex'))
        return b
      }, hash.sha256()).digest('hex')
  }

  destroy () {
    this.dbc.destroy().then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          fs.unlink(this.dbFile, err => {
            if (err) {
              reject(err)
            } else {
              resolve(true)
            }
          })
        }, 1)
      })
    })
  }

  clean () {
    return Promise.all(Object.keys(this.rows).map(key => this.dbc(key).delete()))
  }

  init () {
    return Promise.all([
      this.__createTable('doc', 'doc', ['uuid_v4', 'doc_pack']),
      this.__createTable('pak', 'pak', ['uuid_v4'])
    ])
      .then(() => this.clean())
  }

  pageQuery (table, args, paginationInfo) {
    return queryComposer.pageQuery2(this.dbc(table), '*', whereDefs[table], args, '', paginationInfo)
  }

  __createTable (tableName, fieldDefs, indexes = []) {
    return this.dbc.schema.createTableIfNotExists(tableName, table =>
      Promise.all([
        ...Object.keys(normalizeFieldDefs(fieldDefs)).map(key => table.string(key)),
        table.integer('errors'),
        table.string('error_text'),
        table.boolean('fixed'),
        table.text('line'),
        table.integer('pages')
      ])
        .then(() => Promise.all(
          indexes.map(col => table.index(col)))))
  }

  countRows () {
    let keys = Object.keys(this.rows)
    return Promise.all(keys.map(key => this.countRow(key)))
      .then(() => this.countPages())
      .then(() => this.rows)
  }

  countPages () {
    return this.dbc('doc').select('file_type').count('* as files').sum('pages as pages').groupBy('file_type')
      .then(data => {
        this.pages = data
        return data
      })
  }

  countRow (table, args = {}) {
    return Promise.all([
      this.dbc(table).where(args).count('* as rowCount'),
      this.dbc(table).where('errors', '>', 0).andWhere({ ...args }).count('* as rowCount')
    ])
      .then(data => data.map(result => result.length > 0 ? result[0].rowCount : -1))
      .then(data => {
        this.rows[table] = { ...this.rows[table], total: data[0], errors: data[1] }
        return this.rows[table]
      })
  }

  onGetLine (line, table) {
    let data = { ...line2Data(line, normalizeFieldDefs(table)) }
    let result = this.conf.requiredFields[table]
      .filter(col => !data[col.field])
      .map(col => col.label)
      .join(', ')

    if (result !== '') result = `[${result}] 为空。 `
    // TODO: fasten algorithm
    // let stat = this.checkBuff[table].dir.find(value => `${this.__rootStem}/${value.uri}` === data.uri)
    // if (stat) {
    //   if (table === 'doc') {
    //     data.size = stat.size
    //     data.modify_time = stat.modify_time
    //   }
    // } else {
    //   result += '找不到对应文件/目录。'
    // }

    let row = {
      ...data,
      error_text: result,
      errors: result ? 1 : 0,
      fixed: false,
      line: line
    }
    this.checkBuff[table].data.push(row)
    return result
  }

  onGetDir (dirs) {
    this.checkBuff.pak.dir = [...this.checkBuff.pak.dir, ...dirs]
  }

  onGetFile (files) {
    this.checkBuff.doc.dir = [...this.checkBuff.doc.dir, ...files]
  }

  saveToXlsx () {
    const CHARORD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' // suppose we don't have more than 26 columns..
    let targetFile = path.resolve(this.rootDir, 'check_result.xlsx')

    // let additionCols = {
    //   error_text: {label: '错误信息', len: 200},
    //   fixed: {label: '已修复', len: 50},
    //   line: {label: '原始数据行', len: 1000}
    // }

    let additionCols = [
      { field: 'error_text', label: '错误信息', len: 200 },
      { field: 'fixed', label: '已修复', len: 50 },
      { field: 'line', label: '原始数据行', len: 1000 }
    ]

    let tables = Object.keys(this.requiredFields)
    let colDefsModified_ = tables.map(table => [ ...this.requiredFields[table], ...additionCols ])
    let exportColNames = tables.map((table, index) => colDefsModified_[index].map(def => def.field))

    return Promise.all(tables.map((table, index) => this.dbc(table).where({errors: 1}).select(exportColNames[index])))
      .then(data =>
        tables.map((table, tableIndex) =>
          [exportColNames[tableIndex].reduce((rowObj, field, fieldIndex) =>
            ({ ...rowObj, [field]: colDefsModified_[tableIndex][fieldIndex].label }), {}), ...data[tableIndex]]
            .map(row => exportColNames[tableIndex].map(col => row[col]))))
      .then(data =>
        XlsxPopulate.fromBlankAsync()
          .then(workbook => {
            for (let i = 1; i < tables.length; i++) {
              workbook.addSheet(`New ${i}`)
            }

            let ranges = tables.map((table, index) =>
              workbook.sheet(index).range(`A1:${CHARORD[exportColNames[index].length - 1]}${data[index].length}`)
            )

            // Modify the workbook.
            tables.forEach((table, tableIndex) => {
              workbook.sheet(tableIndex).name(this.rows[table].name)
              ranges[tableIndex].value(data[tableIndex])
              // ranges[tableIndex].style('verticalAlignment', 'center')
              // workbook.sheet(tableIndex).range(`A1:${CHARORD[exportColNames[tableIndex].length - 1]}1`).style({fill: 'C0C0C0', bold: true})
              // workbook.sheet(tableIndex).row(1).height(20)

              // workbook.sheet(tableIndex).rows.height(20)

              // for (let i = 1; i < data[index].length; i++) {
              //   workbook.sheet(index).row(i).height(20)
              // }
              for (let i = 0; i < exportColNames[tableIndex].length; i++) {
                workbook.sheet(tableIndex).column(CHARORD[i]).width(colDefsModified_[tableIndex][i].len / 5)
              }
            })

            return workbook.toFileAsync(targetFile).then(() => targetFile)
          })
      )
  }

  updateFileStats () {
    this.processingLine = 0
    function gen (data, sort) {
      data.sort(sort)
      // console.log(data.map(value => value.uri))
      return function* () {
        for (let item of data) {
          yield item
        }
      }
    }

    // let columns = Object.keys(this.checkBuff).reduce(
    //   (result, table) => ({ ...result, [table]: Object.keys(this.checkBuff[table].data[0]).sort() }), {})
    // let sha256 = hash.sha256()
    for (let type of Object.keys(this.checkBuff).sort()) {
      let dirs = gen(this.checkBuff[type].dir, (a, b) => a.uri > b.uri ? 1 : -1)()
      let rows = gen(this.checkBuff[type].data, (a, b) => a.uri > b.uri ? 1 : -1)()
      let d = dirs.next().value

      for (let row of rows) {
        this.processingLine++
        if (type === 'doc') row.pages = 0
        while (d && `${this.__rootStem}/${d.uri}` < row.uri) { d = dirs.next().value }
        if (!d || `${this.__rootStem}/${d.uri}` !== row.uri) {
          // console.log('debug', `${d.uri}@${row.uri}`, !!d)
          row.errors += 1
          row.error_text += '找不到对应文件/目录。'
        } else if (type === 'doc') {
          row.size = d.size
          row.modify_time = d.modify_time
          row.pages = d.pages
          // sha256.update(columns[type].reduce((result, column) => result + row[column], ''))
        }
        // sha256.update(`${row.line}${row.size}${row.modify_time}`)
      }
    }
    // this.dataHash = sha256.digest('hex')
  }

  // Slow Algorithm
  updateFileStats2 () {
    let sha256 = hash.sha256()
    for (let table of Object.keys(this.checkBuff)) {
      let dir = this.checkBuff[table].dir
      for (let row of this.checkBuff[table].data) {
        let stat = dir.find(value => `${this.__rootStem}/${value.uri}` === row.uri)
        if (stat) {
          if (table === 'doc') {
            row.size = stat.size
            row.modify_time = stat.modify_time
          }
        } else {
          // console.log(row.title, '找不到对应文件/目录。')
          row.errors += 1
          row.error_text += '找不到对应文件/目录。'
        }
        sha256.update(`${row.line}${row.size}${row.modify_time}`)
      }
    }
    this.dataHash = sha256.digest('hex')
  }

  // Never do: `foo.on('event', dbc.insertLine)`
  // in the above code, `this` in the following function refers to foo object
  flushLines () {
    // console.log(new Date())
    this.updateFileStats()
    // console.log(new Date())
    // console.log(JSON.stringify(this.checkBuff))
    return this.dbc.batchInsert('pak', this.checkBuff.pak.data, 20)
      .then(() => this.dbc.batchInsert('doc', this.checkBuff.doc.data, 20))
      .then(() => { this.checkBuff = { doc: { data: [], dir: [] }, pak: { data: [], dir: [] } }; return true })
  }
}
