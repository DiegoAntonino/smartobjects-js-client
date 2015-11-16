import * as http from 'http';
import * as https from 'https';

import {Request, RequestMethods} from '../request';

export function nodeHttpRequest(request: Request) {
  const data = request.payload();

  const options: http.RequestOptions = {
    protocol: request.options.protocol + ':',
    hostname: request.options.hostname,
    port: request.options.port,
    method: RequestMethods[request.method],
    path: request.options.path,
    headers: {
      'Content-Length': Buffer.byteLength(data)
    }
  };

  request.options.headers.forEach((value, header) => {
    options.headers[header] = value;
  });

  const promise = new Promise((resolve, reject) => {
    const cb = function(response: http.IncomingMessage) {
      console.log('STATUS: ' + response.statusCode);
      console.log('HEADERS: ' + JSON.stringify(response.headers));
      response.setEncoding('utf8');
      let data = '';
      response.on('data', function (chunk: string) {
        console.log('BODY: ' + chunk);
        data += chunk;
      });
      response.on('end', function() {
        console.log('No more data in response.');
        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (response.headers &&
              response.headers['content-type'].indexOf('application/json') !== -1) {
            data = JSON.parse(data);
          }
          resolve(data);
        } else {
          reject(response.statusCode);
        }
      });
    };

    let req: http.ClientRequest;

    if (request.options.protocol === 'https') {
      req = https.request(options, cb);
    } else {
      req = http.request(options, cb);
    }

    req.on('error', (error: any) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });

  return promise;
}
