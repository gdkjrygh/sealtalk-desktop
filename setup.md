## PC端打包配置说明
　　<font color="red">PC 端支持的平台</font>          
　　**OS X**        
　　　　对于 OS X 系统仅有64位的二进制文档，支持的最低版本是 OS X 10.8。

　　**Windows**        
　　　　仅支持 Windows 7 及其以后的版本，之前的版本中是不能工作的。        
　　　　对于 Windows 提供 x86 和 amd64 (x64) 版本的二进制文件。需要注意的是ARM 版本的 Windows 目前尚不支持.

1. 安装 nodejs5.3.0，Windows必须使用32位版本，请严格使用下面链接提供的安装包

   <font color="red">说明：需配置Windows和Mac两套环境</font><br>

   Windows: [https://nodejs.org/dist/v5.3.0/node-v5.3.0-x86.msi](https://nodejs.org/dist/v5.3.0/node-v5.3.0-x86.msi) （打包32位的安装程序，兼容32/64位系统）
   
   Mac: [https://nodejs.org/dist/v5.3.0/node-v5.3.0.pkg](https://nodejs.org/dist/v5.3.0/node-v5.3.0.pkg)

2. 源码下载 

3. 按照源码里的 README.md 配置开发环境，请注意以下问题：

    *  安装开发环境需翻墙
        <br>或配置淘宝镜像 : 命令行输入 `npm --registry https://registry.npm.taobao.org info underscore`  [其他方法参考](http://www.cnblogs.com/trying/p/4064518.html)
    *  安装出错需清空已安装模块(node_modules 目录下除 RongIMLib.node 之外的其他文件)重新安装
    *  安装成功后请确认以下模块版本
        <br>electron 必须用 <font color="red">1.4.3</font> 版本； 
        <br>electron-builder 必须用 <font color="red">2.11.0 以下</font>版本 
        <br>**检查方法:**  进入 `项目目录/node_modules/模块名称/package.json`，<font color="red">"version"</font> 值即为版本号

4. 修改配置文件（源码中的config.js），以下两项为必填项，更多配置参考config.js中注释：
    *  APP_ONLINE     WebIM 登录页地址
    *  REPORT_URL     错误上报页面   

5. 打包(可参考 README.md)
    * Window: 
   1.   执行 `npm run package:win`
   2.   打开 [inno setup](http://www.jrsoftware.org/isinfo.php) 项目文件，编译制作安装包. 项目目录下有 inno setup 的示例项目文件 desktop_setup.iss 供参考
   3.   安装协议变更：更新项目根目录下 LICENSE 文件内容
    * Mac: 
   1.   确保安装开发者证书(Developer ID certificate)，在 script/codesign.bash 中正确配置签名参数(具体参照 [https://pracucci.com/atom-electron-signing-mac-app.html](https://pracucci.com/atom-electron-signing-mac-app.html))
   2.   执行 `npm run package:mac`
   3.   执行  `npm run installer:mac`


### 重要概念
1. 打包程序依赖的工具
    -    electron-builder    https://github.com/electron-userland/electron-builder/tree/v2.9.3
    -    electron-packager   https://github.com/electron-userland/electron-packager
    -    electron-winstaller https://www.npmjs.com/package/electron-winstaller
    -    gulp                https://www.npmjs.com/package/gulp

2. 签名
    -    Mac app 需要签名(sign your app)，可以参考 https://pracucci.com/atom-electron-signing-mac-app.html
3. 打包命令
    -    package.json
    -    gulpfile.js
