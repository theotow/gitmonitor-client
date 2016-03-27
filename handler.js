var qrcode = require('qrcode-terminal');
var crontab = require('crontab');
var Promise = require('bluebird');
var gitUtils = require('git-utils');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var fetch = require('node-fetch');
var nodeGit = require('nodegit');
var _ = require('lodash');
var mkdirp = Promise.promisify(require('mkdirp'));
var exec = require('child_process').exec;
var nconf = require('nconf');

var CONFIG = {
  NAME: 'gitmonitor',
  SERVER: process.env.GITMONITOR_SERVER || 'http://dockerhost.dev:3000',
  CONFIGFILE: '/.gitmonitor/config.json',
};

module.exports = {
	// for testing only
  removeConfig: removeConfig, // done
  readConfig: readConfig, // done
  writeConfig: writeConfig, // done
  installCron: installCron, // done
  unInstallCron: unInstallCron, // done
  getRepoInfos: getRepoInfos, // done
  installRaw: installRaw, // done
  uninstallRaw: uninstallRaw, // done
  updateRaw: updateRaw, // done
  isInstalled: isInstalled,
  getAppBinaryPath: getAppBinaryPath,
  cronCommand: cronCommand,

	// interface
	install: install,
	uninstall: uninstall,
  settings: settings,
	update: update,
  CONFIG: CONFIG
};

function cronCommand(binary, repoPath){
  return  binary + ' update ' + repoPath;
}

function updateRaw(repoPath){
  return getRepoInfos(repoPath).bind({}).then(function(repoInfo) {
    this.repoInfo = repoInfo;
    return readConfig(repoPath);
  }).then(function(config) {
    return apiUpdateRepo({
      id: config.id,
      repoData: this.repoInfo
    });
  });
}

function settings(args) {
	var repoPath = getPath(args);
  var configFilePath = path.join(repoPath, CONFIG.CONFIGFILE);
  return isInstalled(configFilePath, 'uninstall').then(function() {
   return readConfig(repoPath);
  }).then(function(config){
    console.log('Scan the Qrcode with your '+CONFIG.NAME + '-App')
    qrcode.generate(config.id);
    console.log('You use as Server: ', config.server);
  }).catch(function(err) {
    showError(err);
  });
}

function update(args) {
	var repoPath = getPath(args);
  readConfig(repoPath).then(function(config){
    if(config.server){
      CONFIG.SERVER = config.server
    }
    return updateRaw(repoPath).then(function() {
      showSuccess('Updated Repo successfully');
    })
  }).catch(function(err) {
    showError(err);
  });
}

function apiCall(call) {
  return fetch(CONFIG.SERVER + call.route, {
    method: call.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(call.body)
  });
}

function apiUpdateRepo(data) {
  return apiCall({
    method: 'put',
    route: '/api/Repos/' + data.id,
    body: data.repoData
  });
}

function apiRemoveRepo(id) {
  return apiCall({
    method: 'delete',
    route: '/api/Repos/' + id
  });
}

function filterResponseId(data) {
  return data.json().then(function(dataInner) {
    return new Promise(function(resolve, reject) {
      if (dataInner.id) {
        resolve({
          id: dataInner.id
        });
      } else {
        reject('Failed to get Id from server');
      }
    });
  });
}

function readConfig(repoPath) {
  var configFilePath = path.join(repoPath, CONFIG.CONFIGFILE);
  return fs.readFileAsync(configFilePath).then(function(data) {
    return new Promise(function(resolve) {
      resolve(JSON.parse(data.toString()));
    });
  });
}

function getDirFromPath(myPath) {
  var dir = myPath.split('/')
  return dir.slice(0, dir.length - 1).join('/');
}

function removeConfig(repoPath) {
  var configFilePath = path.join(repoPath, CONFIG.CONFIGFILE);
  var dir = getDirFromPath(configFilePath);
  return fs.unlinkAsync(configFilePath).then(function() {
    return fs.rmdirAsync(dir);
  });
}

function writeConfig(config, repoPath) {
  var configFilePath = path.join(repoPath, CONFIG.CONFIGFILE);
  var dir = getDirFromPath(configFilePath);
  return mkdirp(dir).then(function() {
    return fs.writeFileAsync(configFilePath, JSON.stringify(config)).then(function() {
      return new Promise(function(resolve) {
        resolve(config);
      });
    })
  });
}

function apiAddRepo(data, repoPath) {
  return apiCall({
    method: 'post',
    route: '/api/Repos/',
    body: data
  }).then(filterResponseId).then(function(data){
    data.server = CONFIG.SERVER;
    return writeConfig(data, repoPath);
  });
}

function promiseFromChildProcess(args) {
  var deferred = Promise.pending();
  exec(args, function(err, out) {
    if (err) {
      deferred.reject(err);
    }
    deferred.resolve(out);
  });
  return deferred.promise;
}

