# node-fast-ratelimit

[![Test and Build](https://github.com/valeriansaliou/node-fast-ratelimit/workflows/Test%20and%20Build/badge.svg?branch=master)](https://github.com/valeriansaliou/node-fast-ratelimit/actions?query=workflow%3A%22Test+and+Build%22) [![NPM](https://img.shields.io/npm/v/fast-ratelimit.svg)](https://www.npmjs.com/package/fast-ratelimit) [![Downloads](https://img.shields.io/npm/dt/fast-ratelimit.svg)](https://www.npmjs.com/package/fast-ratelimit) [![Gitter](https://img.shields.io/gitter/room/valeriansaliou/node-fast-ratelimit.svg)](https://gitter.im/valeriansaliou/node-fast-ratelimit) [![Buy Me A Coffee](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg)](https://www.buymeacoffee.com/valeriansaliou)

Fast and efficient in-memory rate-limit, used to alleviate most common DOS attacks.

This rate-limiter was designed to be as generic as possible, usable in any NodeJS project environment, regardless of whether you're using a framework or just vanilla code. It does not require any dependencies, making it lightweight to install and use.

**🇫🇷 Crafted in Lannion, France.**

## Who uses it?

<table>
<tr>
<td align="center"><a href="https://crisp.chat/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/crisp.png" width="64" /></a></td>
<td align="center"><a href="https://www.doctrine.fr/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/doctrine.png" width="64" /></a></td>
<td align="center"><a href="https://anchor.chat/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/anchorchat.jpg" width="64" /></a></td>
<td align="center"><a href="https://westudents.it/"><img src="https://valeriansaliou.github.io/node-fast-ratelimit/images/westudents.png" width="64" /></a></td>
</tr>
<tr>
<td align="center">Crisp</td>
<td align="center">Doctrine</td>
<td align="center">Anchor.Chat</td>
<td align="center">WeStudents</td>
</tr>
</table>

_👋 You use fast-ratelimit and you want to be listed there? [Contact me](https://valeriansaliou.name/)._

## How to install?

Include `fast-ratelimit` in your `package.json` dependencies.

Alternatively, you can run `npm install fast-ratelimit --save`.

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

### 2. Check by consuming a token

On the message send portion of our application code, we would add a call to the ratelimiter instance.

#### 2.1. Consume token with asynchronous API (Promise catch/reject)

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

#### 2.2. Consume token with synchronous API (boolean test)

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

### 3. Check without consuming a token

In some instances, like password brute forcing prevention, you may want to check without consuming a token and consume only when password validation fails.

#### 3.1. Check whether there are remaining tokens with asynchronous API (Promise catch/reject)

```javascript
limiter.hasToken(request.ip).then(() => {
  return authenticate(request.login, request.password)
})
  .then(
    () => {
      // User is authenticated
    },

    () => {
      // User is not authenticated
      // Consume a token and reject promise
      return limiter.consume(request.ip)
        .then(() => Promise.reject())
    }
  )
  .catch(() => {
    // Either invalid authentication or too many invalid login
    return response.unauthorized();
  })
```

#### 3.2. Check whether there are remaining tokens with synchronous API (boolean test)

```javascript
if (!limiter.hasTokenSync(request.ip)) {
  throw new Error("Too many invalid login");
}

const is_authenticated = authenticateSync(request.login, request.password);

if (!is_authenticated) {
  limiter.consumeSync(request.ip);

  throw new Error("Invalid login/password");
}
```

## Notes on performance

This module is used extensively on edge WebSocket servers, handling thousands of connections every second with multiple rate limit lists on the top of each other. Everything works smoothly, I/O doesn't block and RAM didn't move that much with the rate-limiting module enabled.

On one core of a 2,3 GHz 8-Core Intel Core i9, the parallel asynchronous processing of 100,000 namespaces in the same limiter take an average of 160 ms, which is fine (1.6 microseconds per operation).

## Why not using existing similar modules?

I was looking for an efficient, yet simple, DOS-prevention technique that wouldn't hurt performance and consume tons of memory. All proper modules I found were relying on Redis as the keystore for limits, which is definitely not great if you want to keep away from DOS attacks: using such a module under DOS conditions would subsequently DOS Redis since 1 (or more) Redis queries are made per limit check (1 attacker request = 1 limit check). Attacks should definitely not be allieviated this way, although a Redis-based solution would be perfect to limit abusing users.

This module keeps all limits in-memory, which is much better for our attack-prevention concern. The only downside: since the limits database isn't shared, limits are per-process. This means that you should only use this module to prevent hard-attacks at any level of your infrastructure. This works pretty well for micro-service infrastructures, which is what we're using it in.
