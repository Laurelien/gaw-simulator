import { createRouter, createWebHistory } from 'vue-router';
import { pinia } from '../state/pinia';
import { useBattleStore } from '../state/battle';
import SetupView from '../views/SetupView.vue';
import ResultView from '../views/ResultView.vue';
import ReportView from '../views/ReportView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/setup' },
    { path: '/setup', name: 'setup', component: SetupView },
    { path: '/result', name: 'result', component: ResultView },
    { path: '/report', name: 'report', component: ReportView },
    { path: '/:pathMatch(.*)*', redirect: '/setup' },
  ],
});

// Garde : `/result` et `/report` exigent un résultat (sinon → `/setup`).
// L'état est rechargé depuis sessionStorage à l'instanciation du store (AVANT cette garde).
// Exception : `/result` reste accessible pendant `loading` pour afficher la progression.
router.beforeEach((to) => {
  if (to.name !== 'result' && to.name !== 'report') return;

  const battle = useBattleStore(pinia);
  if (to.name === 'result' && battle.status === 'loading') return;
  if (battle.result == null) {
    return { name: 'setup' };
  }
});

export default router;
