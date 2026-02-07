# Straplight

Spotlight-like search overlay for the Strapi admin panel. Press **Cmd+K** (or **Ctrl+K**) to instantly search across all your content types.

## Features

- **Cmd+K search overlay** — opens a search dialog from anywhere in the admin panel
- **Full-text search** — searches across all string fields (title, name, text, email, richtext, etc.) in your `api::` content types
- **Keyboard navigation** — use arrow keys to navigate results, Enter to open, Escape to close
- **Debounced search** with stale-response protection — fast and flicker-free
- **Dark and light theme** support — follows your Strapi admin theme
- **Zero configuration** — works out of the box with all your content types

## Installation

```bash
npm install straplight
# or
yarn add straplight
```

Add the plugin to your Strapi configuration:

```ts
// config/plugins.ts
export default () => ({
  straplight: {
    enabled: true,
  },
});
```

Rebuild your admin panel:

```bash
yarn build
yarn develop
```

## Usage

1. Press **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) from anywhere in the admin panel
2. Start typing to search across all your content types
3. Use **Arrow Up/Down** to navigate results
4. Press **Enter** to open the selected entry in the Content Manager
5. Press **Escape** to close the overlay

## Compatibility

- Strapi v5 (5.x)

## License

[MIT](LICENSE)
