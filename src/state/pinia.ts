import { createPinia } from 'pinia';

// Instance Pinia partagée : utilisée par `main.ts` (installation) et par les gardes
// du routeur (accès aux stores hors composants).
export const pinia = createPinia();
