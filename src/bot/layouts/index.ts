import { elementMenu } from './element'
import { elementBrowserMenu } from './element-browser'
import { generalMenu } from './general'
import { installChatsMenu } from './install-chat-list'
import { packMenu } from './pack'
import { packListMenu } from './pack-list'
import { preferencesMenu } from './preferences'
import { languageMenu } from './preferences-language'
import { privacyMenu } from './preferences-privacy'

// Build the menu tree once at module load. Registration establishes each submenu's
// parent (used by `.back()`); only the root `generalMenu` is installed on the bot.
elementBrowserMenu.register(elementMenu)
packMenu.register(installChatsMenu)
packMenu.register(elementBrowserMenu)
packListMenu.register(packMenu)
preferencesMenu.register(languageMenu)
preferencesMenu.register(privacyMenu)
generalMenu.register(packListMenu)
generalMenu.register(preferencesMenu)

export { generalMenu }
