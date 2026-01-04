import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/uazapi';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, endpoint } = body;
        let instanceToken = request.headers.get('token');

        if (!instanceToken) {
            // Auto-fetch first connected instance
            try {
                const instancesRes = await fetch('https://atendsoft.uazapi.com/instance/all', {
                    headers: { 'admintoken': process.env.UAZAPI_ADMIN_TOKEN || '' }
                });
                const instances = await instancesRes.json();
                const connected = instances.find((i: any) => i.status === 'connected');
                if (connected) instanceToken = connected.token;
            } catch (e) {
                return NextResponse.json({ error: 'Failed to fetch instances' }, { status: 500 });
            }
        }

        if (!instanceToken || !phone) {
            return NextResponse.json({ error: 'Missing token (no connected instance?) or phone' }, { status: 400 });
        }

        const baseUrl = 'https://atendsoft.uazapi.com';
        const urlOptions = endpoint ? [endpoint] : [
            '/chat/messages',
            '/messages',
            '/chat/history',
            '/retrieve/messages'
        ];

        const results: Record<string, { status?: number; text?: string; error?: string }> = {};

        for (const path of urlOptions) {
            try {
                // Determine method (usually POST for grabbing specific chat data with body)
                // But could be GET /chat/messages/PHONE

                // Try POST with body
                const resPost = await fetch(`${baseUrl}${path}`, {
                    method: 'POST',
                    headers: { 'token': instanceToken, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        number: phone,
                        phone: phone,
                        limit: 10
                    })
                });

                // Try GET (append phone to url if path ends with /)
                const resGet = await fetch(`${baseUrl}${path}/${phone}`, {
                    headers: { 'token': instanceToken }
                });

                results[`POST ${path}`] = { status: resPost.status, text: await resPost.text().catch(() => 'err') };
                results[`GET ${path}/${phone}`] = { status: resGet.status, text: await resGet.text().catch(() => 'err') };

            } catch (e: unknown) {
                results[path] = { error: e instanceof Error ? e.message : 'Unknown error' };
            }
        }

        return NextResponse.json({ results });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
