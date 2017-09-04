var dbid = 0

export default class RowStore {
  constructor (db) {
    this.__id = ++dbid
    this.db = db
    this.paginationInfo = { rowCount: 0, rowsPerPage: 20, page: 1 }
    this.table = ''
    this.rows = []
    this.args = {}
    this.columes = {}
  }

  pageQuery (table, args, page = 1) {
    args = args || {}
    let tableChanged = this.table !== table
    let argsChanged = Object.keys(args).length !== Object.keys(this.args).length ||
    !Object.keys(args).reduce((result, field) => JSON.stringify(args[field]) === JSON.stringify(this.args[field]) && result, true)

    // console.log('pageQuery..', this.table, this.__id, this.db.__id)
    if (tableChanged || argsChanged) {
      this.table = table
      this.columes = this.db.requiredFields[table]
      this.paginationInfo.rowCount = 0
      this.args = args || {}
    }

    if (tableChanged || argsChanged || this.paginationInfo.page !== page) {
      // console.log('REQUERY..')
      this.paginationInfo.page = page
      this.db.pageQuery(table, args, this.paginationInfo)
        .then(data => {
          this.rows = data.rows
          this.paginationInfo = data.paginationInfo
        })
    }
  }

  getPage (page) {
    this.pageQuery(this.table, this.args, page)
    // if (this.paginationInfo.rowCount !== 0) {
    //   this.paginationInfo.page = page
    //   this.pageQuery(this.table, this.args)
    // }
  }
}
