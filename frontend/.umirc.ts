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
      path: '/sso-callback',
      name: 'SSO 回调',
      component: './SSOCallback',
      hideInMenu: true,
      layout: false,
    },
    {
      path: '/sso-test',
      name: 'SSO 测试',
      component: './SSOCallback/test',
      hideInMenu: true,
      layout: false,
    },
    {
      path: '/data-structures',
      name: '数据结构管理',
      icon: 'BlockOutlined',
      component: './SchemaManagement',
    },
    // {
    //   path: '/schema-graph',
    //   name: '数据表图谱',
    //   component: './SchemaGraph',
    //   hideInMenu: true,
    // },
  //  {
  //     path: '/schema-graph-g6',
  //     name: '数据表图谱',
  //     component: './SchemaGraphNew2',
  //     hideInMenu: true,
  //   },
    {
      path: '/schema-graph',
      name: '数据表图谱',
      component: './SchemaGraph',
      hideInMenu: true,
    },
  ],
  npmClient: 'yarn',
}); 