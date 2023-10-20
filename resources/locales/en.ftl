-language = English
-flag = 🇺🇸
full-language-name = {-flag} English

-promotion-channel = https://t.me/panchanporjat
-promotion-chat = https://t.me/panchanchat
-support-bot = https://t.me/panchanideasbot

# Universal
yes = Yes
no = No
media-pack = Media Pack
title-pack = Title Pack
anonymous-author = Anonymous
no-description = _No description_
user-link = [{$name}](https://t.me/{$id})

# Conditional
pack-type = { $type ->
    [media] *media*
    *[titles] *titles*
}

pack-privacy = { $private ->
    [true] private
    *[false] public
}

used-in-chats-count = { NUMBER($chatCount) ->
    [zero] chats
    [one] chat
    *[few] chats
}

title-count = { NUMBER($elementCount) ->
    [zero] titles
    [one] title
    *[many] titles
}

element-count = { $type ->
    [media] media
    *[titles] {title-count}
}

bot-error = 💀 Something went wrong... I've already reported the error to the developer.


# Menus
back-button = ◀️ Back
general-menu-button = ⏪ Main Menu

### General
menu-general =
    Hello! I can create funny things from your photos and videos.

    Subscribe to [our channel]({-promotion-channel}) and join [our chat]({-promotion-chat}).

    ❔ _Found a bug or have an idea? Write to us_ [here]({-support-bot})_!_
menu-general-button =
    .preferences = ⚙️ Preferences
    .title-packs = 🏷️ Title Packs
    .media-packs = 🎞️ Media Packs
    .guide = 📖 Guide (RU)
    .your-chats = 💬 Your Chats
    .process-media = 🔄 Process Media

### General -> Preferences
menu-preferences = What are we configuring?
menu-preferences-button =
    .language = 🌐 Language
    .privacy = 🙊 Privacy
    .commands = 📋 Commands

### General -> Preferences -> Language
menu-language =
    Choose the bot's language.

    ⚠️ _Translation doesn't apply to search and title packs!_

### General -> Preferences -> Privacy
menu-privacy =
    Configure your privacy settings.

    `Anonymous Mode` hides your username in /orig and authors of packs.

    `Include in Search` allows media you create to appear in search results.
menu-privacy-button =
    .anonymous = Anonymous Mode
    .search-included = Include in Search

### General -> Title / Media packs
menu-pack-list =
    Here are the {pack-type} packs.

    ❕_Elements from these packs are used in_ /rlobster _and in_ /rdem.
menu-pack-list-button =
    .create = ❇️ Create Pack
    .public = Public
    .own = Only Mine

### General -> Title / Media packs -> Some pack
menu-pack =
    You selected {pack-privacy} {pack-type} pack `#{$id}`

    {""}*Name*: {$name}
    {""}*Description*: {$description}
    {""}*Author*: [{$author}](https://t.me/{$author})

    The pack contains {$elementCount} {element-count} and is used in {$chatCount} {used-in-chats-count}
    { $nsfw ->
        [true] **
        🔞 Contains explicit content
        *[false] {""}
    }{ $default ->
        [true] **
        🍀 This pack is default
        *[false] {""}
    }
    .not-found =
        The selected pack was not found!

        ❕ _Perhaps it has been deleted or you don't have permission to access it._
menu-pack-button =
    .install = 📥 Choose Chats for Pack
    .edit = ✏️ Edit Pack
    .browser = 🔎 Element Browser
    .delete = 🗑️ Delete Pack
    .export = 💾 Export to .txt

### General -> Title / Media packs -> Some pack -> Element browser
menu-element-browser =
    Elements of pack `#{$packId}`

    You can add to it with the command `/add {$packId} content`

    {$elements}

    Page {$page} of {$totalPages}
    .empty =
    Pack `#{$packId}` is currently empty.

    You can add to it with the command `/add {$packId} content`
    .element = (`{$id}`) `{$content}`

### General -> Title / Media packs -> Some pack -> Element browser -> Some element
menu-element =
    Element Configuration

    {""}*ID*: `#{$id}`
    {""}*Type*: { $type ->
        *[TEXT] text
        [PHOTO] photo
        [VIDEO] video
        [STICKER] sticker
        [ANIMATION] animation
    }
    {""}*Author*: [{$author}](https://t.me/{$author})

    ———
    { $type ->
        [TEXT] `{$content}`
        *[MEDIA] _<media content>_
    }
    ———

    Use `/editel {$id} new content` to edit the element.
    .empty = This element was not found!
    .unsuccess = Element could not be deleted. It might have been moved or deleted.
    .success = Element has been deleted!
menu-element-button =
    .delete = 🗑️ Delete from Pack

# General -> Title / Media packs -> Some pack -> Install
menu-chat-list =
    Listed here are chats where you are an *administrator*.
    Click on a chat to *enable* or *disable* the pack for it.

    {""}*If the chat is missing:*

    ❕Use /refresh in the chat to update the bot's database (this command is harmless, feel free to use it!)

    ❕Ensure you are an administrator or creator of the chat.
menu-chat-list-button =
    .invite-bot = ❇️ Add Bot to Chat

# Commands
rate-limit = 🤬 It seems you're trying to use commands too frequently. Time to slow down!
queue =
    Your position in the queue: {$pos}/{$length}
    Approximately {$estimated} seconds left.
    .start = You are currently in the queue for processing. Please wait a moment!
command-aware-scale =
    .prepare = 📥 Downloading video
    .extracting-frames = 🎞️ Extracting frames from video
    .processing-chunk = ⌛️ Video processing at *{$progress}%*. Remaining: {$remaining} seconds
    .encoding-video = 🚀 Encoding video and uploading to Telegram...
    .rate-limit = The Aware Scale can be used no more often than once every 1 minute.
    .too-many-frames =
    🙁 Your video is too large ({$error} frames)!

    Processing large videos is only available to users who support the bot.

command-add =
    .no-id = You didn't specify an ID. The command should follow the format `/add pack_id content`
    .not-found = The specified pack was not found. Make sure you have access to it!
    .empty = You didn't provide any content!
    .incompatible-types =
        This pack doesn't accept this type of elements.

        Title packs can only accept text.
        Media packs can only accept photos, videos, and GIFs.
    .ok = Element added to pack `#{$packId}`!
command-edit = Element `#{$id}` has been edited!
command-promote =
    User *{$name}* is now an editor for pack `#{$packId}`.

    {""}*Total pack editors*: `{$editorCount}`.
    {""}*Among them*: {$editors}
    .already = This user is already an editor of the pack!
    .empty = This pack doesn't exist or you don't have permission to do this (only the pack's author can add editors).
    .user-not-found =
        The specified user is not found in the bot's database.

        Ask them to use the bot, for example, generate media using /vriba!
    .no-user =
        You didn't specify a user!

        Reply to the user's message with the command `/promote pack_id`
    .no-pack =
        You didn't specify a pack ID.

        Reply to the user's message with the command `/promote pack_id`.

        You can find the pack's ID in the list of packs.
command-demote =
    User {$name} has been demoted from the editor position of pack `#{$packId}`.

            {""}*Total pack editors*: `{$editorCount}`.
            {""}*Among them*: {$editors}
    .already = This user is not an editor of the pack!
    .user-not-found =
        The specified user is not found in the bot's database.

        Ask them to use the bot, for example, generate media using /fisheye!
    .no-user =
        You didn't specify a user!

        Reply to the user's message with the command `/demote pack_id`
    .no-pack =
        You didn't specify a pack ID.

        Reply to the user's message with the command `/demote pack_id`.

        You can find the pack's ID in the list of packs.
command-force-chat-update = ✅
    .private-chat = You must be in a chat, not a private conversation with the bot!
command-orig =
    👤 [{$author}](https://t.me/{$author})
    📆 { DATETIME($createdAt, month: "long", year: "numeric", day: "numeric") }
    👁️ {$useCount} { NUMBER($useCount) ->
        [one] time
        [few] times
        *[many] times
    }
    .not-found =
        🫥 *Original not found!*

        _Possible reasons:_
        1) Media was not created in this bot. Compare the watermark with `@panchanporjat`.
        2) Media was created a long time ago, and the format is no longer supported.
        3) Media was recompressed in Telegram. Even the bot can't help here!
    .command = Command used: `/{$command}`
    .args =
        This media had arguments applied:
        ```
        {$args}
        ```
    .chained =
        🎞️ _This media is part of a processing chain._
        _Click forward ➡️ to find the next original ({$remainingMedia} remaining)._
    .restricted = (controlled by {$author})
command-random =
    .no-text = You didn't provide text for random generation!
    .no-media = You didn't attach media!
command-no-private =
    This command is not available for execution in chats!
    Press the button to switch to private messages.
    .go = Go ahead!
command-no-media =
    🥸 This command works only with media data:
    {$types}

    Send me a media file or reply to a message containing a media file
    .photo = `photo`
    .video = `video`
    .animation = `animation`
    .photo-sticker = `photo-sticker`
    .video-sticker = `video-sticker`

# Conversations
conv-create-pack =
    .step-1 =
        {""}*Step 1/5*

        Choose the pack type:

        `{ media-pack }` - for photos, videos, and GIFs
        `{ title-pack }` - for text and titles
    .step-2 =
        {""}*Step 2/5*

        Choose a name for your pack.
        The name cannot be changed later.

        ⚠️ _Names longer than 32 characters will be truncated!_
    .step-3 =
        {""}*Step 3/5*

        Will your pack be private or public?

        You can only connect a private pack to chats where you are an administrator.

        Public packs can be connected by all users.
    .step-4 =
        {""}*Step 4/5*

        If you want, you can provide a description for your pack.

        To leave it empty, press the button below.
    .step-5 =
        {""}*Step 5/5*

        Will your pack contain explicit content, offensive language, or other 🔞 NSFW material?

        The corresponding label will be displayed on your pack's page.
    .ok = Pack edited! You can find it in the main menu - /menu.
    .cancelled = Pack creation has been cancelled!
conv-create-pack-button =
    .cancel = Cancel Creation
    .remain = Keep as Is
    .private = Private
    .public = Public
    .empty = Leave Empty
    .yes = {yes}
    .no = {no}
conv-delete-pack = Are you sure you want to delete pack `{$id}`?
    .cancelled = Deletion has been cancelled! You can return to the main menu - /menu.
    .no-button-called = You didn't use any buttons. Deletion has been cancelled.
    .error = This pack doesn't exist. It might have already been deleted!
    .ok = Pack `{$id}` has been deleted. You can return to the main menu - /menu.
conv-delete-pack-button =
    .yes = {yes}
    .no = {no}
conv-export-pack =
    .empty = Cannot export an empty pack!
