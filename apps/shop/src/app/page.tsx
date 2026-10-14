import { db } from "@set25/database";
export const instant = false;

export default async function Home() {
    const products = await db.product.findMany({
        include: {
            variants: true,
        },
    });

    return (
        <main className="p-10">
            <h1 className="text-4xl font-bold">SET25 SHOP</h1>

            <pre className="mt-8">{JSON.stringify(products, null, 2)}</pre>
        </main>
    );
}
