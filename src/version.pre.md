20170905 版本1.1.2
==================

缺陷修复：
-------
- 修复excel文件输出无数据问题

界面优化：
-------
- 输出excel文件时显示加载环

已知存在问题：
-----------
- 选择的档案目录下如果有上次核查记录，有时会卡住。如果几秒内没看到结果，请关闭程序重新运行。

代码优化
--------
- 修改webpack.renderer.config.js, 根据package.json的name来确定renderer的webpack入口是main.js还是main.check.js
- 增加build/pack.js，不再直接使用electron-packager命令行打包，并在打包后自动生成更新包。更新包的版本号来自package.json
- 修改landing.vue, 根据package.json的version显示版本号