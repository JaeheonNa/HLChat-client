const routes = [
  {
    path: '/hl-chat',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true }, // 인증 필요
    children: [
      {
        path: '/hl-chat/log-in',
        component: () => import('pages/LogInPage.vue'),
        meta: { requiresGuest: true }
      },
      {
        path: '/hl-chat/:username/:userId',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true },
        props: true
      },
      {
        path: '/hl-chat/:username/:userId/:roomId',  // ← 추가
        name: 'ChatRoom',
        component: () => import('pages/ChatRoom.vue'),
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
