/*
 * fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var FastRateLimit = require("../").FastRateLimit;
var assert = require("assert");

var __Promise = require("es6-promise-polyfill").Promise;


describe("fast-ratelimit", function() {
  describe("consumeSync method", function() {
    it("should not rate limit an empty namespace", function() {
      var limiter = new FastRateLimit({
        threshold : 100,
        ttl       : 10
      });

      assert.equal(
        limiter.consumeSync(null), 1,
        "Limiter consume should return 1 for `null` (null) namespace (resolve)"
      );

      assert.equal(
        limiter.consumeSync(""), 1,
        "Limiter consume should return 1 for `` (blank) namespace (resolve)"
      );

      assert.equal(
        limiter.consumeSync(0), 1,
        "Limiter consume should return 1 for `0` (number) namespace (resolve)"
      );
    });

    it("should not rate limit a single namespace", function() {
      var options = {
        threshold : 100,
        ttl       : 10
      };

      var namespace = "127.0.0.1";
      var limiter = new FastRateLimit(options);

      for (var i = 1; i <= options.threshold; i++) {
        assert.equal(
          limiter.consumeSync(namespace),
          (options.threshold - i),
          "Limiter consume should equal to the number of remaining tokens"
        );
      }
    });

    it("should rate limit a single namespace", function() {
      var namespace = "127.0.0.1";

      var limiter = new FastRateLimit({
        threshold : 3,
        ttl       : 10
      });

      assert.equal(
        limiter.consumeSync(namespace), 2,
        "Limiter consume should equal 2 at consume #1 (resolve)"
      );

      assert.equal(
        limiter.consumeSync(namespace), 1,
        "Limiter consume should equal 1 at consume #2 (resolve)"
      );

      assert.equal(
        limiter.consumeSync(namespace), 0,
        "Limiter consume should equal 0 at consume #3 (resolve)"
      );

      assert.equal(
        limiter.consumeSync(namespace), -1,
        "Limiter consume should equal -1 at consume #4 (reject)"
      );
    });

    it("should not rate limit multiple namespaces", function() {
      var limiter = new FastRateLimit({
        threshold : 2,
        ttl       : 10
      });

      assert.equal(
        limiter.consumeSync("user_1"), 1,
        "Limiter consume should equal 1 at consume #1 of user_1 (resolve)"
      );

      assert.equal(
        limiter.consumeSync("user_2"), 1,
        "Limiter consume should equal 1 at consume #1 of user_2 (resolve)"
      );
    });

    it("should rate limit multiple namespaces", function() {
      var limiter = new FastRateLimit({
        threshold : 2,
        ttl       : 10
      });

      assert.equal(
        limiter.consumeSync("user_1"), 1,
        "Limiter consume should equal 1 at consume #1 of user_1 (resolve)"
      );

      assert.equal(
        limiter.consumeSync("user_2"), 1,
        "Limiter consume should equal 1 at consume #1 of user_2 (resolve)"
      );

      assert.equal(
        limiter.consumeSync("user_1"), 0,
        "Limiter consume should equal 0 at consume #2 of user_1 (resolve)"
      );

      assert.equal(
        limiter.consumeSync("user_2"), 0,
        "Limiter consume should equal 0 at consume #2 of user_2 (resolve)"
      );

      assert.equal(
        limiter.consumeSync("user_1"), -1,
        "Limiter consume should equal -1 at consume #3 of user_1 (reject)"
      );

      assert.equal(
        limiter.consumeSync("user_2"), -1,
        "Limiter consume should equal -1 at consume #3 of user_2 (reject)"
      );
    });

    it("should expire token according to TTL", function(done) {
      var options = {
        threshold : 2,
        ttl       : 1
      };

      var namespace = "127.0.0.1";
      var limiter = new FastRateLimit(options);

      assert.equal(
        limiter.consumeSync(namespace), 1,
        "Limiter consume should equal 1 at consume #1 (resolve)"
      );

      assert.equal(
        limiter.consumeSync(namespace), 0,
        "Limiter consume should equal 0 at consume #2 (resolve)"
      );

      assert.equal(
        limiter.consumeSync(namespace), -1,
        "Limiter consume should equal -1 at consume #3 (reject)"
      );

      // Wait for TTL reset.
      setTimeout(function() {
        assert.equal(
          limiter.consumeSync(namespace), 1,
          "Limiter consume should equal 1 at consume #4 (resolve)"
        );

        done();
      }, ((options.ttl * 1000) + 100));
    });
  });

  describe("consume method", function() {
    it("should not rate limit", function(done) {
      var options = {
        threshold : 100,
        ttl       : 10
      };

      var namespace = "127.0.0.1";
      var limiter = new FastRateLimit(options);

      var promises_all = [];

      for (var i = 1; i <= options.threshold; i++) {
        promises_all.push(
          limiter.consume(namespace)
        );
      }

      __Promise.all(promises_all)
        .then(function(remaining_tokens_list) {
          assert.equal(
            remaining_tokens_list[remaining_tokens_list.length - 1], 0,
            "Limiter remaining tokens should equal -1 at the end (resolve)"
          );

          done();
        })
        .catch(function() {
          done(
            new Error("Limiter consume should not fail at the end (reject)")
          );
        });
    });

    it("should rate limit", function(done) {
      done();
    });
  });
});
