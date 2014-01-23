Tanks game using node.js and box2dweb.

Todo/wish List, in no particular order of importance or difficulty:
- Reduce number of messages between server and client. The server doesn't need to send out messages for every little position change. The client should predict what the server is going to do, and then use smooth animation to correct this when it syncs with the server. If this is accomplished, the server could use bigger time steps to reduce load.
- Improvements to multiplayer, including a lobby listing available games, invitations, a load balancer that knows which games belong to which server.
- Better touch screen controls. This includes making the screen not scroll or magnify when you press buttons. Also, if touch is used, mouse controls should be disabled, otherwise the game thinks you're constantly trying to move the gun.
- Fix Firefox mac support. For some reason actors don't get destroyed on Firefox mac, but it seems to work on all other browsers (including Firefox on windows). Also, Firefox mac doesn't play mp3's, so we need to encode all the sounds as ogg or use a flash fallback.
- Fix all the actors (obviously). TNT, health beacons, mud and speed patches, explosions, and trees (maybe others) don't work currently.
- Balance tanks. Currently the hover tank is too fast and powerful. The heavy tank's bullets are too slow also.
- Better code organization.
- Power-ups and more weapons/other items.
- Team mode.
- Computer players/AI.
- A level editor.
- Level and tank previews while choosing them.
- Get rid of the useless levels where tanks are trapped somewhere.
- Make pages prettier and more organized.
- Make pages for error messages instead of just a string in main.js.
- Save options when user changes them.
- Facebook integration for invites (good idea or not?).
- Fix layering in the client.
- Use the canvas to pick a tank and level.
- Missile path correction, and heat seeking missiles.
