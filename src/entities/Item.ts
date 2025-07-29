export enum ItemType {
    HEALTH_POTION = "health_potion",
    MANA_POTION = "mana_potion",
    GOLD = "gold",
    KEY = "key",
    WEAPON = "weapon"
}

export interface ItemData {
    id: string;
    name: string;
    type: ItemType;
    spriteIndex: number;
    description: string;
    stackable: boolean;
    maxStack?: number;
}

export default class Item {
    public readonly data: ItemData;
    public quantity: number;

    constructor(data: ItemData, quantity: number = 1) {
        this.data = data;
        this.quantity = quantity;
    }

    static createHealthPotion(quantity: number = 1): Item {
        return new Item({
            id: "health_potion",
            name: "Health Potion",
            type: ItemType.HEALTH_POTION,
            spriteIndex: 2,
            description: "Restores health",
            stackable: true,
            maxStack: 10
        }, quantity);
    }

    static createGoldKey(amount: number = 1): Item {
        return new Item({
            id: "gold_key",
            name: "Gold Key",
            type: ItemType.GOLD,
            spriteIndex: 0,
            description: "Opens locked chests",
            stackable: true,
            maxStack: 10
        }, amount);
    }

    static createKey(): Item {
        return new Item({
            id: "key",
            name: "Key",
            type: ItemType.KEY,
            spriteIndex: 1, // Assuming this is the key sprite
            description: "Opens locked doors",
            stackable: true
        });
    }

    static createBossKey(amount: number = 1): Item {
        return new Item({
            id: "boss_key",
            name: "Boss Key",
            type: ItemType.KEY,
            spriteIndex: 10,
            description: "Opens boss doors",
            stackable: false,
            maxStack: 1
        }, amount);
    }

    canStackWith(other: Item): boolean {
        return this.data.id === other.data.id && this.data.stackable;
    }

    canAddToStack(amount: number = 1): boolean {
        if (!this.data.stackable) return false;
        return this.quantity + amount <= (this.data.maxStack || 999);
    }
} 