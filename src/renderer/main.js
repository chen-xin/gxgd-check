import Vue from 'vue'
import VueElectron from 'vue-electron'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import '../../static/font-awesome/css/font-awesome.css'

import App from './App'
import router from './router/index.js'

Vue.use(VueElectron)
Vue.use(ElementUI)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
