var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var HttpStatus = require('http-status-codes');

var LOGGER = require("../../utils/logger");

var ScribeService = function (hub, router) {
  this.config = {};
  this.hub = hub;
  this.router = router;
  this.logger = LOGGER.getLogger("ScribeService");
};

inherits(ScribeService, EventEmitter);

ScribeService.prototype.initialize = function () {
  this.logger.info("initialize");
  this.initRoutes();
  this.listeningEvents();
};

ScribeService.prototype.listeningEvents = function () {
};


ScribeService.prototype.initRoutes = function () {
  this.router.post("/services/", this.addService.bind(this));
  this.router.put("/services/:serviceId", this.updateService.bind(this));
  this.router.delete("/services/:serviceId", this.deleteService.bind(this));
  this.router.post("/services/:serviceId/executors", this.addExecutorsToService.bind(this));
  this.router.put("/services/:serviceId/executors/:executorId", this.updateExecutorToService.bind(this));
  this.router.delete("/services/:serviceId/executors/:executorId", this.deleteExecutorToService.bind(this));
};

ScribeService.prototype.addService = function (req, res) {
  this.logger.info("addService");
  // Verification des parametres de la requete
  // Verification de l'existence du service qu'on veut
  var service = this.isServiceExist(req.body.name, req.body.type, req.body.env);
  if (!service) {
    this.emit("create", {
      index: "service",
      type: "service",
      params: {
        name: req.body.name,
        type: req.body.type,
        env: req.body.env,
        metadata: req.body.metadata,
        executors: req.body.executors || [],
      },
      cb: function (value) {
        res.status(HttpStatus.OK).send(value);
      }.bind(this)
    });
  } else {
    res.status(HttpStatus.CONFLICT).send({
        message: "Service already exist",
        serviceId: service
    });
  }
};

ScribeService.prototype.updateService = function (req, res) {
  this.logger.info("updateService");
  if (!this.isServiceIdExist(req.params.serviceId)) {
    this.emit("update", {
      index: "service",
      type: "service",
      parameters: {
        serviceId: req.params.serviceId,
        metadata: req.body.metadata
      },
      cb: function (value) {
        res.status(HttpStatus.OK).send(value);
      }.bind(this)
    });
  } else {
    res.status(HttpStatus.NOT_FOUND).send({
		    error: HttpStatus.getStatusText(HttpStatus.NOT_FOUND),
        message: "Service doesn't exist"
    });
  }
};

ScribeService.prototype.deleteService = function (req, res) {
  this.logger.info("deleteService");
  if (this.isServiceIdExist(req.params.serviceId)) {
    this.emit("delete", {
      index: "service",
      type: "service",
      params: {
        serviceId: req.params.serviceId
      },
      cb: function () {
        res.status(HttpStatus.NO_CONTENT);
      }.bind(this)
    });
  } else {
    res.status(HttpStatus.NOT_FOUND);
  }
  res.send('deleteService');
};

ScribeService.prototype.addExecutorsToService = function (req, res) {
  this.logger.info("addExecutorsToService");
  var executor = this.isExecutorExistOnService(req.params.serviceId, req.body.name);
  if (!executor) {
    this.emit("create", {
      index: "service",
      type: "executor",
      params: {
        serviceId: req.params.serviceId,
        executor: req.body,
      },
      cb: function (value) {
        res.status(HttpStatus.OK).send(value);
      }
    });
  } else {
    res.status(HttpStatus.CONFLICT).send({
        message: "Executor already exist",
        executorId: executor.id
    });
  }
};

ScribeService.prototype.updateExecutorToService = function (req, res) {
  this.logger.info("updateExecutorToService");
  this.emit("update", {
    index: "service",
    type: "executor",
    params: {
      serviceId: req.params.serviceId,
      executorId: req.params.executorId,
      metadata: req.body
    },
    cb: function (value) {
      res.status(HttpStatus.OK).send('updateExecutorToService');
    }
  });
};

ScribeService.prototype.deleteExecutorToService = function (req, res) {
  this.logger.info("deleteExecutorToService");
  this.emit("delete", {
    index: "service",
    type: "executor",
    params: {
      serviceId: req.params.serviceId,
      executorId: req.params.executorId,
    },
    cb: function (value) {
      if (value) {
        res.status(HttpStatus.NO_CONTENT);
      } else {
        res.status(HttpStatus.NOT_FOUND);
      }
    }
  });
  res.send('deleteExecutorToService');
};

ScribeService.prototype.isServiceExist = function (serviceName, serviceType, serviceEnv) {
  var res = false;
  this.emit("find", {
    index: "service",
    type: "service",
    params : {
      serviceName: serviceName,
      serviceType: serviceType,
      serviceEnv: serviceEnv
    },
    cb: function (value) {
      if (value === null) {
        return false;
      }
      res = value;
    }.bind(this)
  });

  return res;
};

ScribeService.prototype.isServiceIdExist = function (serviceId) {
  var res = false;

  this.emit("find", {
    index: "service",
    type: "service",
    params: {
      serviceId: serviceId
    },
    cb: function (value) {
      res = value;
    }
  });
  return res;
};

ScribeService.prototype.isExecutorExistOnService = function (serviceId, executorName) {
  var res = false;
  this.emit("find", {
    index: 'service',
    type: 'executor',
    params: {
      executorName: executorName,
      serviceId: serviceId,
    },
    cb: function (value) {
      if (value === null) {
        return false;
      }
      res = value;
    }.bind(this)
  });

  return res;
};

module.exports = ScribeService;
