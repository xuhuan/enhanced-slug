export default [
  {
    method: 'GET',
    path: '/settings',
    handler: 'settings.getSettings',
    config: {
      policies: [],
      auth: false,
      // auth: {
      //   scope: ['plugin::enhanced-slug.settings.read'],
      // },
    },
  },
  {
    method: 'PUT',
    path: '/settings',
    handler: 'settings.setSettings',
    config: {
      policies: [],
      auth: false,
      // auth: {
      //   scope: ['plugin::enhanced-slug.settings.update'],
      // },
    },
  },
  {
    method: 'POST',
    path: '/test-translator',
    handler: 'settings.testTranslator',
    config: {
      policies: [],
      auth: false,
      // auth: {
      //   scope: ['plugin::enhanced-slug.settings.read'],
      // },
    },
  },
  {
    method: 'POST',
    path: '/generate',
    handler: 'slug.generate',
    config: {
      policies: [],
      auth: false,
      // auth: {
      //   scope: ['plugin::enhanced-slug.slug.generate'],
      // },
    },
  },
  {
    method: 'POST',
    path: '/check-slug',
    handler: 'slug.check',
    config: {
      policies: [],
      auth: false,
      // auth: {
      //   scope: ['plugin::enhanced-slug.slug.check'],
      // },
    },
  },
  {
    method: 'POST',
    path: '/reset-usage/:translator',
    handler: 'translator.resetUsage',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/usage-stats',
    handler: 'translator.getUsageStats',
    config: {
      policies: [],
      auth: false,
    },
  },
];
