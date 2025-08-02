import Item from "./Item";

export default class Inventory {
    private items: Item[] = [];
    private maxSlots: number = 20;

    addItem(item: Item): boolean {
        // Try to stack with existing items first
        if (item.data.stackable) {
            const existingItem = this.items.find(i => i.data.id === item.data.id);
            if (existingItem && existingItem.canAddToStack(item.quantity)) {
                existingItem.quantity += item.quantity;
                return true;
            }
        }

        // If can't stack or no existing item, add to new slot
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
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
} 