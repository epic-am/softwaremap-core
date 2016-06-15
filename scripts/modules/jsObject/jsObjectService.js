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
  this.indexes = new HashMap();
  this.listeningEvents();
};

JsObjectService.prototype.listeningEvents = function () {
  this.hub.on("create", function (obj) {
    obj.cb(this.createElement(obj.index, obj.type, obj.params));
  }.bind(this));

  this.hub.on("delete", function (obj) {
    obj.cb(this.deleteElement(obj.index, obj.type, obj.params));
  }.bind(this));

  this.hub.on("update", function (obj) {
    obj.cb(this.updateElement(obj.index, obj.type, obj.params));
  }.bind(this));

  this.hub.on("find", function (obj) {
    obj.cb(this.findElement(obj.index, obj.type, obj.params));
  }.bind(this));
};

JsObjectService.prototype.createElement = function(index, type, params) {
  var res = {};
  if (type === "service") {
    res = this.addService(index, params);
  } else if (type === "executor") {
    res = this.addExecutorsToService(index, params);
  }

  return res;
};

JsObjectService.prototype.deleteElement = function (index, type, params) {
  var res = false;
  if (type === "service") {
    this.deleteService(index, params.serviceId);
  } else if (type === "executor") {
    this.deleteExecutorToService(index, params);
  }

  return res;
};

JsObjectService.prototype.updateElement = function (index, type, params) {
  var res = false;

  if (type === "service") {
    res = this.updateService(index, params);
  } else if (type === "executor") {
    res = this.updateExecutorToService(index, params);
  }
};

JsObjectService.prototype.findElement = function (index, type, params) {
  var res = [];
  if (type === "service") {
    res = this.findService(index, params);
  } else if (type === "executor") {
    res = this.findExecutor(index, params);
  }
  return res;
};

JsObjectService.prototype.findService = function (index, params) {
  var serviceKeys = Object.keys(params);

  if (_.includes(serviceKeys, "serviceId") && serviceKeys.length === 1) {
    return this.findServiceById(index, params.serviceId);
  } else if (_.includes(serviceKeys, "serviceName") && serviceKeys.length === 1) {
    return this.findServiceByName(index, params.serviceName);
  } else {
    return this.findAllService(index);
  }
};

JsObjectService.prototype.findExecutor = function (index, params) {
  var serviceKeys = Object.keys(params);

  if (_.includes(serviceKeys, "serviceId") && serviceKeys.length === 1) {
    return this.findServiceByIdExecutors(index, params.serviceId);
  } else if (_.includes(serviceKeys, "serviceId") && (_.includes(serviceKeys, "executorId")) && serviceKeys.length === 2) {
    return this.findExecutorByIdAndServiceId(index, params.serviceName);
  } else if (_.includes(serviceKeys, "serviceId") && (_.includes(serviceKeys, "executorName")) && serviceKeys.length === 2) {
    return this.findExecutorByNameAndServiceId(index, params.executorName, params.serviceId);
  }else {
    return this.findAllService(index);
  }
};
/**
 * Add service on hashmap
 * Return : Object with id and service
*/
JsObjectService.prototype.addService = function (index, params) {
  var executors = [];
  this.resourceId++;

  var hashmap = null;
  if (this.indexes.has(index)) {
    hashmap = this.indexes.get(index);
    hashmap.set(this.resourceId, params);
  } else {
    hashmap = new HashMap();
    hashmap.set(this.resourceId, params);
    this.indexes.set(index, hashmap);
  }

  return {
    id: this.resourceId,
    element: params
  };
};

JsObjectService.prototype.deleteService = function (index, serviceId) {
  this.indexes.get(index).remove(parseInt(serviceId, 10));
};

JsObjectService.prototype.updateService = function (index, params) {
  var service = this.indexes.get(index).get(parseInt(params.serviceId, 10));
  service.metadata = _.assignIn(service.metadata, params.metadata);
};

JsObjectService.prototype.addExecutorsToService = function (index, params) {
  var service = this.indexes.get(index).get(parseInt(params.serviceId, 10));
  service.executors.push({
    id: ++this.resourceId,
    name: params.executor.name,
    metadata: params.executor.metadata
  });
  this.indexes.get(index).set(parseInt(params.serviceId, 10), service);
  return {
    id: this.resourceId
  };
};

JsObjectService.prototype.updateExecutorToService = function (index, params) {
  var serviceId = params.serviceId;
  var executorId = params.executorId;
  var metadata = params.metadata;

  var service = this.indexes.get(index).get(parseInt(serviceId, 10));
  service.executors.forEach(function (executor) {
    if (executor.id === +executorId) {
      executor.metadata = _.assignIn(executor.metadata, metadata);
    }
  });
  this.indexes.get(index).set(parseInt(serviceId, 10), service);
};

JsObjectService.prototype.deleteExecutorToService = function (index, params) {
  var res = false;
  var serviceId = params.serviceId;
  var executorId = params.executorId;
  var service = this.indexes.get(index).get(+serviceId);
  for (var i = 0; i < service.executors.length; i++) {
    if (service.executors[i].id === +executorId) {
      service.executors.splice(i, 1);
      res = true;
    }
  }
  return res;
};

JsObjectService.prototype.findServiceByName = function (index, serviceName) {
  var res = null;
  var indexHash = this.indexes.get(index);
  if (indexHash) {
    indexHash.forEach(function (value, key) {
      if (value.name === serviceName) {
        res = key;
      }
    });
  }

  return res;
};

JsObjectService.prototype.findServiceById = function (index, serviceId) {
  var service = this.indexes.get(index).get(+serviceId);
  if (service !== undefined) {
    return service;
  }
  return null;
};

JsObjectService.prototype.findExecutorByIdAndServiceId = function (executorId, serviceId) {
  var service = this.indexes.get(index).get(+serviceId);
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

JsObjectService.prototype.findExecutorByNameAndServiceId = function (index, executorName, serviceId) {
  var service = this.indexes.get(index).get(parseInt(serviceId, 10));
  var resExecutor = null;

  if (service !== null) {
    service.executors.forEach( (executor) => {
      if (executor.name === executorName) {
        resExecutor = executor;
      }
    });
  }
  return resExecutor;
};

JsObjectService.prototype.findAllService = function (index, type) {
  var res = [];
  var services = this.indexes.get(index);
  services.forEach( (value, key) => {
    res.push({
      id: key,
      name: value.name,
      type: value.type,
      env: value.env,
      metadata: value.metadata,
      executors: value.executors
    });
  });
  return res;
};

module.exports = JsObjectService;
