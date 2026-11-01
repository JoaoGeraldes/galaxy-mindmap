# Galaxy Mind Map

Mind maps saved as JSON files. The desktop app (Electron) saves them in a
folder you choose; the web version keeps them in the browser, and import and
export move them to and from disk.

```sh
npm install
npm run dev       # desktop app, with live reload
npm run dev:web   # web version, with live reload
npm start         # build and run the desktop app
npm run package   # make an installer for this computer (see below)
npm run build     # build the web version into dist/
npm run check     # types, formatting and tests
npm run site      # preview the website in site/
npm run mcp:build # build the server for AI assistants (see below)
```

## Desktop app

`npm run package` builds the app and turns it into an installer for the
computer you run it on, using [electron-builder](https://www.electron.build),
fetched on first use. Settings live in `electron-builder.yml`.

1. Install [Node.js](https://nodejs.org) 22 or newer, then run `npm install`.
2. Run `npm run package`. The first run downloads electron-builder and the
   Electron binaries, so it takes a few minutes.
3. Find the result in `release/`:

   | Run it on | You get                               |
   | --------- | ------------------------------------- |
   | Windows   | `Galaxy Mind Map Setup <version>.exe` |
   | macOS     | `Galaxy Mind Map-<version>.dmg`       |
   | Linux     | `Galaxy Mind Map-<version>.AppImage`  |

   `release/` also holds an unpacked copy (such as `win-unpacked/`), handy
   for a quick try without installing.

Each system has to build its own installer: make the Windows one on Windows,
the macOS one on a Mac. To pick a format explicitly, pass it after `--`, for
example `npm run package -- --linux deb`.

**Version:** the installer's version comes from `version` in
`package.json`. Raise it before each release.

**Signing:** these installers aren't signed, so systems are wary of them the
first time. Windows shows "Windows protected your PC": choose **More info →
Run anyway**. macOS says the app can't be checked: right-click it, choose
**Open**, then **Open** again. Signing needs a certificate (an Apple
Developer account for macOS); see
[electron-builder's guide](https://www.electron.build/code-signing).

**Icon:** taken from `electron/icon.png`, which electron-builder converts to
each system's format.

## AI assistants (MCP)

AI apps that support the Model Context Protocol, such as Claude Desktop,
Claude Code or Cursor, can create mind maps for you: ask for "a mind map of
my trip plans" and a new map file appears.

1. Run `npm run mcp:build`. This makes `build/mcp/server.js`.
2. Add the server to your AI app's MCP settings, using the full path to
   your copy of this project. For Claude Desktop, that's
   **Settings → Developer → Edit Config**:

   ```json
   {
     "mcpServers": {
       "galaxy-mind-map": {
         "command": "node",
         "args": ["C:/path/to/galaxy-mindmap/build/mcp/server.js"]
       }
     }
   }
   ```

3. Restart the AI app. It now has a `create_mind_map` tool.

**Where maps are saved**, in order:

1. The folder after `--folder` in `args`, if you add one, for example
   `["…/server.js", "--folder", "D:/Maps"]`.
2. The folder the desktop app last had open. It notices the new map and
   shows it straight away.
3. Your Downloads folder. In the web version, add it with **Import**.

The server only ever creates new `.json` files; it never changes or
overwrites existing ones. Rebuild it with `npm run mcp:build` after
pulling changes.

## Changing the logo

The favicon and in-app logo use `src/assets/logo.svg` directly. The desktop
window and installer icon can't be an SVG, so after changing the logo,
re-export it as a 512×512 PNG:

```sh
npx sharp-cli -i src/assets/logo.svg -o electron/icon.png resize 512 512
```

## Website

`site/` is a static page published to
https://joaogeraldes.github.io/galaxy-mindmap/ on every push to `main`, together
with the web version of the app at `/app`. Once, in the repository's
**Settings → Pages**, set **Source** to **GitHub Actions**.
