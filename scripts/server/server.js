var express = require("express");
var fs = require("fs");
var path_module = require("path");
var bodyParser = require("body-parser");
var CONFIG = require("config");

var LOGGER = require("../utils/logger");
var logger = LOGGER.getLogger("Server");

var Hub = require("./hub");
var app = express();
var httpServer = require("http").Server(app);

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};

var __DIR_MODULES__ = "../modules/";

var Server = function () {
  var self = this;

  self.setupVariables = function () {
    self.ipaddress =  CONFIG.server.ip || "0.0.0.0";
    self.port = CONFIG.server.port || 3000;
  };

  self.initializeServer = function () {
    self.app = app;
    self.app.use(bodyParser.json());
    app.use(allowCrossDomain);
    self.createRoutes();
    self.app.use(function (req, res) {
      res.status(404);
      res.send("Page is missing");
    });
  };

  self.initializeModules = function () {
    // parcourir le dossier modules/ et register les modules
    var DIR = path_module.join(__dirname, __DIR_MODULES__);
    var modulesList = self.requireDir(DIR);

    modulesList.forEach(function (module) {
      var moduleInstance = new module.instance(self.hub, self.router);
      moduleInstance.initialize();
      self.hub.registerModule({ name: module.name, instance: moduleInstance, events: module.events});
    });
    // initialiser le service et le controller (verifier que les routes rajouter sont bien unique, voir erreur express)
  };

  self.initialize = function () {
    self.setupVariables();
    self.hub = new Hub();
    self.hub.initialize(self);
    self.initializeServer();
  };

  self.requireDir = function(dir, callback) {
    var modulesList = Array();
    fs.readdirSync(dir).forEach(function (library) {
      // charger le fichier de conf
      var conf = require(dir + library + "/conf.json");
      var moduleName = conf.name;
      var moduleEvents = conf.eventsEmitted || [];
      modulesList.push({
        name: moduleName,
        events: moduleEvents,
        instance: require(path_module.join(dir, library, library + 'Service'))
      });
    });
    return modulesList;
  };

  self.createRoutes = function () {
    self.router = express.Router();
    self.app.use(CONFIG.routes.default, self.router);
    self.router.use(function timeLog (req, res, next) {
      logger.info("Nouvelle requête : " + JSON.stringify(req.originalUrl) + " BODY : " + JSON.stringify(req.body));
      next();
    });
    self.initializeModules();
  };

  self.start = function () {
    self.server = self.app.listen(self.port, self.ipaddress, function() {
        logger.info("%s: Node server started on %s:%d ...",
            Date(Date.now() ), self.ipaddress, self.port);
        if(typeof callback === "function"){
            callback();
        }
    });
  };

  self.terminator = function (sig) {
    if (typeof sig === "string") {
      logger.info("%s: Received %s - terminating sample app ...", Date(Date.now()), sig);
      process.exit(1);
    }
    logger.info("%s: Node server stopped", Date(Date.now()));
  };

  self.setupTerminationHandlers = function () {
    process.on("exit", function() { self.terminator(); });
    ["SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT",
        "SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM"
    ].forEach(function(element, index, array) {
      process.on(element, function() { self.terminator(element); });
    });
  };
};

module.exports = Server;
