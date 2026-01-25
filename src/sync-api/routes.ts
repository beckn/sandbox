import { Router } from 'express';
import { syncSelect, syncInit, syncConfirm, syncStatus, syncHealth } from './controller';

export const syncApiRoutes = () => {
  const router = Router();

  router.post('/select', syncSelect);
  router.post('/init', syncInit);
  router.post('/confirm', syncConfirm);
  router.post('/status', syncStatus);
  router.get('/sync/health', syncHealth);

  return router;
};
