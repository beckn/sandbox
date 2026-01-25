import db from '../db';

export const catalogStore = {
  saveCatalog(id: string, bppId: string, data: any) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO catalogs (id, bpp_id, catalog_data, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    stmt.run(id, bppId, JSON.stringify(data));
    console.log(`[DB] Catalog saved: ${id}`);
  },

  saveInventory(itemId: string, catalogId: string, quantity: number) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO inventory (item_id, catalog_id, available_quantity, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    stmt.run(itemId, catalogId, quantity);
  },

  getInventory(itemId: string) {
    return db.prepare('SELECT * FROM inventory WHERE item_id = ?').get(itemId);
  },

  getAllInventory() {
    return db.prepare('SELECT * FROM inventory').all();
  },

  reduceInventory(itemId: string, amount: number) {
    const current = this.getInventory(itemId) as any;
    if (!current) throw new Error(`Item not found: ${itemId}`);

    const newQty = current.available_quantity - amount;
    if (newQty < 0) throw new Error(`Insufficient inventory: ${itemId}`);

    db.prepare(`
      UPDATE inventory SET available_quantity = ?, updated_at = datetime('now')
      WHERE item_id = ?
    `).run(newQty, itemId);

    return newQty;
  }
};
