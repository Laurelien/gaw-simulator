import { createApp } from 'vue';
import { pinia } from './state/pinia';
import router from './router';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
