import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";

type Bucket = { count: number; resetAt: number };

@Injectable()
export class WebhookRateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxPerMinute = 120;

  check(key: string) {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + 60_000 });
      return;
    }
    bucket.count += 1;
    if (bucket.count > this.maxPerMinute) {
      throw new HttpException("Too Many Requests", HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}

@Injectable()
export class WebhookRateLimitGuard implements CanActivate {
  constructor(private readonly limits: WebhookRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const orgId = req.params?.organizationId ?? "unknown";
    const path = String(req.path ?? req.url ?? "");
    let channel = "unknown";
    if (path.includes("telegram")) channel = "telegram";
    else if (path.includes("avito")) channel = "avito";
    else if (path.includes("/vk/")) channel = "vk";
    else if (path.includes("/max/")) channel = "max";
    this.limits.check(`${orgId}:${channel}`);
    return true;
  }
}
