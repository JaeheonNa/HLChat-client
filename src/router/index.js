import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { userApi } from 'src/api/userApi'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to, from, next) => {
    const token = sessionStorage.getItem('access_token')
    const userId = sessionStorage.getItem('user_id')
    const username = sessionStorage.getItem('username')
    const guestPages = ['/hl-chat/log-in', '/hl-chat/register']
    const isGuestPage = guestPages.includes(to.path)

    // 로그인 상태에서 로그인/회원가입 페이지 접근 시
    if (isGuestPage && token && userId && username) {
      try {
        // 토큰 유효성 검증
        await userApi.verifyToken()
        // 유효하면 메인으로 리다이렉션
        next(`/hl-chat/${username}/${userId}`)
      } catch {
        // 토큰이 유효하지 않으면 세션 클리어 후 로그인 페이지로
        sessionStorage.clear()
        next()
      }
    }
    // 비로그인 상태에서 인증 필요 페이지 접근 시 로그인 페이지로 리다이렉션
    else if (!isGuestPage && !token) {
      next('/hl-chat/log-in')
    }
    else {
      next()
    }
  })

  return Router
})
