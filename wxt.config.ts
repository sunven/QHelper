import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: 'QHelper前端助手',
    description: 'json解析',
    version: '1.2',
    permissions: ['cookies', 'tabs'],
    host_permissions: ['<all_urls>'],
    icons: {
      16: '/icons/q-16.png',
      48: '/icons/q-48.png',
      128: '/icons/q-128.png',
    },
    action: {
      default_popup: 'popup',
    },
  },

});
