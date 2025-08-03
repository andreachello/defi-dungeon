import Item from "./Item";
import PersistenceService, { SavedInventoryItem } from "../services/PersistenceService";

export default class Inventory {
    private items: Item[] = [];
    private maxSlots: number = 20;
    private onItemsLoaded?: () => void;

    constructor(onItemsLoaded?: () => void) {
        this.onItemsLoaded = onItemsLoaded;
        this.loadFromStorage();
    }

    addItem(item: Item): boolean {
        // Try to stack with existing items first
        if (item.data.stackable) {
            const existingItem = this.items.find(i => i.data.id === item.data.id);
            if (existingItem && existingItem.canAddToStack(item.quantity)) {
                existingItem.quantity += item.quantity;
                this.saveToStorage();
                return true;
            }
        }

        // If can't stack or no existing item, add to new slot
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
            this.saveToStorage();
            return true;
        }

        return false; // Inventory full
    }

    removeItem(itemId: string, quantity: number = 1): boolean {
        const itemIndex = this.items.findIndex(item => item.data.id === itemId);
        if (itemIndex === -1) return false;

        const item = this.items[itemIndex];
        if (item.quantity <= quantity) {
            this.items.splice(itemIndex, 1);
        } else {
            item.quantity -= quantity;
        }
        this.saveToStorage();
        return true;
    }

    getItem(itemId: string): Item | undefined {
        return this.items.find(item => item.data.id === itemId);
    }

    getAllItems(): Item[] {
        return [...this.items];
    }

    getItemCount(itemId: string): number {
        const item = this.getItem(itemId);
        return item ? item.quantity : 0;
    }

    hasItem(itemId: string, quantity: number = 1): boolean {
        return this.getItemCount(itemId) >= quantity;
    }

    getUsedSlots(): number {
        return this.items.length;
    }

    getMaxSlots(): number {
        return this.maxSlots;
    }

    isFull(): boolean {
        return this.items.length >= this.maxSlots;
    }

    private saveToStorage(): void {
        const savedItems: SavedInventoryItem[] = this.items.map(item => ({
            id: item.data.id,
            name: item.data.name,
            type: item.data.type,
            spriteIndex: item.data.spriteIndex,
            quantity: item.quantity,
            stackable: item.data.stackable,
            description: item.data.description
        }));

        PersistenceService.saveGameData({
            inventory: savedItems,
            gold: 100, // Default gold, could be made persistent too
            lastSaved: Date.now()
        });
    }

    private loadFromStorage(): void {
        const savedData = PersistenceService.loadGameData();
        if (savedData && savedData.inventory) {
            this.items = savedData.inventory.map(savedItem => {
                // Create Item from saved data
                const itemData = {
                    id: savedItem.id,
                    name: savedItem.name,
                    type: savedItem.type as any,
                    spriteIndex: savedItem.spriteIndex,
                    stackable: savedItem.stackable,
                    description: savedItem.description
                };
                return new Item(itemData, savedItem.quantity);
            });
            console.log('Loaded inventory from storage:', this.items);

            // Notify that items were loaded
            if (this.onItemsLoaded) {
                this.onItemsLoaded();
            }
        }
    }

    // Method to clear inventory (for testing or new game)
    clear(): void {
        this.items = [];
        PersistenceService.clearGameData();
    }
} 