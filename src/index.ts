import { TwitchUtils } from './TwitchUtils';
import { Config } from './Config';
import * as fs from 'fs';

const config = new Config(`${ __dirname }/config.json`);
const username: string = config.get('username');
const client_id: string = config.get('client_id');
const client_secret: string = config.get('client_secret');
const data_path: string = config.get('data_path');
const follows: boolean = config.get('follows', true);
const subs: boolean = config.get('subs', true);
const cheers: boolean = config.get('cheers', true);

const twitch = new TwitchUtils(username, client_id, client_secret);

function handleError(err: any) {
  if(err.message) console.error(err.message);
  else console.error('an error occurred');
}

let lastFollower: string;
let lastSub: string;
let topCheer: string;

async function saveFiles(last: string, values: string[], fprefix: string): Promise<string> {
  if(values.length > 0) {
    if(values[0] !== last) {
      last = values[0];
      console.log(`New ${ fprefix } detected.`);
      for(let i = 0; i < values.length; i++) {
        await fs.writeFile(`${ data_path }/${ fprefix }-${ i }.txt`,
          values[i], (err) => {
            if(err) throw err;
          });
      }
    }
  } else {
    await fs.writeFile(`${ data_path }/${ fprefix }-0.txt`, ':(', (err) => {
      if(err) throw err;
    });
  }
  return last;
}

function updateTicker() {
  if(follows) {
    twitch.getFollowers().then(async (followers) => {
      lastFollower = await saveFiles(lastFollower, followers.map(f => f.name), 'follow');
    }).catch(handleError);
  }

  if(subs) {
    twitch.getSubscribers().then(async (subs) => {
      lastSub = await saveFiles(lastSub, subs.map(s => s.name), 'sub');
    }).catch(handleError);
  }

  if(cheers) {
    twitch.getCheers().then(async (cheers) => {
      topCheer = await saveFiles(topCheer, cheers.map(c => `${ c.name }: ${ c.score }`), 'cheer');
    }).catch(handleError);
  }
}

twitch.authenticate(subs, cheers).then(() => {
  console.log(`Files will be saved to ${ data_path }.`);
  updateTicker();
  setInterval(updateTicker, 1000 * 20);
}).catch(handleError);
