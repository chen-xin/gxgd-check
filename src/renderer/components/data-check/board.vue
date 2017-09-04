<template>
    <el-row class="row">
      <el-card class="info-card" header="简介">
        <p><i class="el-icon-star-off leading-star"></i>核查档案文件包，检查是否存在错误数据</p>
        <p><i class="el-icon-star-off leading-star"></i>输出问题数据清单</p>
        <p><i class="el-icon-star-off leading-star"></i>记录更正情况（并没有）</p>
        <p><i class="el-icon-star-off leading-star"></i>保存核查状态，下次选择相同目录自动加载</p>
        <p><i class="el-icon-star-off leading-star"></i>浏览档案内容</p>
        <hr/>
        <p></p>
        建议运行环境：64位操作系统， 8G以上内存，1920*1800显示分辨率。
      </el-card>

      <el-card class="info-card" header="操作步骤">
        <el-steps :space="60" :active="4" direction="vertical">
          <el-step title="选择目录" description="选择包含.pak和.obj文件的档案目录"></el-step>
          <el-step title="执行自动核查" description="如果存在上次核查记录，则加载，否则自动开始核查"></el-step>
          <el-step title="检查问题数据" description="浏览，查阅问题情况，输出问题清单"></el-step>
          <el-step title="完成数据整改" description="到报盘系统完成数据整改，并对修改情况进行记录"></el-step>
        </el-steps>
      </el-card>

      <el-card class="info-card" header="核查规则">
        <ul class="rule-list">
        <li>档案盒及档案说明可找到对应目录或文件</li>
        <!-- <li>档案盒[<u>标题</u>、<u>编号</u>、<u>保管单位</u>、<u>总资料类别</u>、<u>类目</u>、<u>路径</u>]字段不为空</li>
        <li>档案[<u>标题</u>、<u>编号</u>、<u>档案盒</u>、<u>保管单位</u>、<u>总资料类别</u>、<u>资料类别</u>、<u>类目</u>、<u>路径</u>]字段不为空</li> -->
        <li>档案盒[ <u v-for="item in requiredFields.pak" :key="item">{{item}}、</u> ]</li>
        <li>档案[ <u v-for="item in requiredFields.doc" :key="item">{{item}}、</u> ]</li>

        <li>
          配置文件加载顺序
          <el-button @click="openConf" type="text">(配置目录下的)</el-button>
          GXGD_CHECK.default.json > GXGD_CHECK.json > (核查目录下的)GXGD_CHECK.json，
           由后往前覆盖
        </li>
        </ul>
      </el-card>
    </el-row>
</template>
<script>
export default {
  props: {
    requiredFields: {}
  },
  methods: {
    openConf () {
      this.$electron.shell.openItem(this.$electron.remote.app.getPath('userData'))
    }
  }

}
</script>

<style scoped>
em {
  color: darkblue;
}

row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-card {
  height: 400px;
  width: 380px;
}

.leading-star {
  padding-right: 10px;
  color: gold;
}

.leading-info {
  padding-right: 10px;
  font-size: 150%;
  color: forestgreen;
}

u {
  color: LightSeaGreen   ;
  font-weight: bold;
}

.rule-list {
  list-style-type:upper-roman;
  line-height: 150%;
}

.rule-list li {
  padding-bottom: 1em;
}

</style>
