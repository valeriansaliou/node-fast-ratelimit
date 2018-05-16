/*
 * node-fast-ratelimit
 *
 * Copyright 2016, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


"use strict";


var FastRateLimit = require("../").FastRateLimit;
var assert = require("assert");


var __Promise = (
  (typeof Promise !== "undefined") ?
    Promise : require("es6-promise-polyfill").Promise
);


describe("node-fast-ratelimit", function() {
  describe("constructor", function() {
    it("should succeed creating a limiter with valid options", function() {
      assert.doesNotThrow(
        function() {
          new FastRateLimit({
            threshold : 5,
            ttl       : 10
          });
        },

        "FastRateLimit should not throw on valid options"
      );
    });

    it("should fail creating a limiter with missing threshold", function() {
      assert.throws(
        function() {
          new FastRateLimit({
            ttl : 10
          });
        },

        "FastRateLimit should throw on missing threshold"
      );
    });

    it("should fail creating a limiter with invalid threshold", function() {
      assert.throws(
        function() {
          new FastRateLimit({
            threshold : -1,
            ttl       : 10
          });
        },

        "FastRateLimit should throw on invalid threshold"
      );
    });

    it("should fail creating a limiter with missing ttl", function() {
      assert.throws(
        function() {
          new FastRateLimit({
            threshold : 2
          });
        },

        "FastRateLimit should throw on missing ttl"
      );
    });

    it("should fail creating a limiter with invalid ttl", function() {
      assert.throws(
        function() {
          new FastRateLimit({
            ttl : "120"
          });
        },

        "FastRateLimit should throw on invalid ttl"
      );
    });
  });

  describe("consumeSync method", function() {
    it("should not rate limit an empty namespace", function() {
      var limiter = new FastRateLimit({
        threshold : 100,
        ttl       : 10
      });

      assert.ok(
        limiter.consumeSync(null),
        "Limiter consume should succeed for `null` (null) namespace (resolve)"
      );

      assert.ok(
        limiter.consumeSync(""),
        "Limiter consume should succeed for `` (blank) namespace (resolve)"
      );

      assert.ok(
        limiter.consumeSync(0),
        "Limiter consume should succeed for `0` (number) namespace (resolve)"
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
        assert.ok(
          limiter.consumeSync(namespace),
          "Limiter consume should succeed"
        );
      }
    });

    it("should rate limit a single namespace", function() {
      var namespace = "127.0.0.1";

      var limiter = new FastRateLimit({
        threshold : 3,
        ttl       : 10
      });

      assert.ok(
        limiter.consumeSync(namespace),
        "Limiter consume succeed at consume #1 (resolve)"
      );

      assert.ok(
        limiter.consumeSync(namespace),
        "Limiter consume succeed at consume #2 (resolve)"
      );

      assert.ok(
        limiter.consumeSync(namespace),
        "Limiter consume succeed at consume #3 (resolve)"
      );

      assert.ok(
        !(limiter.consumeSync(namespace)),
        "Limiter consume fail at consume #4 (reject)"
      );
    });

    it("should not rate limit multiple namespaces", function() {
      var limiter = new FastRateLimit({
        threshold : 2,
        ttl       : 10
      });

      assert.ok(
        limiter.consumeSync("user_1"),
        "Limiter consume should succeed at consume #1 of user_1 (resolve)"
      );

      assert.ok(
        limiter.consumeSync("user_2"),
        "Limiter consume should succeed at consume #1 of user_2 (resolve)"
      );
    });

    it("should rate limit multiple namespaces", function() {
      var limiter = new FastRateLimit({
        threshold : 2,
        ttl       : 10
      });

      assert.ok(
        limiter.consumeSync("user_1"),
        "Limiter consume should succeed at consume #1 of user_1 (resolve)"
      );

      assert.ok(
        limiter.consumeSync("user_2"),
        "Limiter consume should succeed at consume #1 of user_2 (resolve)"
      );

      assert.ok(
        limiter.consumeSync("user_1"),
        "Limiter consume should succeed at consume #2 of user_1 (resolve)"
      );

      assert.ok(
        limiter.consumeSync("user_2"),
        "Limiter consume should succeed at consume #2 of user_2 (resolve)"
      );

      assert.ok(
        !(limiter.consumeSync("user_1")),
        "Limiter consume should fail at consume #3 of user_1 (reject)"
      );

      assert.ok(
        !(limiter.consumeSync("user_2")),
        "Limiter consume should fail at consume #3 of user_2 (reject)"
      );
    });

    it("should expire token according to TTL", function(done) {
      // Do not consider timeout as slow
      this.slow(5000);

      var options = {
        threshold : 2,
        ttl       : 1
      };

      var namespace = "127.0.0.1";
      var limiter = new FastRateLimit(options);

      assert.ok(
        limiter.consumeSync(namespace),
        "Limiter consume should succeed at consume #1 (resolve)"
      );

      assert.ok(
        limiter.consumeSync(namespace),
        "Limiter consume should succeed at consume #2 (resolve)"
      );

      assert.ok(
        !(limiter.consumeSync(namespace)),
        "Limiter consume should fail at consume #3 (reject)"
      );

      // Wait for TTL reset.
      setTimeout(function() {
        assert.ok(
          limiter.consumeSync(namespace),
          "Limiter consume should succeed at consume #4 (resolve)"
        );

        done();
      }, ((options.ttl * 1000) + 100));
    });

    it("should not block writing random namespaces", function(done) {
      // Timeout if longer than 2 seconds (check for blocking writes)
      this.timeout(2000);

      var limiter = new FastRateLimit({
        threshold : 100,
        ttl       : 60
      });

      var asyncFlowSteps = 10000,
          asyncFlowTotal = 4,
          asyncFlowCountDone = 0;

      var launchAsyncFlow = function(id) {
        setTimeout(function() {
          for (var i = 0; i < asyncFlowSteps; i++) {
            assert.ok(
              limiter.consumeSync("flow-" + id + "-" + i),
              "Limiter consume should succeed at flow #" + id + " (resolve)"
            );
          }

          if (++asyncFlowCountDone === asyncFlowTotal) {
            done();
          }
        });
      }

      // Launch asynchronous flows
      for (var i = 1; i <= asyncFlowTotal; i++) {
        launchAsyncFlow(i);
      }
    });


  });

  describe("hasTokenSync method", function() {
    it("should not consume token", function() {
      var limiter = new FastRateLimit({
        threshold : 1,
        ttl       : 10
      });
      var namespace = "127.0.0.1";

      assert.ok(limiter.hasTokenSync(namespace), "Limiter hasTokenSync should succeed at hasTokenSync #1");
      assert.ok(limiter.hasTokenSync(namespace), "Limiter hasTokenSync should succeed at hasTokenSync #2");
    });

    it("should rate limit", function() {
      var limiter = new FastRateLimit({
        threshold : 1,
        ttl       : 10
      });
      var namespace = "127.0.0.1";

      assert.ok(limiter.hasTokenSync(namespace), "Limiter hasTokenSync should succeed at hasTokenSync #1");
      assert.ok(limiter.consumeSync(namespace), "Limiter consumeSync should succeed at consumeSync #1");
      assert.ok(!limiter.hasTokenSync(namespace), "Limiter hasTokenSync should fail at hasTokenSync #2");
    });
  });

  describe("hasToken method", function() {
    it("should not consume token", function(done) {
      var limiter = new FastRateLimit({
        threshold : 1,
        ttl       : 10
      });
      var namespace = "127.0.0.1";
      var promises_all = [];

      promises_all.push(limiter.hasToken(namespace));
      promises_all.push(limiter.hasToken(namespace));

      __Promise.all(promises_all)
        .then(function() {
          done();
        })
        .catch(function(error) {
          if (error) {
            done(error);
          } else {
            done(
              new Error("Limiter hasToken should not fail at the end (reject)")
            );
          }
        });
    });

    it("should rate limit", function(done) {
      var limiter = new FastRateLimit({
        threshold : 1,
        ttl       : 10
      });
      var namespace = "127.0.0.1";
      var promises_all = [];

      promises_all.push(limiter.hasToken(namespace));
      promises_all.push(limiter.consume(namespace));
      promises_all.push(limiter.hasToken(namespace));

      __Promise.all(promises_all)
        .then(function() {
          done(new Error("Limiter hasToken should not succeed at the end (reject)"));
        })
        .catch(function(error) {
          if (error) {
            done(error);
          }

          done();
        });
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
        .then(function() {
          done();
        })
        .catch(function(error) {
          if (error) {
            done(error);
          } else {
            done(
              new Error("Limiter consume should not fail at the end (reject)")
            );
          }
        });
    });

    it("should rate limit", function(done) {
      var options = {
        threshold : 100,
        ttl       : 10
      };

      var namespace = "127.0.0.1";
      var limiter = new FastRateLimit(options);

      var promises_all = [];

      for (var i = 1; i <= (options.threshold + 5); i++) {
        promises_all.push(
          limiter.consume(namespace)
        );
      }

      __Promise.all(promises_all)
        .then(function(remaining_tokens_list) {
          done(
            new Error("Limiter consume should not succeed at the end (reject)")
          );
        })
        .catch(function(error) {
          if (error) {
            done(error);
          } else {
            done();
          }
        });
    });
  });
});
