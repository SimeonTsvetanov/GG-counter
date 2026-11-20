# Settings and limits

This page lists the buttons in GG Counter's header, every entry of the menu and every option in **Settings**, plus the limits on players, names and scores. To open the menu, select the button with three lines at the right end of the header. To open **Settings**, go to **Menu** > **Settings**.

## Header buttons

The header has icon buttons, in the following order. Each has a name that screen readers read out.

| Button | What it does |
|---|---|
| **Open leaderboard** (trophy) | Opens the **Leaderboard** window with **Share**, **Reset scores** and **OK**. |
| **Add player** (plus) | Scrolls to the **Add Player** card and puts the cursor in the name field. |
| **Share session** (share icon) | Shares the leaderboard as text. Does nothing while the game has no players. |
| **Clear session** (circular arrows) | Asks what to clear: **Players and scores** (selected) or **Scores only**. |
| **Toggle theme** (sun or moon) | Opens a menu with **Light**, **Dark** and **System**. Shown only when the window is wider than 600 pixels. |
| **Open menu** (three lines) | Opens the menu. |

## Settings

The following options appear in **Settings**, in the order of the window.

| Option | What it does | Values | Default |
|---|---|---|---|
| **Theme** | Sets the colours of GG Counter. On a phone, this is the only place for it. | **System**, **Light**, **Dark** | **System** (follows your device) |
| **Language** | Sets the language of the app, the **Help** texts and the shared leaderboard text. The change applies at once and is remembered on this device. | English, Български | English |
| **Export my data** | Saves a file with the game, the theme and the language. | `gg-counter-data-YYYY-MM-DD.json` | — |
| **Import data** | Replaces the saved game, theme and language with the content of an export file, after you confirm. Files from other apps are refused. | An export file of up to about 1 MB | — |
| **Clear my data** | Deletes everything GG Counter saved on this device, after you confirm. Other apps aren't affected. | — | — |

The policy pages (**Terms**, **Privacy**, **AI notice**, **Legal notice**, **Contact**) are in English in every language.

## Menu

The menu has four groups. The following table lists the entries in the order of the menu.

| Group | Entry | What it does |
|---|---|---|
| Use | **Help** | Opens the help: what GG Counter does, quick start, features, installing, privacy, limits and the FAQ. Works offline. |
| Use | **Settings** | Opens [Settings](#settings). |
| Use | **What's new** | Lists the changes of recent versions. It opens once by itself after an update. |
| App | **Share app** | Shares the address of GG Counter with the share sheet, or copies it where there is none. |
| App | **Install app** | Installs GG Counter, or opens the install steps in **Help**. Reads **Installed ✓** when installed. |
| App | **Report a problem** | Opens a form to send a message about a problem. See [Report a problem](#report-a-problem). |
| About | **About** | Shows the version, the author, the open-source projects GG Counter includes and their full licence texts. |
| About | **Terms**, **Privacy**, **AI notice**, **Legal notice**, **Contact** | Open the policy and support pages inside the app. The same pages are in the footer. |
| Support | **Support me ☕** | Opens the author's Buy Me a Coffee page. |
| Support | **Source code on GitHub** | Opens the repository. |

### Report a problem

The **Report a problem** form has a **What happened** field of up to 4,000 characters and the checkbox **Add technical details (app version, browser, screen size)**, which is on by default. The details contain the app version, the browser, the screen size, whether GG Counter is installed, the browser language and the time. They never contain players or scores. GG Counter sends nothing by itself. You choose how to send the report:

| Button | What happens |
|---|---|
| **Open a GitHub issue** | Opens GitHub with the text filled in. The issue is public and needs a free GitHub account. |
| **Send by email** | Opens your email app with the text filled in. No account is needed. |

## Limits

The following limits apply when you enter something.

| Limit | Value |
|---|---|
| Players in one game | 50 |
| Characters in a name | 40. Spaces at the start and end don't count, and a simple emoji counts as one character. |
| Score | -999,999 to 999,999 |
| Score changes kept per player | 50. Older changes are added to **Earlier points**. |
| Import file | About 1 MB |

Other rules:

- A blank name adds nobody, and `0` or an empty field in **Adjust score** changes nothing. GG Counter shows no message for these.
- Two players can have the same name.
- The leaderboard ranks players by score, highest first. Players with the same score share a place and stay in the order you added them.
- The player cards never move: they stay in the order you added the players. Medals show places 1 to 3.
- Taps on **+** or **−** for the same player within 3 seconds count as one change in the list of changes.
- From 5 players on, the player cards are compact.
- A game saved with larger values before these limits existed loads unchanged.

## URL parameter

| Parameter | What it does | Values |
|---|---|---|
| `lang` | Shows GG Counter in that language for the current visit only. It isn't saved. | `en`, `bg` |

For example, `https://simeontsvetanov.github.io/GG-counter/?lang=bg` opens GG Counter in Bulgarian.

## Related

- [Manage players](../how-to/manage-players.md)
- [Manage your data](../how-to/manage-your-data.md)
- [GG Counter user documentation](../index.md)
