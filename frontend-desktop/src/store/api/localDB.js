import { openDB } from 'idb';
const DB_VERSION = 5;
const DB_NAME = 'TIMETABLE_BITS_PILANI_VERSION_' + DB_VERSION;
const DB_STORES = ['USER_COURSES', 'SCHEDULED_COURSES'];

export default {
	async getDB() {
		return openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				DB_STORES.forEach((store) => {
					if (!db.objectStoreNames.contains(store)) {
						db.createObjectStore(store, {
							keyPath: 'courseCode',
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

	async writeBulkData(storeName, dataArray) {
		const db = await this.getDB();
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		let promises = [];
		dataArray.forEach((data) => promises.push(store.put(data)));
		promises.push(tx.done);
		return await Promise.all(promises);
	},

	async readData(storeName) {
		const db = await this.getDB();
		const store = db.transaction(storeName, 'readonly').objectStore(storeName);
		return store.getAll();
	},

	async removeItemFromStore(storeName, key) {
		const db = await this.getDB();
		const tx = db.transaction(storeName, 'readwrite');
		const store = tx.objectStore(storeName);
		store.delete(key);
		return tx.done;
	},

	async deleteOldDbs() {
		const dbs = await window.indexedDB.databases();
		dbs.forEach((db) => {
			if (db.name !== DB_NAME) {
				window.indexedDB.deleteDatabase(db.name);
			}
		});
	},
};
