/**
 * 路由配置
 * 
 * 注意：当前应用使用状态管理而非路由导航
 * 如需启用路由，请安装 react-router-dom 并取消注释以下代码
 */
import { lazy,createElement } from 'react';



const Home = lazy(() => import('@/pages/Home'));
const Tokens = lazy(() => import('@/pages/tokens/Tokens'));
const TokenDetail = lazy(() => import('@/pages/tokens/[tokens_id]/TokenDetailPage'));
const Trading = lazy(() => import('@/pages/TradingPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const PublicSale = lazy(() => import('@/pages/PublicSale'));
const TokensSeting = lazy(() => import('@/pages/TokensSeting'));

export default (i18n: any) => [
  // {
  //   path: '/',
  //   element: createElement(Navigate, { to: '/test', replace: true }),
  //   title: 'Redirect'
  // },
  {
    path: '/',
    element: createElement(Home),
    title:i18n.t('header.menu.home')
  },
  {
    path: '/tokens',
    element: createElement(Tokens),
    title:i18n.t('header.menu.tokens')
  },
  {
    path: '/tokens/:tokens_id',
    element: createElement(TokenDetail),
    title:i18n.t('header.menu.tokens.tokenDetail')
  },
  {
    path: '/trade',
    element: createElement(Trading),
    title:i18n.t('header.menu.trade')
  },
  {
    path: '/profile',
    element: createElement(Profile),
    title:i18n.t('header.menu.myaccount')
  },
  {
    path: '/publicSale',
    element: createElement(PublicSale),
    title:i18n.t('header.menu.publicSale')
  },
  {
    path: '/TokensSeting',
    element: createElement(TokensSeting),
    title:i18n.t('appUx.configTitle')
  },
];

// export default routes;