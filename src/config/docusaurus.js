// Support for CommonJS require 
const config = {
    rootDir: process.env.DOCUSAURUS_ROOT_PATH || process.cwd(),
    i18nDir: process.env.DOCUSAURUS_I18N_PATH || process.env.DOCUSAURUS_ROOT_PATH || process.cwd(),
    defaultLanguage: process.env.DOCUSAURUS_DEFAULT_LANG || 'en',
    enabledLanguages: (process.env.DOCUSAURUS_ENABLED_LANGS || 'en').split(','),
    mediaDir: process.env.DOCUSAURUS_MEDIA_DIR || 'static/img'
  };
  
  const getPaths = () => {
    const { rootDir, i18nDir, mediaDir } = config;
    return {
      docsDir: `${rootDir}/docs`,
      blogDir: `${rootDir}/blog`,
      i18nDir: `${i18nDir}/i18n`,
      mediaDir: `${rootDir}/${mediaDir}`,
    };
  };
  
  const getLanguages = () => {
    const { defaultLanguage, enabledLanguages } = config;
    return {
      defaultLanguage,
      enabledLanguages
    };
  };
  
  module.exports = {
    getPaths,
    getLanguages,
    config
  };