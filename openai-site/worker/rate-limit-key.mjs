import {isIP} from 'node:net';
import {ipKeyGenerator} from 'express-rate-limit';

// Only the Cloudflare Worker adapter installs this key. Standalone Express keeps
// its socket-based default and never trusts a caller's forwarding headers.
// CF-Connecting-IP is supplied by the hosting edge. Missing/invalid values share
// a conservative bucket instead of disabling the limiter or hashing undefined.
export function edgeRateLimitKey(request){
  const ip=request.get('cf-connecting-ip');
  return typeof ip==='string'&&isIP(ip)
    ? 'edge:'+ipKeyGenerator(ip,56)
    : 'edge:unavailable';
}
