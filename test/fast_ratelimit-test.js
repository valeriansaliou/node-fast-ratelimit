/*
 * fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var FastRateLimit = require("../");
var assert = require("assert");


describe("fast-ratelimit", function() {
  describe("consumeSync method", function() {
    it("should not rate limit a single namespace", function() {
      // TODO
    });

    it("should rate limit a single namespace", function() {
      // TODO
    });

    it("should not rate limit multiple namespaces", function() {
      // TODO
    });

    it("should rate limit multiple namespaces", function() {
      // TODO
    });

    it("should expire token according to TTL", function() {
      // TODO
    });

    it("should rate limit before TTL and not rate limit after TTL", function() {
      // TODO
    });
  });

  describe("consume method", function() {
    it("should not rate limit", function() {
      // TODO
    });

    it("should rate limit", function() {
      // TODO
    });
  });
});
