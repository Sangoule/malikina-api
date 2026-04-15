import EXPRESS from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { seedDatabase } from './db/seed.js';
import { pool } from './db/config.js';
import { xassidaRoutes } from './routes/xassidas.js';
import { authorRoutes } from './routes/authors.js';
import categoriesRoutes from './routes/categories.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = EXPRESS();
const PORT = process.env.PORT || 5000;

const openApiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Malikina API',
      version: '1.0.0',
      description: 'REST API for authors, xassidas, verses, and PDF extraction.'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Current API server'
      }
    ],
    tags: [
      { name: 'Health' },
      { name: 'Authors' },
      { name: 'Xassidas' }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': { description: 'API is healthy' }
          }
        }
      },
      '/api/authors': {
        get: {
          tags: ['Authors'],
          summary: 'List all authors',
          responses: { '200': { description: 'Authors list' } }
        },
        post: {
          tags: ['Authors'],
          summary: 'Create author',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    photo_url: { type: 'string' },
                    birth_year: { type: 'integer' },
                    death_year: { type: 'integer' },
                    tradition: { type: 'string' }
                  },
                  required: ['name']
                }
              }
            }
          },
          responses: { '201': { description: 'Author created' } }
        }
      },
      '/api/authors/{id}': {
        get: {
          tags: ['Authors'],
          summary: 'Get one author',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Author details' },
            '404': { description: 'Author not found' }
          }
        },
        put: {
          tags: ['Authors'],
          summary: 'Update author',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Author updated' } }
        },
        delete: {
          tags: ['Authors'],
          summary: 'Delete author',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Author deleted' } }
        }
      },
      '/api/xassidas': {
        get: {
          tags: ['Xassidas'],
          summary: 'List all xassidas',
          responses: { '200': { description: 'Xassidas list' } }
        },
        post: {
          tags: ['Xassidas'],
          summary: 'Create xassida',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    author_id: { type: 'string' },
                    description: { type: 'string' }
                  },
                  required: ['title', 'author_id']
                }
              }
            }
          },
          responses: { '201': { description: 'Xassida created' } }
        }
      },
      '/api/xassidas/{id}': {
        get: {
          tags: ['Xassidas'],
          summary: 'Get one xassida with verses',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': { description: 'Xassida details' },
            '404': { description: 'Xassida not found' }
          }
        },
        put: {
          tags: ['Xassidas'],
          summary: 'Update xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Xassida updated' } }
        },
        delete: {
          tags: ['Xassidas'],
          summary: 'Delete xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Xassida deleted' } }
        }
      },
      '/api/xassidas/{id}/verses': {
        get: {
          tags: ['Xassidas'],
          summary: 'Get verses for a xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: { '200': { description: 'Verses list' } }
        },
        post: {
          tags: ['Xassidas'],
          summary: 'Save verses for a xassida',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    verses: {
                      type: 'array',
                      items: { type: 'object' }
                    }
                  },
                  required: ['verses']
                }
              }
            }
          },
          responses: { '201': { description: 'Verses saved' } }
        }
      },
      '/api/xassidas/{id}/upload-pdf': {
        post: {
          tags: ['Xassidas'],
          summary: 'Upload PDF and extract verses',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary'
                    }
                  },
                  required: ['file']
                }
              }
            }
          },
          responses: { '200': { description: 'PDF processed' } }
        }
      }
    }
  },
  apis: []
});

// Middleware
// Si en production, accepter toutes les origins pour debug
const allowAllOrigins = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL || '';
const defaultOrigins = ['http://localhost:8080', 'http://localhost:5173', 'https://malikina.vercel.app'];
const allowedOrigins = frontendUrl 
  ? frontendUrl.split(',').map(s => s.trim())
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    // In production, allow all origins for now
    if (allowAllOrigins) return callback(null, true);
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(EXPRESS.json({ limit: '50mb' }));
app.use(EXPRESS.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use('/audios', EXPRESS.static(path.join(__dirname, 'public/audios')));
app.use('/photos', EXPRESS.static(path.join(__dirname, 'public/photos')));

// Initialize PostgreSQL
console.log('⏳ Connecting to PostgreSQL database...');
try {
  const result = await pool.query('SELECT 1');
  console.log('✅ PostgreSQL connected');
} catch (err) {
  console.error('❌ PostgreSQL connection failed:', err);
  process.exit(1);
}

// Run pending migrations from db/migrations/ in order
async function runMigrations() {
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, 'db/migrations');
    let files: string[] = [];
    try {
      files = (await fs.readdir(migrationsDir))
        .filter(f => f.endsWith('.sql'))
        .sort();
    } catch {
      console.log('⚠️  No migrations directory found, skipping.');
      return;
    }

    for (const file of files) {
      const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE filename = $1', [file]);
      if (rows.length > 0) continue; // already applied

      console.log(`🔄 Running migration: ${file}`);
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      console.log(`✅ Migration applied: ${file}`);
    }
  } catch (err) {
    console.error('❌ Migration error:', err);
  }
}

await runMigrations();

// Auto-seed: seed database with sample data if empty
await seedDatabase();

// Optional: run scraper in background if SCRAPER_ENABLED=true
if (process.env.SCRAPER_ENABLED === 'true') {
  try {
    const result = await pool.query('SELECT COUNT(*) as cnt FROM xassidas');
    const cnt = (result.rows[0] as any)?.cnt ?? 0;
    if (cnt === 0) {
      console.log('🌱 Base vide — démarrage du scraper en arrière-plan...');
      import('./scripts/scrape-xassidas.js').catch(err =>
        console.error('❌ Scraper error:', err)
      );
    } else {
      console.log(`📚 Base déjà peuplée (${cnt} xassidas) — scraper ignoré.`);
    }
  } catch (err) {
    console.log('⚠️  Scraper check skipped:', err);
  }
}

// Routes
app.use('/api/xassidas', xassidaRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoriesRoutes);
app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: EXPRESS.Request, res: EXPRESS.Response, next: EXPRESS.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

app.listen(PORT, () => {
  console.log(`✅ Xassida API running on http://localhost:${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   GET  /api/docs`);
  console.log(`   GET  /api/openapi.json`);
  console.log(`   GET  /api/xassidas`);
  console.log(`   POST /api/xassidas`);
  console.log(`   GET  /api/xassidas/:id`);
  console.log(`   PUT  /api/xassidas/:id`);
  console.log(`   DELETE /api/xassidas/:id`);
  console.log(`   GET  /api/xassidas/:id/verses`);
  console.log(`   POST /api/xassidas/:id/verses`);
  console.log(`   POST /api/xassidas/:id/upload-pdf`);
  console.log(`   POST /api/xassidas/admin/import-translations`);
});
