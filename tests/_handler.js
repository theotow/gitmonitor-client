var handler = require('../handler');
var fs = require("fs");
var path = require('path');
var nodeGit = require('nodegit');
var CONFIG = handler.CONFIG;

var dataIn = {
  id: "test"
};

describe('Tests', function() {
  describe('createConfig / updateConfig', function() {
    it('can write config', function(done) {
      this.timeout(5000);
      handler.writeConfig(dataIn).then(function(dataFunc) {
        fs.readFile(CONFIG.CONFIGFILE, function(err, dataOut) {
          if (err) return done(err);
          expect(dataFunc).to.eql(dataIn)
          expect(JSON.parse(dataOut.toString())).to.eql(dataIn)
          done();
        });
      }).catch(done);
    });
    it('can read config', function(done) {
      this.timeout(5000);
      handler.readConfig().then(function(dataOut) {
        expect(dataOut).to.eql(dataIn)
        done();
      });
    });
  });
  describe('deleteConfig', function() {
    it('can delete config', function(done) {
      this.timeout(5000);
      handler.writeConfig(dataIn).then(function() {
        handler.removeConfig().then(function() {
          try {
            fs.lstat(CONFIG.CONFIGFILE, function(err) {
              if (err) return done();
              done('still exists');
            });
          } catch (e) {
            done();
          }
        });
      });
    });
  });
  describe('installCron', function() {
    it.only('should install cron', function(done) {
      this.timeout(5000);
      nodeGit.Repository.init(fs.mkdirSync(__dirname + '/testdir'), false).then(function(repository) {
        fs.writeFileSync(__dirname + '/testdir/message.txt', 'Hello Node.js');
      });
    });
  });
});
