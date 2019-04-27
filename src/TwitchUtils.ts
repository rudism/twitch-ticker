import * as request from 'request';
import { parse } from 'url';
import { exec } from 'child_process';
import { stringify } from 'querystring';
import * as http from 'http';
import * as readline from 'readline';
import { Config } from './Config';

export class TwitchUtils {
  private auth = new Config(`${ __dirname }/auth.json`);

  constructor(
    private username: string,
    private client_id: string,
    private client_secret: string,
) { }

  private endpoints = {
    auth: 'https://id.twitch.tv/oauth2/authorize',
    token: 'https://id.twitch.tv/oauth2/token',
    user: 'https://api.twitch.tv/helix/users',
    follows: 'https://api.twitch.tv/helix/users/follows',
    subscribers: 'https://api.twitch.tv/helix/subscriptions',
    cheers: 'https://api.twitch.tv/helix/bits/leaderboard',
  };

  private getUrl(url: string, query: any) {
    return `${ url }?${ stringify(query) }`;
  }

  private makeRequest(url: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      request({
        url,
        method: 'GET',
        json: true,
        headers: { Authorization: `Bearer ${ token }` }
      }, (err, resp, body) => {
        if(err) reject(err);
        resolve(body);
      });
    });
  }

  public authenticate(): Promise<void> {
    let server: http.Server;
    return new Promise<string>((resolve, reject) => {
      if(this.auth.get('token')) {
        resolve(this.auth.get('token'));
      } else {
        const url = this.getUrl(this.endpoints.auth, {
          client_id: this.client_id,
          redirect_uri: 'http://localhost:9087',
          response_type: 'code',
          scope: 'channel:read:subscriptions bits:read',
        });
        server = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-type': 'text/html' });
          res.write(`<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='utf-8'>
<title>linux-ticker</title>
<script>window.close()</script>
</head>
<body>
<p>Authentication was successful, you can close this browser window now.</p>
</body>
</html>
`);
          res.end();
          const query = parse(req.url!, true).query;
          const tokenurl = this.getUrl(this.endpoints.token, {
              client_id: this.client_id,
              client_secret: this.client_secret,
              code: query.code,
              grant_type: 'authorization_code',
              redirect_uri: 'http://localhost:9087'
          });
          request({
            method: 'POST',
            url: tokenurl,
            json: true
          }, (err, resp, body) => {
            if(err) reject(err);
            this.auth.set('token', body.access_token);
            this.auth.set('refresh', body.refresh_token);
            resolve(body.access_token);
          });
        }).listen(9087);
        exec(`xdg-open "${ url }"`);
      }
    }).then((auth_token) => {
      if(server) server.close();
      this.auth.set('token', auth_token);
      return this.makeRequest(this.getUrl(this.endpoints.user, {
        login: this.username,
      }), this.auth.get('token'));
    }).then((body) => {
      this.auth.set('user_id', body.data[0].id);
    });
  }

  public getFollowers(): Promise<{ id: string, name: string }[]> {
    return this.makeRequest(this.getUrl(this.endpoints.follows, {
        to_id: this.auth.get('user_id')
    }), this.auth.get('token')).then((body) => {
      return body.data.map((user: any) => {
        return { id: user.from_id, name: user.from_name };
      });
    });
  }

  public getSubscribers(): Promise<{ id: string, name: string }[]> {
    return this.makeRequest(this.getUrl(this.endpoints.subscribers, {
        broadcaster_id: this.auth.get('user_id')
    }), this.auth.get('token')).then((body) => {
      return body.data.map((sub: any) => {
        return { id: sub.user_id, name: sub.user_name };
      });
    });
  }

  public getCheers(): Promise<{ id: string, name: string, score: number }[]> {
    return this.makeRequest(
      this.getUrl(this.endpoints.cheers, {}), this.auth.get('token'))
    .then((body) => {
      return body.data.map((cheer: any) => {
        return { id: cheer.user_id, name: cheer.user_name, score: cheer.score };
      });
    });
  }
}
