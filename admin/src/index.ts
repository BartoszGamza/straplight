import { PLUGIN_ID } from './pluginId';
import { NavigateCapture } from './components/StraplightPortal';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: any) {
    // Inject NavigateCapture into content-manager to grab SPA navigate
    const contentManager = app.getPlugin('content-manager');
    contentManager.injectComponent('listView', 'actions', {
      name: 'straplight-nav-capture',
      Component: NavigateCapture,
    });

    // Mount the persistent overlay on document.body
    import('react-dom/client').then(({ createRoot }) => {
      import('./components/StraplightOverlay').then(({ StraplightOverlay }) => {
        import('react/jsx-runtime').then(({ jsx }) => {
          const el = document.createElement('div');
          el.id = 'straplight-portal';
          document.body.appendChild(el);
          const root = createRoot(el);
          root.render(jsx(StraplightOverlay, {}));
        });
      });
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
