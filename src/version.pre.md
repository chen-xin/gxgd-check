2017???? 版本1.1.2
==================


代码优化
--------
- 修改webpack.renderer.config.js, 根据package.json的name来确定renderer的webpack入口是main.js还是main.check.js
- 增加build/pack.js，不再直接使用electron-packager命令行打包，并在打包后自动生成更新包。更新包的版本号来自package.json
- 修改landing.vue, 根据package.json的version显示版本号