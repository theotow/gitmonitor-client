var qrcode = require('qrcode-terminal');
var crontab = require('crontab');
var Promise = require("bluebird");
var git = require('git-utils');
var fs = Promise.promisifyAll(require("fs"));


function error(msg){
  console.log(msg);
}

function install(){
  var repository = git.open('./');
  if(!repository){
    return error("This is not a repo.");
  }

  // check if git repo with one commit
  // create file
  // create cron
  // send request
  // show qrcode
  qrcode.generate('This will be a QRCode, eh!');
}

function uninstall(){
  // uninstall cron
  // remove file
  // send request to delete from db
}


module.exports = {
  install: install,
  uninstall: uninstall
};
