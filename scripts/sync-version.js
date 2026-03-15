import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, '..');

async function syncVersion() {
    console.log('--- Starting Version Sync ---');

    // 1. Read package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf8'));
    const version = packageJson.version;
    console.log(`Current version: ${version}`);

    // 2. Load Env
    let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Try to read from .env.local if not in process.env
    if (!supabaseUrl || !serviceKey) {
        const envFiles = ['.env.local', '.env'];
        for (const file of envFiles) {
            const filePath = path.join(rootPath, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                lines.forEach(line => {
                    if (line.startsWith('VITE_SUPABASE_URL=') || line.startsWith('SUPABASE_URL=')) {
                        supabaseUrl = line.split('=').slice(1).join('=').trim();
                    }
                    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
                        serviceKey = line.split('=').slice(1).join('=').trim();
                    }
                });
            }
        }
    }

    if (!supabaseUrl || !serviceKey) {
        console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
        process.exit(1);
    }

    // 3. Update Supabase
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
        .from('system_config')
        .upsert({
            key: 'app_version',
            value: {
                version: version,
                timestamp: new Date().toISOString(),
                force_reload: false
            }
        });

    if (error) {
        console.error('Error updating Supabase:', error.message);
        process.exit(1);
    }

    console.log(`Successfully updated system_config with version ${version}`);
    console.log('--- Version Sync Complete ---');
}

syncVersion();
