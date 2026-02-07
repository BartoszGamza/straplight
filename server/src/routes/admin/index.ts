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
  ],
});
