import { getDB } from '../db';

export const catalogStore = {
  async saveCatalog(catalog: any) {
    const db = getDB();
    const catalogId = catalog['beckn:id'];

    await db.collection('catalogs').updateOne(
      { 'beckn:id': catalogId },
      { $set: { ...catalog, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`[DB] Catalog saved: ${catalogId}`);
    return catalogId;
  },

  async saveItem(catalogId: string, item: any) {
    const db = getDB();
    const itemId = item['beckn:id'];

    await db.collection('items').updateOne(
      { 'beckn:id': itemId },
      { $set: { ...item, catalogId, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`[DB] Item saved: ${itemId}`);
  },

  async saveOffer(catalogId: string, offer: any) {
    const db = getDB();
    const offerId = offer['beckn:id'];

    await db.collection('offers').updateOne(
      { 'beckn:id': offerId },
      { $set: { ...offer, catalogId, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log(`[DB] Offer saved: ${offerId}`);
  },

  async getAllItems() {
    return getDB().collection('items').find({}).toArray();
  },

  async getAllOffers() {
    return getDB().collection('offers').find({}).toArray();
  },

  async getInventory() {
    return getDB().collection('items').find({}, {
      projection: {
        'beckn:id': 1,
        'beckn:itemAttributes.availableQuantity': 1,
        catalogId: 1
      }
    }).toArray();
  },

  async reduceInventory(itemId: string, amount: number) {
    const db = getDB();
    const result = await db.collection('items').findOneAndUpdate(
      { 'beckn:id': itemId, 'beckn:itemAttributes.availableQuantity': { $gte: amount } },
      { $inc: { 'beckn:itemAttributes.availableQuantity': -amount } },
      { returnDocument: 'after' }
    );

    if (!result) throw new Error(`Insufficient inventory: ${itemId}`);
    return result['beckn:itemAttributes'].availableQuantity;
  }
};
