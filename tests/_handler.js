var handler = require('../handler');
var fs = require("fs");
var path = require('path');
var Promise = require('bluebird');
var crontab = require('crontab');
var nodeGit = require('nodegit');
var nock = require('nock');
var fse = Promise.promisifyAll(require('fs-extra'));
var CONFIG = handler.CONFIG;

var dataIn = {
  id: "test"
};

function commitFile(repo, fileName, fileContent, commitMessage) {

  var repository;
  var index;
  return Promise.resolve(repo)
    .then(function() {
      repository = repo;
      return fse.outputFileAsync(path.join(repository.workdir(), fileName), fileContent);
    })
    .then(function() {
      return repository.index();
    })
    .then(function(idx) {
      index = idx;
      return Promise.resolve(index);
    })
    .then(function() {
      return index.addByPath(fileName);
    })
    .then(function() {
      return index.write();
    })
    .then(function() {
      return index.writeTree();
    })
    .then(function(oid) {
      var author = nodeGit.Signature.create("Scott Chacon", "schacon@gmail.com", 123456789, 60);
      var committer = nodeGit.Signature.create("Scott A Chacon", "scott@github.com", 987654321, 90);
      return repository.createCommit('HEAD', author, committer, commitMessage, oid, []);
    });
}

describe('Tests', function() {
  describe('createConfig / updateConfig', function() {
    it('can write config', function(done) {
      this.timeout(5000);
      var dirName = __dirname + '/testdir0';
      var configFilePath = path.join(dirName, CONFIG.CONFIGFILE);

      fse.ensureDirSync(dirName);
      handler.writeConfig(dataIn, dirName).then(function(dataFunc) {
        fs.readFile(configFilePath, function(err, dataOut) {
          if (err) return done(err);
          expect(dataFunc).to.eql(dataIn)
          expect(JSON.parse(dataOut.toString())).to.eql(dataIn)
          done();
        });
      }).catch(function(e){
        fse.removeSync(dirName);
        done(e);
      });
    });
    it('can read config', function(done) {
      this.timeout(5000);
      var dirName = __dirname + '/testdir0';
      var configFilePath = path.join(dirName, CONFIG.CONFIGFILE);

      handler.readConfig(dirName).then(function(dataOut) {
        expect(dataOut).to.eql(dataIn);
        fse.removeSync(dirName);
        done();
      }).catch(function(e){
        fse.removeSync(dirName);
        done(e);
      });
    });
  });
  describe('deleteConfig', function() {
    it('can delete config', function(done) {
      this.timeout(5000);
      var dirName = __dirname + '/testdir9';
      var configFilePath = path.join(dirName, CONFIG.CONFIGFILE);

      handler.writeConfig(dataIn, dirName).then(function() {
        handler.removeConfig(dirName).then(function() {
          try {
            fs.lstat(configFilePath, function(err) {
              if (err){
                fse.removeSync(dirName);
                return done();
              }
              fse.removeSync(dirName);
              done('still exists');
            });
          } catch (e) {
            fse.removeSync(dirName);
            done();
          }
        });
      });
    });
  });
  describe('installCron', function() {
    it('should install cron', function(done) {
      this.timeout(10000);
      var dirName = __dirname + '/testdir';
      var fileName = '/message.txt';
      var binary;

      fse.removeSync(dirName);
      fse.ensureDirSync(dirName);
      nodeGit.Repository.init(dirName, 0).then(function(repository) {
        commitFile(repository, fileName, 'test', 'test').then(function(res) {
          return handler.unInstallCron(dirName).then(function() {
            return handler.installCron(dirName);
          }).then(function() {
            return handler.getAppBinaryPath();
          }).then(function(binaryVal) {
            binary = binaryVal.trim();
            return Promise.promisify(crontab.load)();
          }).then(function(crontab) {
            expect(crontab.jobs({
              command: handler.cronCommand(binary, dirName)
            }).length).to.be.greaterThan(0)
            fse.removeSync(dirName);
            done();
          })
        }).catch(function(e) {
          fse.removeSync(dirName);
          done(e);
        });
      }).catch(function(e) {
        fse.removeSync(dirName);
        done(e);
      });
    });
  });
  describe('unInstallCron', function() {
    it('should uninstall cron', function(done) {
      this.timeout(10000);
      var dirName = __dirname + '/testdir2';
      var fileName = '/message.txt';
      var binary;

      fse.removeSync(dirName);
      fse.ensureDirSync(dirName);
      nodeGit.Repository.init(dirName, 0).then(function(repository) {
        commitFile(repository, fileName, 'test', 'test').then(function(res) {
          handler.installCron(dirName).then(function() {
            return handler.unInstallCron(dirName);
          }).then(function() {
            return handler.getAppBinaryPath();
          }).then(function(binaryVal) {
            binary = binaryVal.trim();
            return Promise.promisify(crontab.load)();
          }).then(function(crontab) {
            expect(crontab.jobs({
              command: handler.cronCommand(binary, dirName)
            }).length).to.be(0);
            fse.removeSync(dirName);
            done();
          });
        }).catch(function(e) {
          fse.removeSync(dirName);
          done(e);
        });
      }).catch(function(e) {
        fse.removeSync(dirName);
        done(e);
      });
    });
  });
  describe('getRepoInfos', function() {
    it('should return repo infos', function(done) {
      this.timeout(10000);
      var dirName = __dirname + '/testdir3';
      var fileName = 'message.txt';
      var binary;

      fse.removeSync(dirName);
      fse.ensureDirSync(dirName);
      nodeGit.Repository.init(dirName, 0).then(function(repository) {
        commitFile(repository, fileName, 'test', 'test').then(function(res) {
          handler.getRepoInfos(dirName).then(function(infos) {
            expect(infos).to.eql({
              branch: 'refs/heads/master',
              name: 'testdir3',
              author: 'Scott Chacon <schacon@gmail.com>',
              message: 'test',
              isClean: true,
              branches: ['refs/heads/master'],
              status: {
                ahead: 0,
                behind: 0
              }
            })
            fse.removeSync(dirName);
            done();
          })
        }).catch(function(e) {
          fse.removeSync(dirName);
          done(e);
        });
      }).catch(function(e) {
        fse.removeSync(dirName);
        done(e);
      });
    });
  });
  describe('install / uninstall / update', function() {
    it('should install gitmonitor to repo', function(done) {
      this.timeout(10000);
      var dirName = __dirname + '/testdir4';
      var fileName = 'message.txt';
      var binary;

      // mock request
      nock(handler.CONFIG.SERVER)
                .post('/api/Repos/')
                .reply(200, {
                  id: '123ABC'
                });

      fse.removeSync(dirName);
      fse.ensureDirSync(dirName);
      nodeGit.Repository.init(dirName, 0).then(function(repository) {
        return commitFile(repository, fileName, 'test', 'test').then(function(res) {
          return handler.unInstallCron(dirName).then(function() {
            return handler.installRaw(dirName);
          }).then(function(infos) {
            expect(infos.config.id).to.be('123ABC');
            var configFilePath = path.join(dirName, handler.CONFIG.CONFIGFILE);
            return handler.isInstalled(configFilePath, 'installed').then(function(){
              done();
            });
          })
        })
      }).catch(function(e) {
        fse.removeSync(dirName);
        done(e);
      });
    });
    it('should update gitmonitor to repo', function(done) {
      this.timeout(10000);
      var dirName = __dirname + '/testdir4';
      var fileName = 'message.txt';
      var binary;

      // mock request
      var scope = nock(handler.CONFIG.SERVER)
                .put('/api/Repos/'+'123ABC', {
                  branch: 'refs/heads/master',
                  name: 'testdir4',
                  author: 'Scott Chacon <schacon@gmail.com>',
                  message: 'test',
                  isClean: false,
                  branches: ['refs/heads/master'],
                  status: {
                    ahead: 0,
                    behind: 0
                  }
                })
                .reply(200, {});

      handler.updateRaw(dirName).then(function(infos) {
        expect(scope.isDone()).to.be(true);
        done();
      }).catch(function(e) {
        fse.removeSync(dirName);
        done(e);
      });
    });
    it('should uninstall gitmonitor to repo', function(done) {
      this.timeout(10000);
      var dirName = __dirname + '/testdir4';
      var fileName = 'message.txt';
      var binary;

      // mock request
      var scope = nock(handler.CONFIG.SERVER)
                .delete('/api/Repos/'+'123ABC')
                .reply(200, {});

      handler.uninstallRaw(dirName).then(function(infos) {
        expect(scope.isDone()).to.be(true);
        var configFilePath = path.join(dirName, handler.CONFIG.CONFIGFILE);
        return handler.isInstalled(configFilePath, 'uninstalled').then(function(){
          fse.removeSync(dirName);
          done();
        });
      }).catch(function(e) {
        fse.removeSync(dirName);
        done(e);
      });
    });
  });
});
