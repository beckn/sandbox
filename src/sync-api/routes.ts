import { Router } from 'express';
import { syncSelect, syncInit, syncConfirm, syncStatus, syncHealth, validateSelect } from './controller';

export const syncApiRoutes = () => {
  const router = Router();

  router.post('/select', validateSelect, syncSelect);
  router.post('/init', syncInit);
  router.post('/confirm', syncConfirm);
  router.post('/status', syncStatus);
  router.get('/sync/health', syncHealth);

  return router;
};
