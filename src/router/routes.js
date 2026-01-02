const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'hl-chat/:roomId/:userId',  // ← 추가
        name: 'ChatRoom',
        component: () => import('src/components/ChatRoom.vue'),
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
