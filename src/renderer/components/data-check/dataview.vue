<template>
  <div>
    <div style="padding-bottom: 5px;">
      <el-button-group>
        <el-button :icon="icon[0]" @click="filterByError()" :type="!errorFilter ? 'primary' : ''">{{icon[1]}}: {{rowStat.total}}</el-button>
        <el-button @click="filterByError([undefined, 1])" :type="errorFilter && errorFilter[0] == undefined ? 'primary' : ''"><i class="el-icon-circle-check" style="color:green"></i>通过: {{rowStat.total-rowStat.errors}}</el-button>
        <el-button @click="filterByError([1])" :type="errorFilter && errorFilter[0] == 1 ? 'primary' : ''"><i class="el-icon-circle-cross" style="color:red"></i>问题: {{rowStat.errors}}</el-button>
      </el-button-group>
      <el-input
        placeholder="筛选..."
        :on-icon-click="queryData"
        v-model="mainsearch.mainsearch"
        @change="userInput"
        style="width:500px;"
        icon="search">
      </el-input>
    </div>

    <el-pagination
      v-if="pagination.rowCount>pagination.rowsPerPage"
      layout="total, prev, pager, next"
      :page-size="pagination.rowsPerPage"
      :total="pagination.rowCount"
      @current-change="setPage">
    </el-pagination>

    <el-table
      v-if="tableRows.length > 0"
      :data="tableRows"
      border
      style="width: 100%; height: 900px;"
      stripe>
      <el-table-column
        type="index"
        fixed
        width="60">
      </el-table-column>

      <el-table-column
        v-if="tableRows.length > 0"
        fixed
        prop="title"
        label="标题"
        :width="200"
        show-overflow-tooltip>
        <template scope="scope">
          <el-button @click="openTab(scope.row)" type="text">
            <file-type :fileType="scope.row.file_type" v-if="scope.row.file_type"></file-type>
            {{scope.row.title}}
          </el-button>
        </template>
      </el-table-column>

      <el-table-column
        v-for="colume in columes"
        v-if="colume.field != 'title' "
        :key="colume.field"
        :prop="colume.field"
        :label="colume.label"
        :width="colume.len"
        show-overflow-tooltip>
      </el-table-column>

      <el-table-column
        fixed="left"
        prop="error_text"
        label="Errors"
        width="200"
        class="overflow">
      </el-table-column>
      <el-table-column
        v-if="rowStore.table == 'doc' "
        prop="pages"
        label="页数"
        width="100"
        class="overflow">
      </el-table-column>
    </el-table>

    <div class="pagination pagination-bottom">
      <el-pagination v-if="pagination.rowCount>pagination.rowsPerPage"
        layout="prev, pager, next"
        @current-change="setPage"
        :page-size="pagination.rowsPerPage"
        :total="pagination.rowCount">
      </el-pagination>
    </div>

  </div>
</template>

<script>
import path from 'path'
import RowStore from '../../../check/rowStore.js'
import fileType from '../file-type-i.vue'
export default {
  props: {
    queryDef: Object,
    dbc: Object
  },
  data () {
    return {
      rowStore: RowStore,
      rowStat: {total: 0, errors: 0},
      mainsearch: {mainsearch: ''},
      inputTimeout: 0,
      errorFilter: Array
    }
  },
  computed: {
    columes () {
      return this.rowStore.columes || []
    },
    tableRows () {
      return this.rowStore.rows || []
    },
    pagination () {
      return this.rowStore.paginationInfo || { rowCount: 0, rowsPerPage: 10, page: 1 }
    },
    icon () {
      return this.queryDef.table === 'pak' ? ['message', '档案盒'] : ['document', '档案']
    }
  },
  components: {
    fileType
  },
  methods: {
    getFileType (name) {
      path.extname(name)
    },
    filterByError (errors) {
      this.errorFilter = errors
      // this.filters = errors ? { ...this.filters, errors } : { mainsearch: this.filters.mainsearch }
      this.queryData()
    },
    setPage (page) {
      this.rowStore.getPage(page)
    },
    openTab (row) {
      if (this.rowStore.table === 'doc' && row.error_text.indexOf('找不到') >= 0) {
        this.$message.error(`找不到文件${row.uri}`)
      } else {
        let ev = this.rowStore.table === 'pak'
          ? { type: 'doc', id: row.uuid_v4, closable: true, title: `[${row.title}]的文件` }
          : { type: 'file', id: row.uuid_v4, target: row.uri, closable: true, title: `[${row.title}]的内容` }
        this.$emit('data-link', ev)
      }
    },
    queryData () {
      this.rowStore.pageQuery(this.queryDef.table, { ...this.queryDef.args, ...this.errorFilter ? {errors: this.errorFilter} : {}, ...this.mainsearch })
    },
    userInput (value) {
      clearTimeout(this.inputTimeout)
      this.inputTimeout = 0
      this.inputTimeout = setTimeout(this.queryData, 600)
    },
    init () {
      this.rowStore = new RowStore(this.dbc)
      this.errorFilter = [1]
      this.mainsearch = {mainsearch: ''}
      // this.filters = errors ? { ...this.filters, errors } : { mainsearch: this.filters.mainsearch }
      this.queryData()
      this.dbc.countRow(this.queryDef.table, this.queryDef.args)
        .then(data => { this.rowStat = data })
    }
  },
  watch: {
    dbc: function (val) {
      // triggers before datacheck...
      // console.log('dbc change..')
      this.init()
    }
  },
  mounted () {
    this.init()
  }
}
</script>

<style>
.no-overflow {
  overflow: hidden;
}

.pagination {
  display: flex;
  width: 100%;
  padding: 10px;
  justify-content: space-around;
}

.pagination-bottom {
  width: 95%;
  display: flex;
  justify-content: flex-end;
  padding: 10px;
}

</style>
