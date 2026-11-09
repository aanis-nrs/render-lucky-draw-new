import express from 'express';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))));

app.post('/api/draw', (req, res) => {
  const names = req.body?.names;
  if (!Array.isArray(names) || names.length < 1 || names.length > 100 ||
      names.some(name => typeof name !== 'string' || !name.trim() || name.trim().length > 60)) {
    return res.status(400).json({ message: 'Provide 1–100 names, each 1–60 characters long.' });
  }
  const cleaned = names.map(name => name.trim());
  if (new Set(cleaned.map(name => name.toLocaleLowerCase())).size !== cleaned.length) {
    return res.status(400).json({ message: 'Please remove duplicate names.' });
  }
  const index = randomInt(cleaned.length);
  res.json({ winner: cleaned[index], index });
});
app.use((err, req, res, next) => {
  if (err.status === 400 || err.status === 413) return res.status(err.status).json({ message: 'Invalid or oversized JSON request.' });
  res.status(500).json({ message: 'Server error.' });
});
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Lucky Draw listening on port ${port}`));
