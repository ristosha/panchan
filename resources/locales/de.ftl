-language = Deutsch
-flag = 🇩🇪
full-language-name = {-flag} {-language}

-promotion-channel = https://t.me/panchanporjat
-promotion-chat = https://t.me/panchanchat
-support-bot = https://t.me/panchanideasbot

# Universal
yes = Ja
no = Nein
media-pack = Medien-Pack
title-pack = Titel-Pack
anonymous-author = Unbekannt
no-description = _Keine Beschreibung_
user-link = [{$name}](https://t.me/{$id})

# Conditional
### Set (what?)
pack-type = { $type ->
    [media] *Medien*
    *[titles] *Titel*
}

### Set (which?)
pack-privacy = { $private ->
    [true] privat
    *[false] öffentlich
}

# Used in...
used-in-chats-count = { NUMBER($chatCount) ->
    [zero] Chats
    [one] Chat
    *[few] Chats
}

title-count = { NUMBER($elementCount) ->
    [zero] Titel
    [one] Titel
    [few] Titel
    *[many] Titel
}

element-count = { $type ->
    [media] Medien
    *[titles] {title-count}
}

bot-error = 💀 Etwas ist schief gelaufen... Ich habe den Fehler bereits an den Entwickler gemeldet. 

# Menus
back-button = ◀️ Zurück
general-menu-button = ⏪ Hauptmenü

### General
menu-general =
    Hallo! Ich kann lustige Dinge aus Ihren Fotos und Videos machen.

    Folgen Sie unserem [Kanal]({-promotion-channel}) und treten Sie unserem [Chat]({-promotion-chat}) bei.

    ❕_Haben Sie einen Fehler gefunden oder möchten Sie eine Idee vorschlagen? Schreiben Sie uns_ [hier]({-support-bot})_!_
menu-general-button =
    .preferences = ⚙️ Einstellungen
    .title-packs = 🏷️ Titel-Packs
    .media-packs = 🎞️ Medien-Packs
    .your-chats = 💬 Ihre Chats
    .guide = 📖 Anleitung zu Argumenten (RU)
    .process-media = 🔄 Medien verarbeiten

### General -> Preferences
menu-preferences = Was möchten Sie einstellen?
menu-preferences-button =
    .language = 🌐 Sprache
    .privacy = 🙊 Datenschutz
    .commands = 📋 Befehle

### General -> Preferences -> Language
menu-language =
    Wählen Sie die Botsprache aus.

    ⚠️ _Die Übersetzung gilt nicht für die Suche und die Titel-Packs!_

### General -> Preferences -> Privacy
menu-privacy =
    Passen Sie Ihre Datenschutzeinstellungen an.

    `Anonymität` verbirgt Ihren Benutzernamen in /orig und in den Autoren der Packs.

    `In der Suche anzeigen` ermöglicht es, von Ihnen erstellte Medien in den Suchergebnissen anzuzeigen.
menu-privacy-button =
    .anonymous = Anonymität
    .search-included = In der Suche anzeigen

### General -> Title / Media packs
menu-pack-list =
    Hier finden Sie {pack-type}-Packs.

    ❕_Elemente aus diesen Packs werden in _/rlobster_ und _/rdem_ verwendet_.
menu-pack-list-button =
    .create = ❇️ Pack erstellen
    .public = Öffentlich
    .own = Nur meine

### General -> Title / Media packs -> Some pack
menu-pack =
    Sie haben ein {pack-privacy} {pack-type}-Pack `#{$id}` ausgewählt.

    {""}*Name*: {$name}
    {""}*Beschreibung*: {$description}
    {""}*Autor*: [{$author}](https://t.me/{$author})

    Das Pack enthält {$elementCount} {element-count} und wird in {$chatCount} {used-in-chats-count} verwendet.
    { $nsfw ->
        [true] **
        🔞 Enthält expliziten Inhalt
        *[false] {""}
    }{ $default ->
        [true] **
        🍀 Dieses Pack ist standardmäßig
        *[false] {""}
    }
    .not-found =
        Das ausgewählte Pack wurde nicht gefunden!

        ❕ _Möglicherweise wurde es gelöscht oder Sie haben keine Berechtigung dafür._
menu-pack-button =
    .install = 📥 Pack für Chats auswählen
    .edit = ✏️ Pack bearbeiten
    .browser = 🔎 Element-Browser
    .delete = 🗑️ Pack löschen
    .export = 💾 Als .txt exportieren

### General -> Title / Media packs -> Some pack -> Element browser
menu-element-browser =
    Elemente des Packs `#{$packId}`

    Sie können es mit dem Befehl `/add {$packId} Inhalt` ergänzen.

    {$elements}

    Seite {$page} von {$totalPages}
    .empty =
        Das Pack `#{$packId}` ist derzeit leer.

        Sie können es mit dem Befehl `/add {$packId} Inhalt` ergänzen.
    .element = (`{$id}`) `{$content}`

### General -> Title / Media packs -> Some pack -> Element browser -> Some element
menu-element =
    Element anpassen

    {""}*ID*: `#{$id}`
    {""}*Typ*: { $type ->
        *[TEXT] Text
        [PHOTO] Bild
        [VIDEO] Video
        [STICKER] Sticker
        [ANIMATION] Animation
    }
    {""}*Autor*: [{$author}](https://t.me/{$author})

    ———
    { $type ->
        [TEXT] `{$content}`
        *[MEDIA] _<Medieninhalt>_
    }
    ———

    Verwenden Sie `/editel {$id} neuer Inhalt`, um das Element zu bearbeiten.
    .empty = Dieses Element wurde nicht gefunden!
    .unsuccess = Das Element konnte nicht gelöscht werden. Möglicherweise wurde es verschoben oder gelöscht.
    .success = Das Element wurde gelöscht!
menu-element-button =
    .delete = Aus dem Pack löschen

# General -> Title / Media packs -> Some pack -> Install
menu-chat-list =
    Hier sind die Chats aufgeführt, in denen Sie *Administrator* sind.
    Klicken Sie auf einen Chat, um das Pack für ihn zu *aktivieren* oder zu *deaktivieren*.

    {""}*Wenn der Chat nicht aufgeführt ist:*

    ❕ Verwenden Sie in diesem Chat den Befehl /refresh, um die Bot-Datenbank zu aktualisieren (dieser Befehl ist harmlos, zögern Sie nicht, ihn zu verwenden!)

    ❕ Stellen Sie sicher, dass Sie Administrator oder Ersteller des Chats sind.
menu-chat-list-button =
    .invite-bot = ❇️ Bot zum Chat hinzufügen

# Befehle
command-no-media = 
    🥸 Dieser Befehl funktioniert nur mit Mediendaten: 
    {$types}
    
    Schicken Sie mir eine Mediendatei oder antworten Sie auf eine Nachricht, die eine Mediendatei enthält
    .photo = `Foto`
    .video = `Video`
    .animation = `Animation`
    .photo-sticker = `Foto-Sticker`
    .video-sticker = `Video-Sticker`
command-add =
    .no-id = Sie haben keine ID angegeben. Der Befehl muss im Format `/add Pack-ID Inhalt` sein.
    .not-found = Das angegebene Pack wurde nicht gefunden. Überprüfen Sie, ob Sie darauf Zugriff haben!
    .empty = Sie haben keinen Inhalt angegeben!
    .incompatible-types =
        Dieses Pack akzeptiert diesen Elementtyp nicht.

        Titel-Packs können nur Text akzeptieren.
        Medien-Packs können nur Fotos, Videos und GIFs akzeptieren.
    .ok = Das Element wurde dem Pack `#{$packId}` hinzugefügt!
command-edit = Das Element `#{$id}` wurde bearbeitet!
command-promote =
    Der Benutzer *{$name}* ist jetzt ein Redakteur des Packs `#{$packId}`.

    {""}*Gesamtzahl der Pack-Redakteure*: `{$editorCount}`.
    {""}*Unter ihnen*: {$editors}
    .already = Dieser Benutzer ist bereits ein Redakteur des Packs!
    .empty = Dieses Pack existiert nicht oder Sie haben keinen Zugriff darauf (nur der Pack-Autor kann Redakteure hinzufügen).
    .user-not-found =
        Der angegebene Benutzer wurde nicht in der Bot-Datenbank gefunden.

        Bitten Sie ihn, den Bot zu verwenden, z. B. um Medien mit /vriba zu generieren!
    .no-user =
        Sie haben keinen Benutzer angegeben!

        Antworten Sie auf die Nachricht des Benutzers mit dem Befehl `/promote Pack-ID`.
    .no-pack =
        Sie haben keine Pack-ID angegeben.

        Antworten Sie auf die Nachricht des Benutzers mit dem Befehl `/promote Pack-ID`.

        Die Pack-ID finden Sie in der Liste der Packs.
command-demote =
    Der Benutzer {$name} wurde als Redakteur des Packs `#{$packId}` abgesetzt.

    {""}*Gesamtzahl der Pack-Redakteure*: `{$editorCount}`.
    {""}*Unter ihnen*: {$editors}
    .already = Dieser Benutzer ist kein Redakteur des Packs!
    .user-not-found =
        Der angegebene Benutzer wurde nicht in der Bot-Datenbank gefunden.

        Bitten Sie ihn, den Bot zu verwenden, z. B. um Medien mit /vriba zu generieren!
    .no-user =
        Sie haben keinen Benutzer angegeben!

        Antworten Sie auf die Nachricht des Benutzers mit dem Befehl `/demote Pack-ID`.
    .no-pack =
        Sie haben keine Pack-ID angegeben.

        Antworten Sie auf die Nachricht des Benutzers mit dem Befehl `/demote Pack-ID`.

        Die Pack-ID finden Sie in der Liste der Packs.
command-force-chat-update = ✅
    .private-chat = Sie müssen sich in einem Chat befinden, nicht in einer privaten Nachricht mit dem Bot!
command-orig =
    👤 [{$author}](https://t.me/{$author})
    📆 { DATETIME($createdAt, month: "long", year: "numeric", day: "numeric") }
    👁️ {$useCount} { NUMBER($useCount) ->
        [one] mal
        [few] mal
        *[many] mal
    }
    .not-found =
        🫥 *Original nicht gefunden!*

        _Mögliche Gründe:_
        1) Das Medium wurde nicht in diesem Bot erstellt. Vergleichen Sie das Wasserzeichen mit `@panchanporjat`.
        2) Das Medium wurde vor langer Zeit erstellt und das Format wird nicht mehr unterstützt.
        3) Das Medium wurde von Telegram komprimiert. Hier ist selbst der Bot machtlos!
    .command = Befehl `/{$command}` verwendet
    .args =
        Für dieses Medium wurden Argumente angewendet:
        ```
        {$args}
        ```
    .chained =
        🎞️ _Dieses Medium ist Teil einer Verarbeitungskette._
        _Drücken Sie vorwärts ➡️, um das nächste Original zu finden (noch {$remainingMedia})._
    .restricted = (verwaltet von {$author})
command-random =
    .no-text = Sie haben keinen Text für den Zufall angegeben!
    .no-media = Sie haben keine Medien angehängt!
command-no-private = 
    Dieser Befehl kann nicht in Chats ausgeführt werden! 
    Klicken Sie auf die Schaltfläche, um zu privaten Nachrichten zu wechseln.
    .go = Go!
command-aware-scale =
    .prepare = 📥 Lade Video herunter
    .extracting-frames = 🎞️ Extrahiere Frames aus dem Video
    .processing-chunk = ⌛️ Videoverarbeitung bei *{$progress}%*. Verbleibend: {$remaining} Sekunden
    .encoding-video = 🚀 Kodiere Video und lade es in Telegram hoch...

# Unterhaltungen
conv-create-pack =
    .step-1 =
        {""}*Schritt 1/5*
        
        Wählen Sie den Pack-Typ aus:

        `{ media-pack }` - für Fotos, Videos und GIFs
        `{ title-pack }` - für Texte und Titel
    .step-2 =
        {""}*Schritt 2/5*

        Geben Sie Ihrem Pack einen Namen.
        Der Name kann später nicht geändert werden.

         ⚠️ _Namen über 32 Zeichen werden gekürzt!_
    .step-3 =
        {""}*Schritt 3/5*
        
        Soll Ihr Pack privat oder öffentlich sein?

        Sie können einen privaten Pack nur in Chats verwenden, in denen Sie Administrator sind.

        Jeder Benutzer kann einen öffentlichen Pack verwenden.
    .step-4 =
        {""}*Schritt 4/5*

        Falls gewünscht, können Sie eine Beschreibung für den Pack angeben.

        Lassen Sie es leer, um keine Beschreibung zu verwenden.
    .step-5 =
        {""}*Schritt 4/5*

        Enthält Ihr Pack obszöne, beleidigende oder explizite Inhalte?

        Entsprechende Tags werden auf der Pack-Seite angezeigt.
    .ok = Der Pack wurde bearbeitet! Sie können ihn im Hauptmenü finden - /menu.
    .cancelled = Die Pack-Erstellung wurde abgebrochen!
conv-create-pack-button =
    .cancel = Erstellung abbrechen
    .remain = Unverändert lassen
    .private = Privat
    .public = Öffentlich
    .empty = Leer lassen
    .yes = {yes}
    .no = {no}
conv-delete-pack = Möchten Sie den Pack `{$id}` wirklich löschen?
    .cancelled = Löschung abgebrochen! Sie können zum Hauptmenü zurückkehren - /menu.
    .no-button-called = Sie haben keine Schaltflächen verwendet. Löschung abgebrochen.
    .error = Ein solcher Pack existiert nicht. Möglicherweise wurde er bereits gelöscht!
    .ok = Der Pack `{$id}` wurde gelöscht. Sie können zum Hauptmenü zurückkehren - /menu.
conv-delete-pack-button =
    .yes = {yes}
    .no = {no}
conv-export-pack =
    .empty = Ein leerer Pack kann nicht exportiert werden!
