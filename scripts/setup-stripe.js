
const Stripe = require('stripe');
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
    console.error('Please provide STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = new Stripe(secretKey);

async function main() {
    try {
        console.log('Checking Stripe products...');
        const products = await stripe.products.list({ limit: 10, active: true });

        let proProduct = products.data.find(p => p.name === 'BatePapo Pro');

        if (proProduct) {
            console.log('Found existing product:', proProduct.id);
        } else {
            console.log('Creating product BatePapo Pro...');
            proProduct = await stripe.products.create({
                name: 'BatePapo Pro',
                description: 'Plano completo com todos os recursos',
            });
            console.log('Created product:', proProduct.id);
        }

        // Check for price
        const prices = await stripe.prices.list({
            product: proProduct.id,
            active: true,
            limit: 10
        });

        let proPrice = prices.data.find(p => p.unit_amount === 14990 && p.currency === 'brl' && p.recurring?.interval === 'month');

        if (proPrice) {
            console.log('Found matching price:', proPrice.id);
        } else {
            console.log('Creating price 149.90 BRL...');
            proPrice = await stripe.prices.create({
                product: proProduct.id,
                unit_amount: 14990,
                currency: 'brl',
                recurring: { interval: 'month' },
            });
            console.log('Created price:', proPrice.id);
        }

        console.log('\n--- CONFIGURATION ---');
        console.log(`PRODUCT_ID: ${proProduct.id}`);
        console.log(`PRICE_ID: ${proPrice.id}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
