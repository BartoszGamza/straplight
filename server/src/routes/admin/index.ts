export default () => ({
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/search',
      handler: 'controller.search',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/settings',
      handler: 'settings.getSettings',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/settings',
      handler: 'settings.updateSettings',
      config: {
        policies: [],
      },
    },
  ],
});
