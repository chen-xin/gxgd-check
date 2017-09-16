<template>
  <div class="container">
    <el-popover
      ref="popover1"
      placement="right-start"
      title="核查规则"
      width="400"
      trigger="hover"
      content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
      <div>
        <ul>
          <li>档案盒及档案说明可找到对应目录或文件</li>
          <li>档案盒[ <u v-for="item in currentReqired.pak" :key="item">{{item}}、</u> ]</li>
          <li>档案[ <u v-for="item in currentReqired.doc" :key="item">{{item}}、</u> ]</li>
          <li>
            配置文件加载顺序(从后往前覆盖)
            <ol>
              <li><a href="#" @click.prevent="openConf">(配置目录下的)</a>GXGD_CHECK.default.json</li>
              <li><a href="#" @click.prevent="openConf">(配置目录下的)</a>GXGD_CHECK.json</li>
              <li>(核查目录下的)GXGD_CHECK.json</li>
            </ol>
          </li>
        </ul>
      </div>
    </el-popover>
    <div class="ver-info">
      <!-- <el-button @click="foo" type="text">版本：1.01</el-button> -->
      <a :href="versionInfo" target="_blank">版本：{{version}}</a>
    </div>
    <el-row class="banner" id="banner">
      数 据 核 查
    </el-row>
    <affix>
    <el-row class="row affix" v-loading.body="working">
      <el-col :span="16">
        <el-form :model="formInline" class="flex" @submit.native.prevent="afterSelectDir">
          <el-input
            v-model="formInline.selectedDir"
            placeholder="请选择目录..."
            size="large"
            :disabled="working"></el-input>
          <el-button @click="selectDir" icon="more" :disabled="working"></el-button>
          <el-tooltip class="item" effect="light" content="将会清除上次核查记录" placement="top-start">
            <el-button @click="afterSelectDir(true)" icon="caret-right" :disabled="working">重新检查</el-button>
          </el-tooltip>
          <el-button @click="saveXlsx" >输出问题数据</el-button>
        </el-form>
      </el-col>
    </el-row>
    </affix>
    <el-row class="row">
      <el-steps :active="currentStep" :process-status="workStatus" v-popover:popover1>
        <el-step title="选择数据目录" description="目录必须存在.obj和.pak文件。"></el-step>
        <el-step :title="'读取磁盘文件'+ (working ? processingFile : '')" description="检查目录下所有文件名称、日期、大小等信息。"></el-step>
        <el-step :title="'装载文件数据' + (working ? processingLine : '')" description="装载.obj和.pak文件信息，装载上次核查结果（如果有）。"></el-step>
        <el-step title="核查数据" description="核查数据并保存核查结果供查阅。"></el-step>
        <el-step title="完成" :description="(currentStep == 5 ? rowStat : '') + '现在您可以浏览核查结果了！'"></el-step>
      </el-steps>
    </el-row>

    <el-collapse-transition>
    <board v-if="showBoard" :requiredFields="currentReqired"></board>
    </el-collapse-transition>

    <div class="data-area" v-if="!showBoard">
      <el-tabs v-model="activeTab" @tab-remove="removeTab" @tab-click="tabClick">
        <el-tab-pane
          v-for="(item, index) in tabs"
          :key="item.id"
          :label="item.title"
          :closable="item.closable"
          :name="item.id">
          <dataview v-if="item.type!='file'" :queryDef="item.queryDef" :dbc="dbc" @data-link="openTab"></dataview>
          <filePreview
            v-if="item.type=='file'"
            :src="item.target">
          </filePreview>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import path from 'path'

import affix from '../affix.vue'
import GxgdFile from '../../../check/GxgdFile.js'
import GxgdCheckDb from '../../../check/db.js'
import GxgdCheckConf from '../../../check/conf.js'
import board from './board.vue'
import lorem from '../lorem.vue'
import dataview from './dataview.vue'
import filePreview from './filePreview.vue'
import versionInfo from '../../../version.md'
const { name: productName, version } = require('../../../../package.json')

