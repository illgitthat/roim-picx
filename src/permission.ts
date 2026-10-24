import router from "./plugins/router"
import storage from "./utils/storage";

router.beforeEach((to) => {
    const token = storage.local.get('auth-token')
    if (to.path != '/auth' && !token) {
        return '/auth'
    }
})
