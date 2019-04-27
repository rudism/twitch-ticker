## twitch-ticker

This node app will authenticate with Twitch and write the name of your most recent followers, subscribers, and top cheerers to text files in a directory of your choice. You can then use these as text sources in OBS Studio to display the user names in your Twitch stream.

### Building and Running

You'll need to register a new application at https://dev.twitch.tv and generate a client secret for it. Then copy the `config.json.example` file to `config.json` and edit it with your details appropriately. Then just build and run the application:

```
> npm install
> npm start
```

The first time you run it, a browser window will open requiring you to log into Twitch and grant the application access. Once access has been granted, the usernames will be output to the directory specified in your config. You should only have to grant access once (your access token will be saved to an `auth.json` file).

To make running it easier after your initial build, you can put something like this in your path:

```
#!/bin/env sh

rm -f ~/.twitch-ticker/*.txt
node /path/to/twitch-ticker/build/index.js
```
