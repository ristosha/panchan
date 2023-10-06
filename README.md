# panchan
Telegram bot for image/video processing:
- Demotivator
- Text overlay with custom parameters
- Aware scale
- Balloon (v360)
- Fisheye (v360)
- Stretch
- Concatenate boom video (not made yet) 

[Last running version of bot in Telegram (may not work)](https://t.me/panchanporjatbot)

Based on FFmpeg, ImageMagick, Prisma and Grammy.

It can add watermark to all processed media and has localization to other languages (en, ru, de, uk).

Every chat can create separated random title/media pack (is used in `/rdem`, `/rlobster`commands) and moderate it.  

It automatically handles usages of generated media in chats and shows it in /orig as statistics.

Guide to a full argument list can be found only in Russian [there](https://telegra.ph/Panchan-bot-obnovlenie-08-21).
You can realize an own alias argument system using my package alias-mapper ([npm](https://www.npmjs.com/package/alias-mapper) | [GitHub](https://github.com/ristosha/alias-mapper)).

----
### Available commands
For generating:
- `/scale`
- `/balloon`
- `/fisheye`
- `/stretch`
- `/text`, `/lobster`
- `/orig` - get original media chain
- `/edit` - edit dem/text generated media

For randomized media:
- `/rdem`
- `/rlobster`, `/rtext`

For title/media packs:
- `/menu` - open menu to create a pack
- `/add <pack id> <new random title>`
- `/editel <element id> <new title content>`
- `/promote <pack id>` - reply to a message of required user to allow him to edit your pack
- `/demote <pack id>` - reversed version of previous command
- `/refresh` - passively update chat member to enable pack in a chat list

For bot admin:
- `/add_as_json <pack id>` - attach json array file to add all content to pack
- `/premium` - reply to user to remove watermark from their media
- `/set_default <pack id>` - enable/disable default status of pack
- `/stats` - provide statistics of bot as a message

Specify a channel id in env for auto upload media to first default media pack.

----
### Installation
Just use Docker Compose to run bot. 
1. Pull the repository
2. Create `.docker.env` file following `.docker.env.example` format.
3. Use `docker-compose up -d` for detach run. It may take some minutes to build ImageMagick from source.
