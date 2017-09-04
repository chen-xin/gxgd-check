
const MAIN_SEARCH = 'mainsearch'

const queryMethods = (fullTextMod) => ({
  fullText: (conn, field, arg) =>
    fullTextMod
      ? fullTextMod.fullText(conn, field, arg)
      : like(conn, field, arg),

  between: (conn, field, args) => {
    conn = args[0] === 0 || args[0] ? conn.where(field, '>=', args[0]) : conn
    conn = args[1] ? conn.where(field, '<', args[1]) : conn
    return conn
  },

  like: (conn, field, arg) =>
    like(conn, field, arg),

  in: (conn, field, arg) =>
    arg instanceof Array
      ? conn.whereIn(field, arg)
      : conn.where(field, arg)
})

function like (conn, field, arg) {
  let args = arg.split(/[\s,，.。]+/)
  return args.length > 1
    ? conn.where((subConn) => {
      for (let value of args) {
        subConn = subConn.andWhere(field, 'like', `%${value}%`)
      }
    })
    : conn.where(field, 'like', `%${arg}%`)
}

function pageQuery (query, paginationInfo) {
  paginationInfo.page = paginationInfo.page || 1
  let rowCountPromise

  if (!paginationInfo.rowCount) {
    rowCountPromise = query.query.clone().count('* as rowCount')
  } else {
    rowCountPromise = Promise.resolve([{rowCount: paginationInfo.rowCount}])
  }

  return rowCountPromise
    .then(data => {
      if (query.orderByRaw) {
        query.query = query.query.orderByRaw(query.orderByRaw)
      }
      if (query.countDistinct) {
        for (let item of query.countDistinct) {
          query.query = query.query.countDistinct(item)
        }
      }
      return query.query
        .select(query.fields)
        .limit(paginationInfo.rowsPerPage)
        .offset((paginationInfo.page - 1) * paginationInfo.rowsPerPage)
        .then(rows => {
          paginationInfo.rowCount = data[0].rowCount
          return { paginationInfo: paginationInfo, rows: rows }
        })
    })
}

export default class QueryComposer {
  constructor (fullTextMod) {
    this.queryMethods = queryMethods(fullTextMod)
    this.MAIN_SEARCH = MAIN_SEARCH
    this.TODAY = new Date()
  }

  queryConditionBuilder (conn, fields, args) {
    Object.keys(args || {}).forEach(field => {
      if (fields[field]) {
        conn = field === MAIN_SEARCH
          ? args[MAIN_SEARCH] ? conn.andWhere(trx => this.mainSearchBuilder(trx, fields[MAIN_SEARCH], args[field])) : conn
          : this.queryMethods[fields[field]](conn, field, args[field])
      }
    })
    return conn
  }

  mainSearchBuilder (conn, fields, arg) {
    let self = this
    for (let field of Object.keys(fields)) {
      conn = conn.orWhere(function () {
        self.queryMethods[fields[field]](this, field, arg)
      })
    }
    return conn
  }

  pageQuery2 (conn, select, whereDef, where, orderByRaw, paginationInfo) {
    return pageQuery({
      query: this.queryConditionBuilder(conn, whereDef, where),
      fields: select,
      orderByRaw: 'no asc'
    },
    paginationInfo)
  }
}
