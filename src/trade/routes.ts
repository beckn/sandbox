import { Router, Request, Response } from 'express';
import axios from 'axios';
import { catalogStore } from '../services/catalog-store';

const ONIX_BPP_URL = process.env.ONIX_BPP_URL || 'http://onix-bpp:8082';

export const tradeRoutes = () => {
  const router = Router();

  // POST /api/trade/publish - Store catalog and forward to ONIX
  router.post('/publish', async (req: Request, res: Response) => {
    const { context, message } = req.body;

    try {
      const catalog = message?.catalogs?.[0];
      if (!catalog) {
        return res.status(400).json({ error: 'No catalog in request' });
      }

      const catalogId = catalog['beckn:id'];
      const bppId = catalog['beckn:bppId'];

      console.log(`[API] POST /trade/publish - Catalog: ${catalogId}`);

      // Store catalog
      catalogStore.saveCatalog(catalogId, bppId, catalog);

      // Store inventory items
      const items = catalog['beckn:items'] || [];
      for (const item of items) {
        const itemId = item['beckn:id'];
        const qty = item['beckn:itemAttributes']?.availableQuantity || 0;
        catalogStore.saveInventory(itemId, catalogId, qty);
        console.log(`[API] Inventory stored: ${itemId} = ${qty} kWh`);
      }

      // Forward to ONIX-BPP
      console.log(`[API] Forwarding to ${ONIX_BPP_URL}/publish`);
      const onixRes = await axios.post(`${ONIX_BPP_URL}/publish`, req.body, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`[API] ONIX response status: ${onixRes.status}`);
      return res.status(200).json(onixRes.data);

    } catch (error: any) {
      console.error(`[API] Error:`, error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // GET /api/trade/inventory - Debug endpoint
  router.get('/inventory', (req: Request, res: Response) => {
    const inventory = catalogStore.getAllInventory();
    return res.json({ items: inventory });
  });

  return router;
};
