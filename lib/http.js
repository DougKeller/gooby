let requestPromise = require('request-promise');

let get = (uri, options) => {
  options = options || {};
  options.uri = uri;
  options.method = 'GET';
  options.json = true;
  return requestPromise(options);
};

module.exports = {
  get: get
};
