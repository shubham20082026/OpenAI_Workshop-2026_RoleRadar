import {createServer} from 'node:http';
import {handleAsNodeRequest} from 'cloudflare:node';
import {createApp,readConfig} from '../server/app.mjs';
import {createHostedOpportunityService} from '../server/hosted-catalog.mjs';
import {edgeRateLimitKey} from './rate-limit-key.mjs';

let started=false;
const API_PORT=8788;

export function apiFetch(request,env){
  if(!started){
    const origin=env.APP_URL||new URL(request.url).origin;
    const config={...readConfig({
      APP_URL:origin,
      NODE_ENV:env.NODE_ENV==='development'?'development':'production',
      SUPABASE_URL:env.SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY:env.SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_DELETE_FUNCTION:env.SUPABASE_DELETE_FUNCTION,
    }),serveFrontend:false};
    const opportunityService=createHostedOpportunityService({db:env.DB,apiKey:env.HIMALAYAS_API_KEY||''});
    const app=createApp(config,{opportunityService,rateLimitKey:edgeRateLimitKey});
    // Workers maps this number to a request handler, not a public network port.
    createServer(app).listen(API_PORT);
    started=true;
  }
  return handleAsNodeRequest(API_PORT,request);
}
