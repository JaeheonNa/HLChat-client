const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true }, // 인증 필요
    children: [
      {
        path: '/log-in',
        component: () => import('pages/LogInPage.vue'),
        meta: { requiresGuest: true }
      },
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'hl-chat/:roomId/:userId',  // ← 추가
        name: 'ChatRoom',
        component: () => import('src/components/ChatRoom.vue'),
        meta: { requiresAuth: true },
        props: true  // URL 파라미터를 props로 전달
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
