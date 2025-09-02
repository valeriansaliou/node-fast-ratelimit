/*
 * node-fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


/**
 * @typedef {Object}  FastRateLimitOptions
 * @property {number} threshold
 * @property {number} ttl
 */


/**
 * FastRateLimit
 * @class
 * @classdesc  Instanciates a new rate-limiter
 * @param      {FastRateLimitOptions} options
 */
class FastRateLimit {
  constructor(options) {
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
    let secondInMilliseconds = 1000;

    // Storage space
    this.__options = {
      threshold    : options.threshold,
      ttl_millisec : (options.ttl * secondInMilliseconds)
    };

    this.__tokens  = new Map();
  }


  /**
   * tokenCheck
   * @private
   * @param   {boolean}  consumeToken Whether to consume token or not
   * @returns {function} A configured token checking function
   */
  tokenCheck(consumeToken) {
    return (namespace) => {
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
        if (consumeToken) {
          this.__tokens.set(
            namespace, (_tokens_count - 1)
          );
        }

        return true;
      }

      return false;
    };
  }

  /**
   * consumeSync
   * @public
   * @param  {string}  namespace
   * @return {boolean} Whether tokens remain in current timespan or not
   */
  consumeSync(namespace) {
    return this.tokenCheck(true)(namespace);
  }

  /**
   * hasTokenSync
   * @public
   * @param  {string}  namespace
   * @return {boolean} Whether tokens remain in current timespan or not
   */
  hasTokenSync(namespace) {
    return this.tokenCheck(false)(namespace);
  }


  /**
   * consume
   * @public
   * @param  {string} namespace
   * @return {object} Promise object
   */
  consume(namespace) {
    if (this.consumeSync(namespace) === true) {
      return Promise.resolve();
    }

    return Promise.reject();
  }

  /**
   * hasToken
   * @public
   * @param  {string} namespace
   * @return {object} Promise object
   */
  hasToken(namespace) {
    if (this.hasTokenSync(namespace) === true) {
      return Promise.resolve();
    }

    return Promise.reject();
  }


  /**
   * __scheduleExpireToken
   * @private
   * @param  {string} namespace
   * @return {undefined}
   */
  __scheduleExpireToken(namespace) {
    setTimeout(() => {
      // Expire token storage for namespace
      this.__tokens.delete(namespace);
    }, this.__options.ttl_millisec);
  }
}

module.exports.FastRateLimit = FastRateLimit;
