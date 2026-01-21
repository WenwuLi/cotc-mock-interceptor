import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '../style.css'

try {
  const app = createApp(App)
  const appElement = document.getElementById('app')
  if (!appElement) {
    throw new Error('找不到 #app 元素')
  }

  app.use(Antd)
  app.mount('#app')
} catch (error) {
  console.error('初始化失败:', error)
}