function installCron(repoPath) {
  return Promise.promisify(crontab.load)().then(function(crontabIn) {
    return [
      getAppBinaryPath(),
      crontabIn
    ]
  }).spread(function(appName, crontabInner) {
    var deferred = Promise.pending();
    var command = cronCommand(appName.trim(), repoPath);
    if (crontabInner.jobs({
        command: command
      }).length > 0) {
      deferred.reject('Crontab already exists');
    }
    crontabInner.create(command, '* * * * *', 'added by ' + CONFIG.NAME);
    crontabInner.save(function(err) {
      if (err) {
        deferred.reject(err);
      }
      deferred.resolve();
    });
		return deferred.promise;
  });
};

function getAppBinaryPath(){
  return promiseFromChildProcess('which ' + CONFIG.NAME);
}

function unInstallCron(repoPath) {
  return Promise.promisify(crontab.load)().then(function(crontabIn) {
    return [
      getAppBinaryPath(),
      crontabIn
    ]
  }).spread(function(nodePath, crontabInner) {
    var deferred = Promise.pending();
    var command = cronCommand(nodePath.trim(), repoPath);
    crontabInner.remove({
      command: command
    });
    crontabInner.save(function(err) {
      if (err) {
        deferred.reject(err);
      }
      deferred.resolve();
    });
		return deferred.promise;
  });
};

function getRepoInfos(repoPath) {
  var deferred = Promise.pending();
  var repositoryU = gitUtils.open(repoPath);

  if (repositoryU) {
    nodeGit.Repository.open(repoPath).then(function(repository) {
      return Promise.all([
        repository.getHeadCommit(),
        repository.getCurrentBranch()
      ]);
    }).then(function(res) {
      var commit = res[0];
      var branch = res[1].toString();
      var output = {};
      output.branch = branch;
      output.name = path.basename(repoPath);
      output.author = commit.author().toString();
      output.message = commit.message();
			output.notified = false;
      output.isClean = (_.keys(repositoryU.getStatus()).length === 0);
      output.branches = repositoryU.getReferences().heads;
      output.status = repositoryU.getAheadBehindCount('refs/heads/master');
      deferred.resolve(output);
    }).catch(function() {
      deferred.reject('Could not read repo details');
    });
  } else {
    deferred.reject('Not a git repo');
  }
  return deferred.promise;
}

function install(args) {
  var repoPath = getPath(args);
  installRaw(repoPath).then(function(obj) {
		console.log('Scan the Qrcode with your '+CONFIG.NAME + '-App')
    qrcode.generate(obj.config.id);
  }).catch(function(err) {
    showError(err);
  });
}

function installRaw(repoPath) {
  var obj = {};
  var configFilePath = path.join(repoPath, CONFIG.CONFIGFILE);
  return isInstalled(configFilePath, 'install').then(function() {
    return getRepoInfos(repoPath);
  }).then(function(repoData) {
    return apiAddRepo(repoData, repoPath);
  }).then(function(config) {
    obj.config = config;
    return installCron(repoPath);
  }).then(function(){
    return Promise.resolve(obj);
  })
}

function showSuccess(msg) {
  console.log(msg);
}

function showError(msg) {
  console.error(msg);
}

function uninstall(args) {
	var repoPath = getPath(args);
  uninstallRaw(repoPath)
    .then(function() {
      showSuccess('Sucessfully uninstalled');
    })
    .catch(function(err) {
      showError(err);
    });
}
function uninstallRaw(repoPath){
  var configFilePath = path.join(repoPath, CONFIG.CONFIGFILE);
  return isInstalled(configFilePath, 'uninstall').then(function() {
      return unInstallCron(repoPath).then(function() {
        return readConfig(repoPath).then(function(config) {
          return apiRemoveRepo(config.id);
        });
      })
    }).then(function(){
      return removeConfig(repoPath);
    })
}

function fExists(file) {
  return new Promise(function(resolve) {
    try {
      fs.lstat(file, function(err) {
        if (err) return resolve(false);
        resolve(true);
      });
    } catch (err) {
      resolve(false);
    }
  });
}

function getPath(args){
	var repoPath = path.resolve('./');
  if (args.argv._[1]) {
    repoPath = path.resolve(args.argv._[1]);
  }
	return repoPath;
}

function isInstalled(file, iOrUi) {
  return fExists(file).then(function(exists) {
    return new Promise(function(resolve, reject) {
      if (exists) {
        if (iOrUi == 'install') {
          reject('Already installed');
        } else {
          resolve();
        }
      } else {
        if (iOrUi == 'uninstall') {
          reject('Already uninstalled');
        } else {
          resolve();
        }
      }
    });
  });
}
