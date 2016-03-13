var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var _ = require('lodash');

var httpStatus = require("http-status-code");
var jsonApiSerializer = require("./serializer");

var LOGGER = require("../../utils/logger");

var SpeakerService = function (hub, router) {
  this.config = {};
  this.hub = hub;
  this.router = router;
  this.logger = LOGGER.getLogger("SpeakerService");
};

inherits(SpeakerService, EventEmitter);

SpeakerService.prototype.initialize = function () {
  this.logger.info("initialize");
  this.serializer = new jsonApiSerializer();
  this.serializer.registerSerializer();
  this.initRoutes();
};

SpeakerService.prototype.initRoutes = function () {
  this.router.get("/services", this.getAllServices.bind(this));
  this.router.get("/services/:serviceId", this.getServiceById.bind(this));
  this.router.get("/services/:serviceId/executors", this.getServiceByIdExecutors.bind(this));
  this.router.get("/services/:serviceId/executors/:executorId", this.getServiceByIdAndExecutorById.bind(this));
};

SpeakerService.prototype.getAllServices = function (req, res) {
  this.emit("findAllService", {
    parameters: {
    },
    cb: function (value) {
      this.resClient(res, "service", value);
    }.bind(this)
  });
};

SpeakerService.prototype.getServiceById = function (req, res) {
  this.emit("findServiceById", {
    parameters: {
      serviceId: req.params.serviceId
    },
    cb: function (value) {
      var service = _.clone(value);
      service.executors = undefined;
      this.resClient(res,"service",service);
    }.bind(this)
  });
};

SpeakerService.prototype.getServiceByIdExecutors = function (req, res) {
  this.emit("findServiceById", {
    parameters: {
      serviceId: req.params.serviceId
    },
    cb: function (value) {
      var service = _.clone(value);
      service.metadata = undefined;
      this.resClient(res, "service", service);
    }.bind(this)
  });
};

SpeakerService.prototype.getServiceByIdAndExecutorById = function (req, res) {
  this.emit("findExecutorByIdAndServiceId", {
    parameters: {
      serviceId: req.params.serviceId,
      executorId: req.params.executorId
    },
    cb: function (value) {
      this.resClient(res, "executor", value);
    }.bind(this)
  });
};

SpeakerService.prototype.resClient = function (res, type, value) {
  return res.send(this.serializer.serializeJson(type, value));
};

module.exports = SpeakerService;
