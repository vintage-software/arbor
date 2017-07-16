import 'reflect-metadata';
import 'zone.js/dist/zone-node';

import './../common/rxjs-operators';

import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as logops from 'logops';

import { environment } from './../common/environments/environment';
import { AppModule } from './app.module';
import { getInjector } from './utilities/get-injector';

const expressLogging = require('express-logging');

(async function () {
  const _injector = await getInjector(AppModule);

  const app = express();
  const server = http.createServer(app);

  app.use(expressLogging(logops));
  app.use(bodyParser.json());

  app.use('/', express.static('./web'));

  server.listen(environment.serverPort, () => { console.log(`listening on port ${environment.serverPort}`); });
})();
