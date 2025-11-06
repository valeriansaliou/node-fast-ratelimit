/*
 * node-fast-ratelimit
 *
 * Copyright 2025, Valerian Saliou
 * Author: Valerian Saliou <valerian@valeriansaliou.name>
 */


export interface FastRateLimitOptions {
  threshold: number;
  ttl: number;
}

export class FastRateLimit {
  constructor(options: FastRateLimitOptions);

  consume(namespace: string): Promise<void>;
  consumeSync(namespace: string): boolean;

  consumeCount(namespace: string): Promise<number>;
  consumeCountSync(namespace: string): number;

  hasToken(namespace: string): Promise<void>;
  hasTokenSync(namespace: string): boolean;
}
