import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './route.js';
import { errorHandler } from './middleware/error.js';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// statische HTML-Dateien ausliefern
app.use(express.static(path.join(__dirname, '..', 'public')));

// API-Routen
app.use(routes);

// 404-Fallback für API
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));

// Fehler-Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
