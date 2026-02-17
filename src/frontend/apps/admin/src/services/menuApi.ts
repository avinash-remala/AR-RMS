export type MealType = "VEG" | "NON_VEG" | "SPECIAL";

export type MenuItem = {
    id: string;
    name: string;
    mealType: MealType;
    price: number;
    active: boolean;
    createdAt: string;
};

let DB: MenuItem[] = [
    {
        id: "m_1001",
        name: "Veg Lunch Box",
        mealType: "VEG",
        price: 12.99,
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "m_1002",
        name: "Non-Veg Lunch Box",
        mealType: "NON_VEG",
        price: 14.99,
        active: true,
        createdAt: new Date().toISOString()
    }
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listMenuItems(): Promise<MenuItem[]> {
    await sleep(150);
    return [...DB].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createMenuItem(input: Omit<MenuItem, "id" | "createdAt">): Promise<MenuItem> {
    await sleep(150);
    const item: MenuItem = {
        ...input,
        id: `m_${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
    };
    DB = [item, ...DB];
    return item;
}

export async function updateMenuItem(id: string, patch: Partial<Omit<MenuItem, "id" | "createdAt">>): Promise<MenuItem> {
    await sleep(150);
    const idx = DB.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error("Menu item not found");
    DB[idx] = { ...DB[idx], ...patch };
    return DB[idx];
}

export async function deleteMenuItem(id: string): Promise<void> {
    await sleep(150);
    DB = DB.filter((x) => x.id !== id);
}
