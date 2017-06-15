/*
 * node-fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var HashTable = require("hashtable-patch-valeriansaliou");

var __Promise = (
  (typeof Promise !== "undefined") ?
    Promise : require("es6-promise-polyfill").Promise
);


/**
 * FastRateLimit
 * @class
 * @classdesc  Instanciates a new rate-limiter
 * @param      {object} options
 */
var FastRateLimit = function(options) {
  // Sanitize options
  if (typeof options !== "object") {
    throw new Error("Invalid or missing options");
  }
  if (typeof options.threshold !== "number" || options.threshold < 0) {
    throw new Error("Invalid or missing options.threshold");
  }
  if (typeof options.ttl !== "number" || options.ttl < 0) {
    throw new Error("Invalid or missing options.ttl");
  }

  // Environment
  var secondInMilliseconds = 1000;

  // Storage space
  this.__options = {
    threshold    : options.threshold,
    ttl_millisec : (options.ttl * secondInMilliseconds)
  };

  this.__tokens  = new HashTable();
};


/**
 * FastRateLimit.prototype.consumeSync
 * @public
 * @param  {string}  namespace
 * @return {boolean} Whether tokens remain in current timespan or not
 */
FastRateLimit.prototype.consumeSync = function(namespace) {
  // No namespace provided?
  if (!namespace) {
    // Do not rate-limit (1 token remaining each hop)
    return true;
  }

  let _tokens_count;

  // Token bucket empty for namespace?
  if (this.__tokens.has(namespace) === false) {
    _tokens_count = this.__options.threshold;

    this.__scheduleExpireToken(namespace);
  } else {
    _tokens_count = this.__tokens.get(namespace);
  }

  // Check remaining tokens in bucket
  if (_tokens_count > 0) {
    this.__tokens.put(
      namespace, (_tokens_count - 1)
    );

    return true;
  }

  return false;
};


/**
 * FastRateLimit.prototype.consume
 * @public
 * @param  {string} namespace
 * @return {object} Promise object
 */
FastRateLimit.prototype.consume = function(namespace) {
  if (this.consumeSync(namespace) === true) {
    return __Promise.resolve();
  }

  return __Promise.reject();
};


/**
 * FastRateLimit.prototype.__scheduleExpireToken
 * @private
 * @param  {string} namespace
 * @return {undefined}
 */
FastRateLimit.prototype.__scheduleExpireToken = function(namespace) {
  var self = this;

  setTimeout(function() {
    // Expire token storage for namespace
    self.__tokens.remove(namespace);
  }, this.__options.ttl_millisec);
};


exports.FastRateLimit = FastRateLimit;
