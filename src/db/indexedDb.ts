// localStorage 工具类用于保存 study 信息
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

class LocalStorageManager {
  private studiesKey = 'dbl_studies';
  private settingsKey = 'dbl_settings';

  // 序列化日期对象
  private serializeStudy(study: StudyInfo): any {
    return {
      ...study,
      createdAt: study.createdAt.toISOString(),
      updatedAt: study.updatedAt.toISOString()
    };
  }

  // 反序列化日期对象
  private deserializeStudy(data: any): StudyInfo {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  async initDB(): Promise<void> {
    // localStorage 不需要初始化
    return Promise.resolve();
  }

  async saveStudy(study: StudyInfo): Promise<void> {
    const studies = await this.getAllStudies();
    const existingIndex = studies.findIndex(s => s.id === study.id);

    study.updatedAt = new Date();

    if (existingIndex >= 0) {
      studies[existingIndex] = study;
    } else {
      studies.push(study);
    }

    const serializedStudies = studies.map(s => this.serializeStudy(s));
    localStorage.setItem(this.studiesKey, JSON.stringify(serializedStudies));
  }

  async getStudy(id: string): Promise<StudyInfo | null> {
    const studies = await this.getAllStudies();
    return studies.find(s => s.id === id) || null;
  }

  async getAllStudies(): Promise<StudyInfo[]> {
    const data = localStorage.getItem(this.studiesKey);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => this.deserializeStudy(item));
    } catch (error) {
      console.error('Failed to parse studies from localStorage:', error);
      return [];
    }
  }

  async deleteStudy(id: string): Promise<void> {
    const studies = await this.getAllStudies();
    const filteredStudies = studies.filter(s => s.id !== id);
    const serializedStudies = filteredStudies.map(s => this.serializeStudy(s));
    localStorage.setItem(this.studiesKey, JSON.stringify(serializedStudies));
  }

  async saveSetting(key: string, value: any): Promise<void> {
    const settings = await this.getAllSettings();
    settings[key] = value;
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
  }

  async getSetting(key: string): Promise<any> {
    const settings = await this.getAllSettings();
    return settings[key] || null;
  }

  private async getAllSettings(): Promise<Record<string, any>> {
    const data = localStorage.getItem(this.settingsKey);
    if (!data) return {};

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse settings from localStorage:', error);
      return {};
    }
  }

  // 导出所有数据为 JSON
  async exportAllData(): Promise<{studies: StudyInfo[], settings: Record<string, any>}> {
    const studies = await this.getAllStudies();
    const settings = await this.getAllSettings();

    return {
      studies,
      settings
    };
  }

  // 从 JSON 导入数据
  async importAllData(data: {studies: StudyInfo[], settings: Record<string, any>}): Promise<void> {
    // 导入研究数据
    if (data.studies && Array.isArray(data.studies)) {
      const serializedStudies = data.studies.map(study => this.serializeStudy({
        ...study,
        createdAt: new Date(study.createdAt),
        updatedAt: new Date(study.updatedAt)
      }));
      localStorage.setItem(this.studiesKey, JSON.stringify(serializedStudies));
    }

    // 导入设置数据
    if (data.settings && typeof data.settings === 'object') {
      localStorage.setItem(this.settingsKey, JSON.stringify(data.settings));
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.studiesKey);
    localStorage.removeItem(this.settingsKey);
  }
}

// 导出单例实例
export const dbManager = new LocalStorageManager();

// 创建新研究的工厂函数
export function createStudy(name: string, description?: string): StudyInfo {
  return {
    id: generateId(),
    name,
    description,
    flowData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {}
  };
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
