/*
 * node-fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


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

  this.__tokens  = new Map();
};


/**
 * tokenCheck
 * @private
 * @param   {boolean}  consumeToken Whether to consume token or not
 * @param   {boolean}  returnCount  Whether to return remaining count or status
 * @returns {function} A configured token checking function
 */
var tokenCheck = function(consumeToken, returnCount) {
  return function(namespace) {
    // No namespace provided?
    if (!namespace) {
      // Do not rate-limit (1 token remaining each hop)
      return returnCount ? 1 : true;
    }

    var tokensCount;

    // Token bucket empty for namespace?
    if (this.__tokens.has(namespace) === false) {
      tokensCount = this.__options.threshold;

      this.__scheduleExpireToken(namespace);
    } else {
      tokensCount = this.__tokens.get(namespace);
    }

    // Check remaining tokens in bucket
    if (tokensCount > 0) {
      if (consumeToken) {
        this.__tokens.set(namespace, --tokensCount);
      }

      return returnCount ? tokensCount : true;
    }

    return returnCount ? -1 : false;
  };
};


/**
 * FastRateLimit.prototype.consumeSync
 * @public
 * @param  {string}  namespace
 * @return {boolean} Whether tokens remain in current timespan or not
 */
FastRateLimit.prototype.consumeSync = tokenCheck(true);


/**
 * FastRateLimit.prototype.consumeCountSync
 * @public
 * @param  {string} namespace
 * @return {number} How many tokens are remaining in current timespan
 */
FastRateLimit.prototype.consumeCountSync = tokenCheck(true, true);


/**
 * FastRateLimit.prototype.hasTokenSync
 * @public
 * @param  {string}  namespace
 * @return {boolean} Whether tokens remain in current timespan or not
 */

FastRateLimit.prototype.hasTokenSync = tokenCheck(false);


/**
 * FastRateLimit.prototype.consume
 * @public
 * @param  {string} namespace
 * @return {object} Promise object
 */
FastRateLimit.prototype.consume = function(namespace) {
  if (this.consumeSync(namespace) === true) {
    return Promise.resolve();
  }

  return Promise.reject();
};


/**
 * FastRateLimit.prototype.consumeCount
 * @public
 * @param  {string} namespace
 * @return {object} Promise object
 */
FastRateLimit.prototype.consumeCount = function(namespace) {
  return Promise.resolve(
    this.consumeCountSync(namespace)
  );
};


/**
 * FastRateLimit.prototype.hasToken
 * @public
 * @param  {string} namespace
 * @return {object} Promise object
 */
FastRateLimit.prototype.hasToken = function(namespace) {
  if (this.hasTokenSync(namespace) === true) {
    return Promise.resolve();
  }

  return Promise.reject();
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
    self.__tokens.delete(namespace);
  }, this.__options.ttl_millisec);
};


exports.FastRateLimit = FastRateLimit;
