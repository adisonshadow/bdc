import { defineConfig } from '@umijs/max';
import { ProLayoutProps } from '@ant-design/pro-components';

const Settings: ProLayoutProps = {
  title: 'BDC3',
  // colorPrimary: '#6604e7',
  logo: '/logo.svg',
  layout: 'top',
  fixedHeader: true,
};

export default defineConfig({
  outputPath: 'dist',
  hash: true,
  antd: {
    dark: true,
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    locale: false,
    ...Settings,
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
      path: '/sso-success',
      name: 'SSO 成功',
      component: './SSOSuccess',
      hideInMenu: true,
      layout: false,
    },
    {
      path: '/data-structures',
      name: '数据结构管理',
      icon: 'BlockOutlined',
      component: './SchemaManagement',
    },
    {
      path: '/database-management',
      name: '数据库管理',
      icon: 'DatabaseOutlined',
      component: './DatabaseManagement',
    },
    {
      path: '/schema-graph',
      name: '数据表图谱',
      component: './SchemaGraph',
      hideInMenu: true,
    },
  ],
  npmClient: 'yarn',
});
