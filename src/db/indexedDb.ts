// IndexedDB 工具类用于保存 study 信息
export interface StudyInfo {
  id: string;
  name: string;
  description?: string;
  flowData?: any; // 流程图数据
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    theme?: string;
    layout?: string;
    [key: string]: any;
  };
}

class IndexedDBManager {
  private dbName = 'DBLStudyDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建 studies 表
        if (!db.objectStoreNames.contains('studies')) {
          const studyStore = db.createObjectStore('studies', { keyPath: 'id' });
          studyStore.createIndex('name', 'name', { unique: false });
          studyStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建 settings 表
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveStudy(study: StudyInfo): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');

      study.updatedAt = new Date();
      const request = store.put(study);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save study'));
    });
  }

  async getStudy(id: string): Promise<StudyInfo | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studies'], 'readonly');
      const store = transaction.objectStore('studies');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get study'));
    });
  }

  async getAllStudies(): Promise<StudyInfo[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studies'], 'readonly');
      const store = transaction.objectStore('studies');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(new Error('Failed to get studies'));
    });
  }

  async deleteStudy(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete study'));
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save setting'));
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(new Error('Failed to get setting'));
    });
  }

  // 导出数据
  async exportAllData(): Promise<{studies: StudyInfo[], settings: any[]}> {
    const studies = await this.getAllStudies();
    const settingsTransaction = this.db!.transaction(['settings'], 'readonly');
    const settingsStore = settingsTransaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = settingsStore.getAll();
      request.onsuccess = () => {
        resolve({
          studies,
          settings: request.result || []
        });
      };
      request.onerror = () => reject(new Error('Failed to export data'));
    });
  }

  // 导入数据
  async importData(data: {studies: StudyInfo[], settings: any[]}): Promise<void> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction(['studies', 'settings'], 'readwrite');
    const studyStore = transaction.objectStore('studies');
    const settingsStore = transaction.objectStore('settings');

    // 导入 studies
    for (const study of data.studies) {
      studyStore.put(study);
    }

    // 导入 settings
    for (const setting of data.settings) {
      settingsStore.put(setting);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to import data'));
    });
  }
}

// 单例模式
export const dbManager = new IndexedDBManager();

// 便捷函数
export const createStudy = (name: string, description?: string): StudyInfo => ({
  id: `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  description,
  createdAt: new Date(),
  updatedAt: new Date(),
  flowData: null,
  settings: {}
});
