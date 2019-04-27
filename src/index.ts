import { TwitchUtils } from './TwitchUtils';
import { Config } from './Config';
import * as fs from 'fs';

const config = new Config(`${ __dirname }/config.json`);
const username = config.get('username');
const client_id = config.get('client_id');
const client_secret = config.get('client_secret');
const data_path = config.get('data_path');

const twitch = new TwitchUtils(username, client_id, client_secret);

function handleError(err: any) {
  if(err.message) console.error(err.message);
  else console.error('an error occurred');
}

function updateTicker() {
  twitch.getFollowers().then((followers) => {
    const follower = followers.length > 0
      ? followers[0].name : ':(';
    fs.writeFile(`${ data_path }/twitch_latest_follower.txt`,
      follower, (err) => {
        if(err) throw err;
      });
  }).catch(handleError);
  twitch.getSubscribers().then((subs) => {
    const subscriber = subs.length > 0
      ? subs[0].name : ':(';
    fs.writeFile(`${ data_path }/twitch_latest_subscriber.txt`,
      subscriber, (err) => {
        if(err) throw err;
      });
  }).catch(handleError);
  twitch.getCheers().then((cheers) => {
    const cheerer = cheers.length > 0
      ? `${ cheers[0].name } (${ cheers[0].score })` : ':(';
    fs.writeFile(`${ data_path }/twitch_top_cheerer.txt`,
      cheerer, (err) => {
        if(err) throw err;
      });
  }).catch(handleError);
}

twitch.authenticate().then(() => {
  console.log(`Files will be saved to ${ data_path }.`);
  setInterval(updateTicker, 1000 * 20);
}).catch(handleError);
