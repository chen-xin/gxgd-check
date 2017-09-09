import path from 'path'
import stringify from 'json-stringify-pretty-compact'
import fs from 'fs'
import {requiredFields} from './field_defs.js'

function fileds2Conf (fieldDef) {
  let result = {}
  for (let key of Object.keys(fieldDef)) {
    result[key] = fieldDef[key].reduce((total, item) => ({ ...total, [item.label]: item.required }), {})
  }
  return result
}

export default class GxgdCheckConf {
  constructor (dataDir, workingDir) {
    this.dataDir = dataDir
    this.defaultConf = {file: path.resolve(dataDir, 'GXGD_CHECK.default.json'), data: fileds2Conf(requiredFields)}
    this.globalConf = {file: path.resolve(dataDir, 'GXGD_CHECK.json'), data: {}}
    this.folderConf = {file: '', data: {}}
    if (workingDir) {
      this.setWorkingDir(workingDir)
    }
    this.requiredFields = this.getConf()
    this.requiredFieldNames = this.getFieldNames()
  }

  setWorkingDir (dir) {
    this.folderConf.file = path.resolve(dir, 'GXGD_CHECK.json')
    this.requiredFields = this.getConf()
    this.requiredFieldNames = this.getFieldNames()
    return this.requiredFields
  }

  static writeDefault (dataDir) {
    fs.writeFileSync(path.resolve(dataDir, 'GXGD_CHECK.default.json'), stringify(fileds2Conf(requiredFields)))
  }

  getFieldNames () {
    return Object.keys(this.requiredFields)
      .reduce((total, item) => ({...total, [item]: this.requiredFields[item].map(field => field.label)}), {})
  }

  getConf () {
    try {
      this.globalConf.data = JSON.parse(fs.readFileSync(this.globalConf.file))
    } catch (err) {
      this.globalConf.data = {}
    }

    try {
      this.folderConf.data = JSON.parse(fs.readFileSync(this.folderConf.file))
    } catch (err) {
      this.folderConf.data = {}
    }

    let result = {}

    for (let key of Object.keys(requiredFields)) {
      let conf = { ...this.defaultConf.data[key], ...this.globalConf.data[key], ...this.folderConf.data[key] }
      result[key] = requiredFields[key].filter(item => conf[item.label] === 1)
    }

    return result
  }

  files () {
    return {default: this.defaultConf.file, global: this.globalConf.file, folder: this.folderConf.file}
  }
}
