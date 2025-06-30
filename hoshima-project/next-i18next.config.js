module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'id', 'th', 'fr'],
    localeDetection: false,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}; 