export default {
  data () {
    return {
      // base data
      fileData: GxgdFile,
      conf: GxgdCheckConf,
      dbc: GxgdCheckDb,
      currentStep: 0,
      workStatus: 'wait',
      isAffix: false,
      formInline: {
        selectedDir: ''
      },
      showBoard: true,
      working: false,
      // processing info
      processingLine: 0,
      processingFile: 0,
      traversDirPrompt: '',
      // tabs data
      defaultTabs: [],
      tabs: [
        { type: 'pak', id: 'pak', title: '档案盒', closable: false, queryDef: { table: 'pak', args: {} } },
        { type: 'doc', id: 'doc', title: '档案', closable: false, queryDef: { table: 'doc', args: {} } }
      ],
      openedTabs: ['pak', 'doc', 'pak'],
      activeTab: 'pak',
      // file preview data
      fileLoading: false,
      // testing
      version: productName === 'gxgd-check' ? version : '',
      versionInfo: versionInfo,
      appPath: ''
    }
  },
  computed: {
    dirTree () {
      return this.fileData && this.fileData.dirTree ? this.fileData.dirTree.children : []
    },
    currentReqired () {
      return this.conf.requiredFieldNames
    },
    rowStat () {
      let pdfInfo = ''
      if (this.dbc.pages && this.dbc.pages.length > 0) {
        let pdfPages = (this.dbc.pages.find(item => item.file_type === 'pdf') || {})
        if (pdfPages) {
          pdfInfo = `, 其中PDF文件${pdfPages.files}个共${pdfPages.pages}页。`
        }
        return `共处理文件${this.dbc.rows.doc.total}个${pdfInfo}`
      } else return ''
    }
  },
  components: {
    affix,
    dataview,
    filePreview,
    board,
    lorem
  },
  created () {
    let confDir = this.$electron.remote.app.getPath('userData')
    this.conf = new GxgdCheckConf(confDir)
    GxgdCheckConf.writeDefault(confDir)
  },
  methods: {
    foo () {

    },
    openConf () {
      this.$electron.shell.openItem(this.$electron.remote.app.getPath('userData'))
    },
    removeTab (name) {
      this.tabs = this.tabs.filter(item => item.id !== name)
      this.openedTabs = this.openedTabs.filter(item => item !== name)
      if (this.activeTab === name) {
        this.activeTab = this.openedTabs[this.openedTabs.length - 1]
      }
    },
    openTab (arg) {
      if (!this.tabs.find(value => value.id === arg.id)) {
        arg = arg.type === 'file'
          ? { ...arg, target: path.join(path.dirname(this.formInline.selectedDir), arg.target) }
          : { ...arg, queryDef: { table: arg.type, args: { doc_pack: arg.id } } }
        this.tabs.push(arg)
      }
      this.activeTab = arg.id
      this.openedTabs.push(arg.id)
    },
    tabClick (tab) {
      if (this.openedTabs[-1] !== tab.name) {
        this.openedTabs.push(tab.name)
      }
    },
    saveXlsx () {
      this.working = true
      this.dbc.saveToXlsx()
        .then(savedFile => { this.$message(`文件已保存到 [ ${savedFile} ]`); this.working = false })
        .catch(err => { this.$message(err); this.working = false })
    },
    selectDir () {
      this.$electron.remote.dialog.showOpenDialog(
        {Title: '选择文件', properties: ['openDirectory']},
        (fileNames) => {
          if (fileNames && fileNames.length > 0) {
            this.formInline.selectedDir = fileNames[0]
            this.afterSelectDir()
          }
        })
    },
    afterSelectDir (reset = false) {
      this.$message('正在处理，请稍候...')
      this.working = true
      this.fileData = new GxgdFile(this.formInline.selectedDir, this.$electron.remote)
      this.conf.setWorkingDir(this.formInline.selectedDir)
      let newDbc = new GxgdCheckDb(this.formInline.selectedDir, this.conf)

      this.fileData.on('readLine', (line, table) => {
        this.processingLine++
        if (line) {
          newDbc.onGetLine(line, table)
        } else {
          console.log('EMPTY Line encontered:', this.processingLine, table, line)
        }
      })

      this.fileData.on('getDirs', dirInfos => {
        this.processingFile += dirInfos.length
        newDbc.onGetDir(dirInfos)
        this.traversDirPrompt = '目录: ' + this.processingFile
      })

      this.fileData.on('getFiles', fileInfos => {
        this.processingFile += fileInfos.length
        newDbc.onGetFile(fileInfos)
        this.traversDirPrompt = '文件: ' + this.processingFile
      })

      return this.fileData.validataDir()
        .then(({foundFiles, hasResult}) => {
        // TODO: delay dbc change
        // this.dbc = new GxgdCheckDb(this.formInline.selectedDir)
          if (!hasResult || reset) {
            this.workStatus = 'process'
            this.currentStep = 1
            return newDbc.init()
              .then(() => { this.currentStep = 2; return this.fileData.traversDir() })
              .then(() => { this.currentStep = 3; return this.fileData.readLines() })
              .then(() => { this.currentStep = 4; return newDbc.flushLines() })
              .then(() => { this.currentStep = 5; return this.$message.success('完成！') })
          } else {
            this.currentStep = 5
            this.$message.info('发现上次核查结果，直接加载..')
            return true
          }
        })
        .then(() => newDbc.countPages()) // .then(rows => { this.dataRows = rows })
        .then(() => {
          this.dbc = newDbc
          this.showBoard = false
          this.workStatus = 'success'
          this.tabs = this.tabs.slice(0, 2) // [ ...this.defaultTabs ]
          this.openedTabs = ['pak', 'doc', 'pak']
          this.working = false
          this.processingLine = 0
          this.processingFile = 0
          return true
        })
        .catch(err => {
          console.log('captured:', err)
          this.$message.error(err.toString())
          this.workStatus = 'error'
          this.working = false
          this.processingLine = 0
          this.processingFile = 0
        })
    }
  }
}
</script>

<style scoped>
.rule-list {
  font-size: 80%;
  padding: 5px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
.ver-info {
  background: #2d8cf0;
  padding: 20px;
}
.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2d8cf0;
  height: 200px;
  font: bold 60px "微软雅黑";
  color: white;
}
.row {
  padding:20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.data-bar {
  padding: 10px 10px;
}

.box-card {
  width: 300px;
}

.flex{
  display: flex;
}

.file-selector {
  height: 200px;
}

.affix {
  background: #2d8cf0  ;
  opacity: 1;
}

.padding-off {
  padding-top: 200px;
}

.data-area {
  width: 99%;
}
</style>
