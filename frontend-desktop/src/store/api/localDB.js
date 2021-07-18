import { openDB } from 'idb';
const DB_NAME = 'TIMETABLE_BITS_PILANI';
const DB_VERSION = 1;
const DB_STORES = ['USER_COURSES'];
// let DB;

export default {
	async getDB() {
		return openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				DB_STORES.forEach((store) => {
					if (!db.objectStoreNames.contains(store)) {
						db.createObjectStore(store, {
							keyPath: 'id',
							autoIncrement: true,
						});
					}
				});
			},
		});
	},
	async writeData(storeName, data) {
		const db = await this.getDB();
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		store.put(data);
		return tx.done;
	},
	async readData(storeName) {
		const db = await this.getDB();
		const store = db.transaction(storeName, 'readonly').objectStore(storeName);
		return store.getAll();
	},
};
