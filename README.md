# Galaxy Mind Map

Mind maps saved as JSON files. The desktop app (Electron) saves them in a
folder you choose; the web version keeps them in the browser, and import and
export move them to and from disk.

```sh
npm install
npm run dev       # desktop app, with live reload
npm run dev:web   # web version, with live reload
npm start         # build and run the desktop app
npm run build     # build the web version into dist/
npm run check     # types, formatting and tests
```

## Changing the logo

The favicon and in-app logo use `src/assets/logo.svg` directly. The desktop
window icon can't be an SVG, so after changing the logo, re-export it as a
512×512 PNG:

```sh
npx sharp-cli -i src/assets/logo.svg -o electron/icon.png resize 512 512
```
