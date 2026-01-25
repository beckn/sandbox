import { Router, Request, Response } from 'express';
import axios from 'axios';
import { catalogStore } from '../services/catalog-store';

const ONIX_BPP_URL = process.env.ONIX_BPP_URL || 'http://onix-bpp:8082';

export const tradeRoutes = () => {
  const router = Router();

  // POST /api/publish - Store catalog and forward to ONIX
  router.post('/publish', async (req: Request, res: Response) => {
    try {
      const catalog = req.body.message?.catalogs?.[0];
      if (!catalog) {
        return res.status(400).json({ error: 'No catalog in request' });
      }

      console.log(`[API] POST /publish - Catalog: ${catalog['beckn:id']}`);

      // Store in MongoDB
      const catalogId = await catalogStore.saveCatalog(catalog);

      for (const item of catalog['beckn:items'] || []) {
        await catalogStore.saveItem(catalogId, item);
      }

      for (const offer of catalog['beckn:offers'] || []) {
        await catalogStore.saveOffer(catalogId, offer);
      }

      // Forward to ONIX BPP
      const forwardUrl = `${ONIX_BPP_URL}/bpp/caller/publish`;
      console.log(`[API] Forwarding to ${forwardUrl}`);

      const onixRes = await axios.post(forwardUrl, req.body, {
        headers: { 'Content-Type': 'application/json' }
      });

      return res.status(200).json(onixRes.data);
    } catch (error: any) {
      console.error(`[API] Error:`, error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // GET /api/inventory
  router.get('/inventory', async (req: Request, res: Response) => {
    const items = await catalogStore.getInventory();
    res.json({ items });
  });

  // GET /api/items
  router.get('/items', async (req: Request, res: Response) => {
    const items = await catalogStore.getAllItems();
    res.json({ items });
  });

  // GET /api/offers
  router.get('/offers', async (req: Request, res: Response) => {
    const offers = await catalogStore.getAllOffers();
    res.json({ offers });
  });

  return router;
};
