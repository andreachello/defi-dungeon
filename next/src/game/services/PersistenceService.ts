export interface SavedInventoryItem {
    id: string;
    name: string;
    type: string;
    spriteIndex: number;
    quantity: number;
    stackable: boolean;
    description: string;
}

export interface SavedGameData {
    inventory: SavedInventoryItem[];
    gold: number;
    lastSaved: number;
}

export default class PersistenceService {
    private static readonly STORAGE_KEY = 'defi_dungeon_save';

    static saveGameData(data: SavedGameData): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log('Game data saved:', data);
        } catch (error) {
            console.error('Failed to save game data:', error);
        }
    }

    static loadGameData(): SavedGameData | null {
        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData) as SavedGameData;
                console.log('Game data loaded:', data);
                return data;
            }
        } catch (error) {
            console.error('Failed to load game data:', error);
        }
        return null;
    }

    static clearGameData(): void {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('Game data cleared');
        } catch (error) {
            console.error('Failed to clear game data:', error);
        }
    }

    static hasSavedData(): boolean {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
} 