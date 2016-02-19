# fast-ratelimit

[![Build Status](https://travis-ci.org/valeriansaliou/fast-ratelimit.svg?branch=master)](https://travis-ci.org/valeriansaliou/fast-ratelimit) [![](https://badge.fury.io/js/fast-ratelimit.svg)](https://www.npmjs.com/package/fast-ratelimit)

Fast & efficient in-memory rate-limit, used to alleviate severe DOS attacks.

This rate-limiter was designed to be as generic as possible, usable in any NodeJS project environment, regardless of wheter you're using a framework or vanilla code.

## How to install?

Include `rate-limit` in your `package.json` dependencies.

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
  threshold : 20 // available limit tokens on given ttl value.
  ttl       : 60 // time-to-live value of limiter in seconds, resets every ttl seconds after first token request.
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
  .then((remaining_tokens) => {
    // Consumed a token, remaining_tokens is passed with the number of remaining tokens for next message sends
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

// Check if user is allowed to send message (consumeSync returns remaining tokens as in asynchronous API)
// BEWARE: if consumeSync returns 0, it means the last remaining token was consumed, which means that the message can be sent
if (messageLimiter.consumeSync(namespace) >= 0) {
  // Consumed a token, remaining_tokens is passed with the number of remaining tokens for next message sends
  // Send message
  message.send();
} else {
  // consumeSync returned -1 since there's no more tokens available
  // Silently discard message
}
```

## Why not using existing similar modules?

I was looking for an efficient, yet simple, DOS-prevention technique that wouldn't hurt performance and consume tons of memory. All proper modules I found were relying on Redis as the keystore for limits, which is definitely not great if you want to keep away from DOS attacks: using such a module under DOS conditions would subsequently DOS Redis since 1 (or more) Redis queries are made per limit check (1 attacker request = 1 limit check). Attacks should definitely not be allieviated this way, although a Redis-based solution would be perfect to limit abusing users.

This module keeps all limits in-memory, which is much better for our attack-prevention concern. The only downside: since the limits database isn't shared, limits are per-process. This means that you should only use this module to prevent hard-attacks at any level of your infrastructure. This works pretty well for micro-service infrastructures, which is what we're using it in.
