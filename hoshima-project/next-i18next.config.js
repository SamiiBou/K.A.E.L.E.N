module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'id', 'th'],
    localeDetection: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}; 