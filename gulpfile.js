'use strict';

var gulp = require('gulp');
var sequence = require('gulp-sequence');
var clean = require('gulp-clean');
var fs = require('fs-extra');
var argv = require('yargs')
      .option('platform', {
        alias: 'p',
        describe: 'choose a platform',
        choices: ['mac', 'darwin', 'windows','win', 'win32', 'win64'],
        default: 'darwin'
      })
      .argv;
var path = require('path');
var packager = require('electron-packager');
var builder = require('electron-builder');
var electronInstaller = require('electron-winstaller');

var packageJSON = require('./package.json');
var CURRENT_ENVIRONMENT = 'development';
var finalAppPaths = [];
const zip = require('gulp-zip');


gulp.task('zip', () => {
  var fileName = 'SealTalk-' + packageJSON.version + '-darwin-x64.zip';
	return gulp.src('build/SealTalk-darwin-x64/SealTalk.app')
		.pipe(zip(fileName))
		.pipe(gulp.dest('dist/osx'));
});

gulp.task('default', ['serve']);

gulp.task('cleanup:build', function() {
  var osInfo = getOSInfo();
  var arch = osInfo.arch;
  var platform = osInfo.platform;
  var src = './build/SealTalk-' + platform + '-' + arch;
  src = './build';
  return gulp
    .src([src], {
      read: false
    })
    .pipe(clean());
});

gulp.task('package', function(done) {
  var devDependencies = packageJSON.devDependencies;
  var devDependenciesKeys = Object.keys(devDependencies);
  var ignoreFiles = [
    // 'build',
    'dist',
    'dist2',
    'codesign.bash',
    'notice.txt',
    'gulpfile.js',
    'builder.json',
    'gruntfile.js',
    '.npminstall'
  ];

  devDependenciesKeys.forEach(function(key) {
    ignoreFiles.push('node_modules/' + key);
  });
  var osInfo = getOSInfo();
  var arch = osInfo.arch;
  var platform = osInfo.platform;

  // We will keep all stuffs in dist/ instead of src/ for production
  var iconFolderPath = './res';
  var iconPath;
  var productName = packageJSON.productName;
  productName += '-' + platform + '-' + arch;
  if (platform === 'darwin') {
    iconPath = path.join(iconFolderPath, 'app.icns');
    ignoreFiles.push('js/child.js');
  }
  else {
    iconPath = path.join(iconFolderPath, 'app.ico');
  }

  var ignorePath = ignoreFiles.join('|');
  var ignoreRegexp = new RegExp(ignorePath, 'ig');

  packager({
    'dir': './',
    'name': packageJSON.productName,
    'platform': platform,
    'asar': true,
    // 'asar-unpack': './node_modules/screenshot.framework/**',
    'asar-unpack-dir': 'node_modules/screenshot.framework',
    'arch': arch,
    'version': packageJSON.package.runtimeVersion,
    'out': './build',
    'icon': iconPath,
    'app-bundle-id': 'com.RCloud.SealTalk',   // OS X only
    'app-version': packageJSON.version,
    'build-version': packageJSON.version,
    'helper-bundle-id': 'SealTalk',// OS X only
    'ignore': ignoreRegexp,
    'overwrite': true,
    'app-copyright': packageJSON.copyright,
    'version-string': {
      'CompanyName': packageJSON.author,
      'FileDescription': packageJSON.description,
      'OriginalFilename': 'atom.exe',
      'ProductName': packageJSON.productName,
      'InternalName': packageJSON.productName
    }
  }, function(error, appPaths) {
    if (error) {
      console.log(error);
      process.exit(1);
    }
    else {
      // TODO
      // we should support to build all platforms at once later !
      // something like [ 'build/Kaku-darwin-x64' ]
      finalAppPaths = appPaths;
      done();
    }
  });
});

gulp.task('post-package', function(done) {
  var currentLicenseFile = path.join(__dirname, 'LICENSE');

  var promises = finalAppPaths.map(function(appPath) {
    var targetLicenseFile = path.join(appPath, 'LICENSE');
    var promise = new Promise(function(resolve, reject) {
      fs.copy(currentLicenseFile, targetLicenseFile, function(error) {
        if (error) {
          reject(error);
        }
        else {
          resolve();
        }
      });
    });
    return promise;
  });

  Promise.all(promises).then(function() {
    done();
  }).catch(function(error) {
    console.log(error)
    process.exit(1);
  });
});

gulp.task('build', function(callback) {
  var osInfo = getOSInfo();
  var tasks = [
    'cleanup:build',
    'package',
    'post-package'
  ];

  sequence(
    tasks
  )(callback);
});

gulp.task('createWindowsInstaller', function(done) {
  var osInfo = getOSInfo();
  var appDirectory = './build/SealTalk-win32-' + osInfo.arch;
  var outputDirectory = './dist/installer_' + osInfo.arch;
  var resultPromise = electronInstaller.createWindowsInstaller({
      appDirectory: appDirectory,
      outputDirectory: outputDirectory,
      authors: packageJSON.author,
      exe: packageJSON.productName + '.exe',
      setupIcon: './res/app.ico',
      setupExe: ' SealTalk_by_RongCloud_' + packageJSON.version + '.exe',
      noMsi: 'true',
      iconUrl: 'http://7i7gc6.com1.z0.glb.clouddn.com/image/sealtalk.ico',
      loadingGif: './res/loading.gif'
  });
  resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
});

function getOSInfo(){
  var arch = process.arch || 'ia32';
  var platform = argv.platform || process.platform;
  platform = platform.toLowerCase();
  // platform = argv.p;
  switch (platform) {
    case 'mac':
    case 'darwin':
      platform = 'darwin';
      arch = 'x64';
      break;
    case 'freebsd':
    case 'linux':
      platform = 'linux';
      break;
    case 'linux32':
      platform = 'linux';
      arch = 'ia32';
      break;
    case 'linux64':
      platform = 'linux';
      arch = 'x64';
      break;
    case 'win':
    case 'win32':
    case 'windows':
      platform = 'win32';
      arch = 'ia32';
      break;
    case 'win64':
        platform = 'win32';
        arch = 'x64';
        break;
    default:
      console.log('We don\'t support your platform ' + platform);
      process.exit(1);
      break;
  }
  return {platform:platform, arch:arch};
}
