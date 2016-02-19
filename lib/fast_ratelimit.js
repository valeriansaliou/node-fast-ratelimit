/*
 * fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var __Promise = require("es6-promise-polyfill").Promise;


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

  this.__tokens  = {};
};


/**
 * FastRateLimit.prototype.consumeSync
 * @public
 * @param  {string} namespace
 * @return {number} Remaining tokens
 */
FastRateLimit.prototype.consumeSync = function(namespace) {
  // Token bucket empty for namespace?
  if (typeof this.__tokens[namespace] !== "number") {
    this.__tokens[namespace] = this.__options.threshold;
    this.__scheduleExpireToken(namespace);
  }

  // Check remaining tokens in bucket
  if (this.__tokens[namespace] > 0) {
    return (--this.__tokens[namespace]);
  }

  return -1;
};


/**
 * FastRateLimit.prototype.consume
 * @public
 * @param  {string} namespace
 * @return {object} Promise object
 */
FastRateLimit.prototype.consume = function(namespace) {
  var remaining_tokens = this.consumeSync(namespace);

  if (remaining_tokens >= 0) {
    return __Promise.resolve(remaining_tokens);
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
    delete self.__tokens[namespace];
  }, this.__options.ttl_millisec);
};


exports.FastRateLimit = FastRateLimit;
