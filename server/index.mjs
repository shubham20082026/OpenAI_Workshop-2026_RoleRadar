import 'dotenv/config';
import {createApp,readConfig} from './app.mjs';
const config=readConfig();
const server=createApp(config).listen(config.port,'127.0.0.1',error=>{
  if(error){
    console.error(error.code==='EADDRINUSE'
      ? `RoleRadar could not start: port ${config.port} is already in use. Close the earlier local server or choose another PORT and APP_URL.`
      : `RoleRadar could not open its local port (${error.code || 'unknown error'}).`);
    process.exitCode=1;
    return;
  }
  console.log(`RoleRadar ready: http://127.0.0.1:${server.address().port}`);
});
