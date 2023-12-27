# toMatchPdfSnapshot

Library for testing visual regression of PDFs in Playwright. The library utilizes pdf.js to convert PDF files to PNG format.

## Installation

Install the package with:

```sh
npm install to-match-pdf-snapshot
# or
yarn add to-match-pdf-snapshot
```

### Usage in Playwright

Add the following line to your `playwright.config.ts`

```ts
import 'to-match-pdf-snapshot/playwright'
```

For typescript users, add `node_modules/to-match-pdf-snapshot/dist/playwright` to your `tsconfig.json` types.


### Thanks
This library draws inspiration from [moshensky/pdf-visual-diff](https://github.com/moshensky/pdf-visual-diff). The key distinction lies in its exclusivity to Playwright, making the setup more straightforward compared to the mentioned library.
