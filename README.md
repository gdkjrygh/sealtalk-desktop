# sealtalk-desktop

## 资源使用说明

本项目仅作技术交流使用，非融云公司正式对外提供的技术服务. 项目用 [Electron](https://electron.atom.io/) 开发,技术细节请参考 https://electron.atom.io/docs/, 问题咨询请移步 https://discuss.atom.io/c/electron, 欢迎大家互相交流.

## Download Links

We do support Windows, Mac OS X,so please go check it :

http://www.rongcloud.cn/downloads

## Supported Languages

+ 简体中文
+ ... keep adding :)

## Setup Environment

Because we use npm to maintain our third party libraries, you have to make sure before doing anything, these needed stuffs are all installed already.

nodejs使用5.3.0，Windows必须使用32位版本
electron 必须用 1.4.3 版本； 
electron-builder 必须用 2.11.0 以下版本 

```
  npm install
  npm start
```
- 特别说明

  a. electron-prebuilt 1.0.0 以上的版本需要修改 electron-squirrel-startup 模块中 index.js 文件,需要将

  ```
  var app = require('app');
  ```
  改为

  ```
  var app = require('electron').app;
  ```
  b. 运行前务必将 conf.js 中配置参数修改,REPORT_URL: crash report 地址, APP_ONLINE: 网站地址, API_URL_MAC:MAC 自动更新地址, API_URL_WIN: WIN 自动更新地址 后面两个需要结合 auto-updater.js 中修改地址一起用

- 打包

    OS X

    ```
    gulp build -p mac
    ```
    Windows

    ```
    gulp build -p win32 or gulp build -p win64
    ```

- 制作安装包:

    OS X

    ```
    npm run installer:mac
    ```
    Windows

    ```
    npm run installer:win
    ```
- 发布(打包+签名+压缩+安装包):

    OS X

    ```
    npm run release:mac
    ```
    Windows

    ```
    npm run release:win
    ```
