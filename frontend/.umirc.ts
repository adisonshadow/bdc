import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'BDC',
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3300',
      changeOrigin: true,
      // pathRewrite: { '^/api': '' },
    },
  },
  routes: [
    {
      path: '/',
      redirect: '/data-structures',
    },
    {
      path: '/data-structures',
      name: '数据结构管理',
      icon: 'BlockOutlined',
      component: './SchemaManagement/index',
    },
  ],
  npmClient: 'yarn',
}); 