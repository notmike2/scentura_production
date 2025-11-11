import { Router } from 'express';
import { readJSON, writeJSON } from './lib/store.js';
import { toMl } from './lib/units.js';
import { nanoid } from 'nanoid';

const r = Router();

const load = (name, fallback) => readJSON(name) || fallback;
const save = (name, data) => writeJSON(name, data);

// ---------- INVENTORY ----------
r.get('/api/inventory', (req, res) => res.json(load('inventory.json', [])));

r.post('/api/inventory', (req, res) => {
  const { name, kind, amount, unit } = req.body;
  if (!name || !kind) return res.status(400).json({ error: 'name, kind required' });
  const inv = load('inventory.json', []);
  const amt = Number(amount || 0);
  const normalized = kind === 'liquid' && unit ? toMl(amt, unit) : amt;
  const item = { id: nanoid(8), name, kind, amount: normalized };
  inv.push(item);
  save('inventory.json', inv);
  res.status(201).json(item);
});

r.patch('/api/inventory/:id', (req, res) => {
  const inv = load('inventory.json', []);
  const i = inv.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'not found' });
  if (typeof req.body.delta === 'number') inv[i].amount += req.body.delta;
  if (typeof req.body.amount === 'number') inv[i].amount = req.body.amount;
  save('inventory.json', inv);
  res.json(inv[i]);
});

r.delete('/api/inventory/:id', (req, res) => {
  const next = load('inventory.json', []).filter(x => x.id !== req.params.id);
  save('inventory.json', next);
  res.status(204).end();
});

// ---------- RECIPES ----------
r.get('/api/recipes', (req, res) => res.json(load('recipes.json', [])));

r.post('/api/recipes', (req, res) => {
  const { name, ingredients } = req.body;
  if (!name || !Array.isArray(ingredients))
    return res.status(400).json({ error: 'name, ingredients required' });
  const recipes = load('recipes.json', []);
  const recipe = {
    id: nanoid(8),
    name,
    ingredients: ingredients.map(i => ({ name: i.name, amountMl: Number(i.amountMl) }))
  };
  recipes.push(recipe);
  save('recipes.json', recipes);
  res.status(201).json(recipe);
});

r.put('/api/recipes/:id', (req, res) => {
  const recipes = load('recipes.json', []);
  const i = recipes.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'not found' });
  const { name, ingredients } = req.body;
  if (name) recipes[i].name = name;
  if (ingredients)
    recipes[i].ingredients = ingredients.map(x => ({ name: x.name, amountMl: Number(x.amountMl) }));
  save('recipes.json', recipes);
  res.json(recipes[i]);
});

r.delete('/api/recipes/:id', (req, res) => {
  const next = load('recipes.json', []).filter(x => x.id !== req.params.id);
  save('recipes.json', next);
  res.status(204).end();
});

// ---------- STOCK ----------
r.get('/api/stock', (req, res) => res.json(load('stock.json', [])));

// ---------- PRODUCE ----------
r.post('/api/produce', (req, res) => {
  const { recipeId, quantity } = req.body;
  const qty = Number(quantity || 1);
  if (!recipeId || qty <= 0)
    return res.status(400).json({ error: 'recipeId, quantity > 0 required' });

  const inventory = load('inventory.json', []);
  const recipes = load('recipes.json', []);
  const stock = load('stock.json', []);

  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return res.status(404).json({ error: 'recipe not found' });

  for (const ing of recipe.ingredients) {
    const item = inventory.find(x => x.name.toLowerCase() === ing.name.toLowerCase());
    const need = ing.amountMl * qty;
    if (!item) return res.status(400).json({ error: `missing ingredient: ${ing.name}` });
    if (item.kind !== 'liquid')
      return res.status(400).json({ error: `ingredient ${ing.name} must be liquid` });
    if (item.amount < need)
      return res
        .status(400)
        .json({ error: `not enough ${ing.name} (need ${need} ml, have ${item.amount} ml)` });
  }

  for (const ing of recipe.ingredients) {
    const item = inventory.find(x => x.name.toLowerCase() === ing.name.toLowerCase());
    item.amount -= ing.amountMl * qty;
  }

  const si = stock.findIndex(s => s.name.toLowerCase() === recipe.name.toLowerCase());
  if (si >= 0) stock[si].quantity += qty;
  else stock.push({ id: nanoid(8), name: recipe.name, quantity: qty });

  save('inventory.json', inventory);
  save('stock.json', stock);

  res.json({ ok: true, produced: qty, product: recipe.name });
});

export default r;
