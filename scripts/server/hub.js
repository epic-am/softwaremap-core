var HashMap = require("hashmap");

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var LOGGER = require("../utils/logger");
var logger = LOGGER.getLogger("Hub");

var Hub = function () {
  var self = this;

  self.initialize = function (server) {
    self.modules = new HashMap();
    self.server = server;
  };

  self.registerModule = function (moduleInfo) {
    logger.info("registerModule ", moduleInfo.name);
    var events = moduleInfo.events;
    self.modules.set(moduleInfo.name, { instance: moduleInfo.instance, events: events });

    events.forEach(function (event) {
      moduleInfo.instance.on(event, function (value) {
        this.notify(event, value);
      }.bind(this));
    }.bind(this));
  };

  self.unregisterModule = function (nameModuleInfo) {
    logger.info("unregisterModule ", moduleInfo.name);
    self.modules.remove(nameModuleInfo);
  };

  self.notify = function (event, value) {
    logger.info("notify event ", event);
    this.emit(event, value);
  };
};

inherits(Hub, EventEmitter);

module.exports = Hub;
