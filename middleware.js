import { next } from '@vercel/edge';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 1. 初始化 Upstash Redis 客户端
const redis = Redis.fromEnv();

// 2. 初始化限流器
const ratelimit = new Ratelimit({
  redis: redis,
  // 限制规则：1分钟内最多几次
  limiter: Ratelimit.slidingWindow(200, '1 m'),
});

export const config = {
  // 只限制 API 接口和主页，防止静态资源消耗额度
  matcher: ['/', '/api/:path*'],
};

export default async function middleware(request) {
  // 获取 IP
  const ip = request.ip || '127.0.0.1';
  
  try {
    // 检查限流
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new Response('访问频率过高，请稍后再试。', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }

    // 放行
    const res = next();
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    return res;

  } catch (err) {
    console.error('RateLimit Error:', err);
    // 如果 Redis 挂了，为了不影响用户，默认放行
    return next();
  }
}
