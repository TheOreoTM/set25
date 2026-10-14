import { db } from "@set25/database";
export const instant = false;

export default async function Home() {
    const products = await db.product.findMany();

    return (
        <main className="p-10">
            <h1>SET25 HQ</h1>

            <pre>{JSON.stringify(products, null, 2)}</pre>
        </main>
    );
}
