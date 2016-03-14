var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var HashMap = require("hashmap");
var _ = require('lodash');

var LOGGER = require("../../utils/logger");

var JsObjectService = function (hub, router) {
  this.config = {};
  this.router = router;
  this.hub = hub;
  this.resourceId = 0;
  this.logger = LOGGER.getLogger("JsObjectService");
};

JsObjectService.prototype.initialize = function () {
  this.logger.info("initialize");
  this.services = new HashMap();
  this.listeningEvents();
};

JsObjectService.prototype.listeningEvents = function () {
  this.hub.on("createService", function (obj) {
    obj.cb(this.addService(obj.params));
  }.bind(this));

  this.hub.on("deleteService", function (obj) {
    obj.cb(this.deleteService(obj.serviceId));
  }.bind(this));

  this.hub.on("createExecutor", function (obj) {
    obj.cb(this.addExecutorsToService(obj.serviceId, obj.executor));
  }.bind(this));

  this.hub.on("updateService", function (obj) {
    obj.cb(this.updateService(obj.parameters.serviceId, obj.parameters.metadata));
  }.bind(this));

  this.hub.on("updateExecutor", function (obj) {
    obj.cb(this.updateExecutorMetadata(obj.serviceId, obj.executorId, obj.metadata));
  }.bind(this));

  this.hub.on("deleteExecutor", function (obj) {
    obj.cb(this.deleteExecutor(obj.serviceId, obj.executorId));
  }.bind(this));

  this.hub.on("findAllService", function (obj) {
    obj.cb(this.findAllService());
  }.bind(this));

  this.hub.on("findServiceByName", function (obj) {
    obj.cb(this.findServiceByName(obj.serviceName));
  }.bind(this));

  this.hub.on("findServiceById", function (obj) {
    obj.cb(this.findServiceById(obj.parameters.serviceId));
  }.bind(this));

  this.hub.on("findExecutorByIdAndServiceId", function (obj) {
    obj.cb(this.findExecutorByIdAndServiceId(obj.parameters.executorId, obj.parameters.serviceId));
  }.bind(this));

  this.hub.on("getResource", function (obj) {
    obj.cb(this.getResource(obj.parameters));
  }.bind(this));
};

/**
 * Add service on hashmap
 * Return : Object with id and service
*/
JsObjectService.prototype.addService = function (params) {
  var executors = [];
  this.resourceId++;

  this.services.set(this.resourceId, {
    name: params.name,
    metadata: params.metadata,
    executors: executors
  });

  return {
    id: this.resourceId,
    executors: []
  };
};

JsObjectService.prototype.deleteService = function (serviceId) {
  this.services.remove(parseInt(serviceId, 10));
};

JsObjectService.prototype.updateService = function (serviceId, metadata) {
  var service = this.services.get(parseInt(serviceId, 10));
  service.metadata = _.assignIn(service.metadata, metadata);
};

JsObjectService.prototype.addExecutorsToService = function (serviceId, executor) {
  var service = this.services.get(parseInt(serviceId, 10));
  service.executors.push({
    id: ++this.resourceId,
    name: executor.name,
    metadata: executor.metadata
  });
  this.services.set(parseInt(serviceId, 10), service);
  return {
    id: this.resourceId
  };
};

JsObjectService.prototype.updateExecutorMetadata = function (serviceId, executorId, metadata) {
  var service = this.services.get(parseInt(serviceId, 10));
  service.executors.forEach(function (executor) {
    if (executor.id === +executorId) {
      executor.metadata = _.assignIn(executor.metadata, metadata);
    }
  });
  this.services.set(parseInt(serviceId, 10), service);
};

JsObjectService.prototype.deleteExecutor = function (serviceId, executorId) {
  var res = false;
  var service = this.services.get(parseInt(serviceId, 10));
  for (var i = 0; i < service.executors.length; i++) {
    if (service.executors[i].id === +executorId) {
      service.executors.splice(i, 1);
      res = true;
    }
  }
  return res;
};

JsObjectService.prototype.findServiceByName = function (serviceName) {
  var res = null;
  this.services.forEach(function (value, key) {
    if (value.name === serviceName) {
      res = key;
    }
  });

  return res;
};

JsObjectService.prototype.findServiceById = function (serviceId) {
  var service = this.services.get(parseInt(serviceId, 10));
  if (service !== null) {
    return service;
  }
  return null;
};

JsObjectService.prototype.findExecutorByIdAndServiceId = function (executorId, serviceId) {
  var service = this.services.get(parseInt(serviceId, 10));
  var resExecutor = null;

  if (service !== null) {
    service.executors.forEach( (executor) => {
      if (executor.id === parseInt(executorId, 10)) {
        resExecutor = executor;
      }
    });
  }
  return resExecutor;
};

JsObjectService.prototype.findAllService = function (parameters) {
  var res = [];

  this.services.forEach( (value, key) => {
    res.push({
      id: key,
      name: value.name,
      metadata: value.metadata,
      executors: value.executors
    });
  });

  return res;
};

module.exports = JsObjectService;
