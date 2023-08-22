-language = Українська
-flag = 🇺🇦
full-language-name = {-flag} {-language}

-promotion-channel = https://t.me/panchanporjat
-promotion-chat = https://t.me/panchanchat
-support-bot = https://t.me/panchanideasbot

# Universal
yes = Так
no = Ні
media-pack = Медіа-пак
title-pack = Тайтл-пак
anonymous-author = Невідомий
no-description = _Відсутній_
user-link = [{$name}](https://t.me/{$id})

# Conditional
### Набір (чого?)
pack-type = { $type ->
    [media] *медіа*
    *[titles] *тайтлів*
}

### Набір (якого?)
pack-privacy = { $private ->
    [true] приватний
    *[false] публічний
}

# використовується в...
used-in-chats-count = { NUMBER($chatCount) ->
    [zero] чатах
    [one] чаті
    *[few] чатах
}

title-count = { NUMBER($elementCount) ->
    [zero] тайтлів
    [one] тайтл
    [few] тайтла
    *[many] тайтлів
}

element-count = { $type ->
    [media] медіа
    *[titles] {title-count}
}

bot-error = 💀 Щось пішло не так... Я вже повідомив розробнику про цю помилку.

# Меню
back-button = ◀️ Назад
general-menu-button = ⏪ Головне меню

### Загальне
menu-general =
    Привіт! Я можу створювати приколи з ваших фото та відео.

    Підписуйтесь на [наш канал]({-promotion-channel}) і приєднуйтеся до [нашого чату]({-promotion-chat}).

    ❔ _Знайшли помилку або хочете запропонувати ідею? Пишіть_ [сюди]({-support-bot})_!_
menu-general-button =
    .preferences = ⚙️ Налаштування
    .title-packs = 🏷️ Набори тайтлів
    .media-packs = 🎞️ Набори медіа
    .guide = 📖 Посібник з аргументами (RU)
    .your-chats = 💬 Ваші чати
    .process-media = 🔄 Обробити медіа

### Загальне -> Налаштування
menu-preferences = Що налаштовуємо?
menu-preferences-button =
    .language = 🌐 Мова
    .privacy = 🙊 Приватність
    .commands = 📋 Команди

### Загальне -> Налаштування -> Мова
menu-language =
    Виберіть мову бота.

    ⚠️ _Переклад не поширюється на пошук та набори тайтлів!_

### Загальне -> Налаштування -> Приватність
menu-privacy =
     Налаштуйте вашу приватність.

    `Анонімність` приховує ваш нік в /orig та авторів наборів.

    `Включення в пошук` дозволяє створеним вами медіа відображатися в результатах пошуку.
menu-privacy-button =
    .anonymous = Анонімність
    .search-included = Включення в пошук

### Загальне -> Набори тайтлів / медіа
menu-pack-list =
    Тут представлені набори {pack-type}.

    ❕_Елементи з цих наборів використовуються в_ /rlobster _та_ /rdem.
menu-pack-list-button =
    .create = ❇️ Створити набір
    .public = Публічні
    .own = Тільки мої

### Загальне -> Набори тайтлів / медіа -> Деякий набір
menu-pack =
    Ви обрали {pack-privacy} набір {pack-type} `#{$id}`

    {""}*Назва*: {$name}
    {""}*Опис*: {$description}
    {""}*Автор*: [{$author}](https://t.me/{$author})

    Набір містить {$elementCount} {element-count} та використовується в {$chatCount} {used-in-chats-count}
    { $nsfw ->
        [true] **
        🔞 Містить нецензурний контент
        *[false] {""}
    }{ $default ->
        [true] **
        🍀 Даний набір є стандартним
        *[false] {""}
    }
    .not-found =
        Обраний набір не знайдено!

        ❕ _Можливо, він був видалений або у вас немає на нього прав._
menu-pack-button =
    .install = 📥 Вибрати чати для набору
    .edit = ✏️ Редагувати набір
    .browser = 🔎 Браузер елементів
    .delete = 🗑️ Видалити набір
    .export = 💾 Експортувати в .txt

### Загальне -> Набори тайтлів / медіа -> Деякий набір -> Перегляд елементів
menu-element-browser =
    Елементи набору `#{$packId}`

    Ви можете поповнити їх командою `/add {$packId} зміст`

    {$elements}

    Сторінка {$page} з {$totalPages}
    .empty =
        Набір `#{$packId}` на даний момент порожній.

        Ви можете поповнити його командою `/add {$packId} зміст`
    .element = (`{$id}`) `{$content}`

### Загальне -> Набори тайтлів / медіа -> Деякий набір -> Перегляд елементів -> Деякий елемент
menu-element =
    Налаштування елемента

    {""}*Айді*: `#{$id}`
    {""}*Тип*: { $type ->
        *[TEXT] текстовий
        [PHOTO] картинка
        [VIDEO] відео
        [STICKER] наліпка
        [ANIMATION] анімація
    }
    {""}*Автор*: [{$author}](https://t.me/{$author})

    ———
    { $type ->
        [TEXT] `{$content}`
        *[MEDIA] _<медіа-контент>_
    }
    ———

    Використовуйте `/editel {$id} новий зміст`, щоб відредагувати елемент.
    .empty = Такий елемент не знайдено!
    .unsuccess = Видалити елемент не вдалося. Можливо, він був переміщений або видалений.
    .success = Елемент був видалений!
menu-element-button =
    .delete = 🗑️ Видалити з набору

# Команди
command-aware-scale =
    .prepare = 📥 Завантажую відео
    .extracting-frames = 🎞️ Розбиваю відео на кадри
    .processing-chunk = ⌛️ Відео готове на *{$progress}%*. Залишилося: {$remaining} секунд
    .encoding-video = 🚀 Кодую відео та завантажую до Телеграм...

command-add =
    .no-id = Ви не вказали айді. Команда повинна відповідати формату `/add айді_пака зміст`
    .not-found = Вказаний пак не знайдено. Перевірте, чи маєте ви до нього доступ!
    .empty = Ви не вказали зміст!
    .incompatible-types =
        Даний набір не приймає даний тип елементів.

        Тайтл-паки можуть приймати тільки текст.
        Медіа-паки можуть приймати тільки фото, відео та гіф.
    .ok = Елемент додано до набору `#{$packId}`!
command-edit = Елемент `#{$id}` відредаговано!
command-promote =
    Тепер користувач *{$name}* редагує набір `#{$packId}`.

    {""}*Всього редакторів набору*: `{$editorCount}`.
    {""}*Серед них*: {$editors}
    .already = Даний користувач вже є редактором набору!
    .empty = Даний набір не існує або ви на нього не маєте прав (тільки автор набору може додавати редакторів).
    .user-not-found =
        Вказаний користувач відсутній в базі даних бота.

        Попросіть його використати бота, наприклад, згенерувати медіа за допомогою /вриба!
    .no-user =
        Ви не вказали користувача!

        Відповідайте на повідомлення користувача командою `/promote айді_пака`
    .no-pack =
        Ви не вказали айді набору.

        Відповідайте на повідомлення користувача командою `/promote айді_пака`.

        Айді набору можна знайти в списку наборів.
command-demote =
    Користувач {$name} знятий з посади редактора набору `#{$packId}`.

    {""}*Всього редакторів набору*: `{$editorCount}`.
    {""}*Серед них*: {$editors}
    .already = Даний користувач не є редактором набору!
    .user-not-found =
        Вказаний користувач відсутній в базі даних бота.

        Попросіть його використати бота, наприклад, згенерувати медіа за допомогою /вриба!
    .no-user =
        Ви не вказали користувача!

        Відповідайте на повідомлення користувача командою `/demote айді_пака`
    .no-pack =
        Ви не вказали айді набору.

        Відповідайте на повідомлення користувача командою `/demote айді_пака`.

        Айді набору можна знайти в списку наборів.
command-force-chat-update = ✅
    .private-chat = Ви повинні знаходитися в чаті, а не в особистій бесіді з ботом!
command-orig =
    👤 [{$author}](https://t.me/{$author})
    📆 { DATETIME($createdAt, month: "long", year: "numeric", day: "numeric") }
    👁️ {$useCount} { NUMBER($useCount) ->
        [one] раз
        [few] рази
        *[many] разів
    }
    .not-found =
        🫥 *Оригінал не знайдено!*

        _Можливі причини:_
        1) Медіа створено не в цьому боті. Порівняйте ватермарку з `@panchanporjat`.
        2) Медіа створено давно, формат вже не підтримується.
        3) Медіа перезавантажено в Телеграм. Тут навіть бот безсилий!
    .command = Використана команда `/{$command}`
    .args =
        До цього медіа застосовані аргументи:
        ```
        {$args}
        ```
    .chained =
        🎞️ _Це медіа - частина ланцюжка обробки._
        _Натисніть вперед ➡️, щоб знайти наступний оригінал (залишилось {$remainingMedia})._
    .restricted = (керує {$author})
command-random =
    .no-text = Ви не вказали текст для рандому!
    .no-media = Ви не додали медіа!
command-no-private =
    Ця команда недоступна для виконання в чатах!
    Натисніть кнопку, щоб перейти до особистих повідомлень.
    .go = Вперед!
command-no-media = 
    🥸 Ця команда працює лише з медіаданими: 
    {$types}
    
    Надішліть мені медіафайл або відповідь на повідомлення, що містить медіафайл
    .photo = `фото`
    .video = `відео`
    .animation = `гіфка`
    .photo-sticker = `фото-наліпка`
    .video-sticker = `відео-наліпка`


# Розмови
conv-create-pack =
    .step-1 =
        {""}*Крок 1/5*

        Виберіть тип набору:

        `{ media-pack }` - для фото, відео та гіфок
        `{ title-pack }` - для текстів та заголовків
    .step-2 =
        {""}*Крок 2/5*

        Виберіть назву вашому набору.
        Назву змінити не буде можливо.

         ⚠️ _Назва більше 32 символів буде обрізана!_
    .step-3 =
        {""}*Крок 3/5*

        Ваш набір буде приватним або публічним?

        Ви зможете підключати приватний набір, лише до чатів, де ви є адміністратором.

        Публічний набір можуть підключити всі користувачі.
    .step-4 =
        {""}*Крок 4/5*

        Якщо хочете, ви можете вказати опис набору.

        Щоб залишити його порожнім, натисніть на кнопку нижче.
    .step-5 =
        {""}*Крок 4/5*

        Ваш набір буде містити нецензурну лексику, образи та інший 🔞 NSFW-матеріал?

        Відповідна мітка буде відображатися на сторінці вашого набору.
    .ok = Набір відредаговано! Ви можете знайти його через головне меню - /menu.
    .cancelled = Створення набору було скасовано!
conv-create-pack-button =
    .cancel = Скасувати створення
    .remain = Залишити без змін
    .private = Приватний
    .public = Публічний
    .empty = Залишити порожнім
    .yes = {yes}
    .no = {no}
conv-delete-pack = Ви дійсно бажаєте видалити набір `{$id}`?
    .cancelled = Видалення скасовано! Ви можете повернутися в головне меню - /menu.
    .no-button-called = Ви не використали кнопки. Видалення скасовано.
    .error = Такий набір не існує. Можливо, він вже був видалений!
    .ok = Набір `{$id}` був видалений. Ви можете повернутися в головне меню - /menu.
conv-delete-pack-button =
    .yes = {yes}
    .no = {no}
conv-export-pack =
    .empty = Неможливо експортувати порожній пак!
