/* IndexedDB stores each snapshot independently from the working draft. */
'use strict';
window.GoalStorage = (() => {
  let database;
  function open() {
    if (!database) database = new Promise((resolve, reject) => {
      const request = indexedDB.open('toolbox-goal-grid', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
      request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
      request.onerror = () => { database = undefined; reject(request.error); };
      request.onblocked = () => { database = undefined; reject(new Error('Database occupato.')); };
    });
    return database;
  }
  async function run(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshots', mode);
      const request = action(transaction.objectStore('snapshots'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('Salvataggio non disponibile.'));
    });
  }
  return {
    list: () => run('readonly', store => store.getAll()),
    add: state => run('readwrite', store => store.add({ createdAt: Date.now(), state: GoalCore.copyState(state) })),
    remove: id => run('readwrite', store => store.delete(id))
  };
})();
