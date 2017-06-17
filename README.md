# node-fast-ratelimit

[![Build Status](https://img.shields.io/travis/valeriansaliou/node-fast-ratelimit/master.svg)](https://travis-ci.org/valeriansaliou/node-fast-ratelimit) [![Test Coverage](https://img.shields.io/coveralls/valeriansaliou/node-fast-ratelimit/master.svg)](https://coveralls.io/github/valeriansaliou/node-fast-ratelimit?branch=master) [![NPM](https://img.shields.io/npm/v/fast-ratelimit.svg)](https://www.npmjs.com/package/fast-ratelimit) [![Downloads](https://img.shields.io/npm/dt/fast-ratelimit.svg)](https://www.npmjs.com/package/fast-ratelimit) [![Gitter](https://img.shields.io/gitter/room/valeriansaliou/node-fast-ratelimit.svg)](https://gitter.im/valeriansaliou/node-fast-ratelimit)

Fast and efficient in-memory rate-limit, used to alleviate most common DOS attacks.

This rate-limiter was designed to be as generic as possible, usable in any NodeJS project environment, regardless of wheter you're using a framework or just vanilla code.

Rate-limit lists are stored in a native hashtable to avoid V8 GC to hip on collecting lost references. The `hashtable` native module is used for that purpose.

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.im/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/crisp.png" height="64" /></a></td>
<td align="center"><a href="https://www.doctrine.fr/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/doctrine.png" height="64" /></a></td>
<td align="center"><a href="https://anchor.chat/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/anchorchat.jpg" height="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
<td align="center">Doctrine</td>
<td align="center">Anchor.Chat</td>
</tr>
</table>

_👋 You use fast-ratelimit and you want to be listed there? [Contact me](https://valeriansaliou.name/)._

## How to install?

Include `fast-ratelimit` in your `package.json` dependencies.

Alternatively, you can run `npm install fast-ratelimit --save`.

**Note**: ensure you have a C++11 compiler available. This allows for node-gyp to build the `hashtable` dependency that `fast-ratelimit` depends on.

## How to use?

The `fast-ratelimit` API is pretty simple, here are some keywords used in the docs:

 * `ratelimiter`: ratelimiter instance, which plays the role of limits storage
 * `namespace`: the master ratelimit storage namespace (eg: set `namespace` to the user client IP, or user username)

You can create as many `ratelimiter` instances as you need in your application. This is great if you need to rate-limit IPs on specific zones (eg: for a chat application, you don't want the message send rate limit to affect the message composing notification rate limit).

Here's how to proceed (we take the example of rate-limiting messages sending in a chat app):

### 1. Create the rate-limiter

The rate-limiter can be instanciated as such:

```javascript
var FastRateLimit = require("fast-ratelimit").FastRateLimit;

var messageLimiter = new FastRateLimit({
  threshold : 20, // available tokens over timespan
  ttl       : 60  // time-to-live value of token bucket (in seconds)
});
```

This limiter will allow 20 messages to be sent every minute per namespace.
An user can send a maximum number of 20 messages in a 1 minute timespan, with a token counter reset every minute for a given namespace.

The reset scheduling is done per-namespace; eg: if namespace `user_1` sends 1 message at 11:00:32am, he will have 19 messages remaining from 11:00:32am to 11:01:32am. Hence, his limiter will reset at 11:01:32am, and won't scheduler any more reset until he consumes another token.

### 2. Allow/disallow request based on rate-limit

On the message send portion of our application code, we would add a call to the ratelimiter instance.

#### 2.2. Use asynchronous API (Promise catch/reject)

```javascript
// This would be dynamic in your application, based on user session data, or user IP
namespace = "user_1";

// Check if user is allowed to send message
messageLimiter.consume(namespace)
  .then(() => {
    // Consumed a token
    // Send message
    message.send();
  })
  .catch(() => {
    // No more token for namespace in current timespan
    // Silently discard message
  });
```

#### 2.1. Use synchronous API (boolean test)

```javascript
// This would be dynamic in your application, based on user session data, or user IP
namespace = "user_1";

// Check if user is allowed to send message
if (messageLimiter.consumeSync(namespace) === true) {
  // Consumed a token
  // Send message
  message.send();
} else {
  // consumeSync returned false since there is no more tokens available
  // Silently discard message
}
```

## Notes on performance

This module is used extensively on edge WebSocket servers, handling thousands of connections every second with multiple rate limit lists on the top of each other. Everything works smoothly, I/O doesn't block and RAM didn't move that much with the rate-limiting module enabled.

On one core / thread of 2.5 GHz Intel Core i7, the parallel asynchronous processing of 40,000 namespaces in the same limiter take an average of 300 ms, which is fine (7.5 microseconds per operation).

## Why not using existing similar modules?

I was looking for an efficient, yet simple, DOS-prevention technique that wouldn't hurt performance and consume tons of memory. All proper modules I found were relying on Redis as the keystore for limits, which is definitely not great if you want to keep away from DOS attacks: using such a module under DOS conditions would subsequently DOS Redis since 1 (or more) Redis queries are made per limit check (1 attacker request = 1 limit check). Attacks should definitely not be allieviated this way, although a Redis-based solution would be perfect to limit abusing users.

This module keeps all limits in-memory, which is much better for our attack-prevention concern. The only downside: since the limits database isn't shared, limits are per-process. This means that you should only use this module to prevent hard-attacks at any level of your infrastructure. This works pretty well for micro-service infrastructures, which is what we're using it in.
