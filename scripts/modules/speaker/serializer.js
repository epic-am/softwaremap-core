var JSONAPISerializer = require('json-api-serializer');

var SerializerJsonAPI = function () {
  var self = this;

  self.registerSerializer = function () {
    self.serializer= new JSONAPISerializer();
    self.serializer.register('service', {
      id: 'id',
      relationships: {
        executors: {
          type: 'executor'
        }
      }
    });

    self.serializer.register('executor', {
      id: 'id',
    });
  };

  self.serializeJson = function (type, data) {
    return self.serializer.serialize(type, data);
  };
};

module.exports = SerializerJsonAPI;
