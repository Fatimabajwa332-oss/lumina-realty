const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./db');

// Safety net: log unexpected errors instead of letting them crash the server
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught error (server kept running):', err.message);
});

const app = express();

app.use(cors());
app.use(express.json());

// ---------- Test route ----------
app.get('/', (req, res) => {
  res.send('Lumina Realty API is running!');
});

// ---------- Get all properties (with agent info + amenities joined in) ----------
app.get('/api/properties', (req, res) => {
  const query = `
    SELECT
      properties.*,
      agents.name AS agent_name,
      agents.photo AS agent_photo,
      GROUP_CONCAT(amenities.amenity_name SEPARATOR ', ') AS amenities
    FROM properties
    JOIN agents ON properties.agent_id = agents.id
    LEFT JOIN amenities ON amenities.property_id = properties.id
    GROUP BY properties.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// ---------- Get a single property by ID (with agent + amenities) ----------
app.get('/api/properties/:id', (req, res) => {
  const propertyId = req.params.id;

  const propertyQuery = `
    SELECT properties.*, agents.name AS agent_name, agents.photo AS agent_photo, agents.role AS agent_role, agents.phone AS agent_phone, agents.email AS agent_email
    FROM properties
    JOIN agents ON properties.agent_id = agents.id
    WHERE properties.id = ?
  `;

  const amenitiesQuery = `SELECT amenity_name FROM amenities WHERE property_id = ?`;

  db.query(propertyQuery, [propertyId], (err, propertyResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (propertyResults.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    db.query(amenitiesQuery, [propertyId], (err, amenityResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database query failed' });
      }

      const property = propertyResults[0];
      property.amenities = amenityResults.map(row => row.amenity_name);

      res.json(property);
    });
  });
});

// ---------- Get all agents ----------
app.get('/api/agents', (req, res) => {
  db.query('SELECT * FROM agents', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// ---------- Get a single agent by ID ----------
app.get('/api/agents/:id', (req, res) => {
  db.query('SELECT * FROM agents WHERE id = ?', [req.params.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(results[0]);
  });
});

// ---------- Get properties for a specific agent (for portfolio.html) ----------
app.get('/api/agents/:id/properties', (req, res) => {
  const agentId = req.params.id;

  db.query('SELECT * FROM properties WHERE agent_id = ?', [agentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// ---------- Submit an inquiry (Request Private Tour form) ----------
app.post('/api/inquiries', (req, res) => {
  const { property_id, name, email, message } = req.body;

  if (!property_id || !name || !email) {
    return res.status(400).json({ error: 'property_id, name, and email are required' });
  }

  const query = `INSERT INTO inquiries (property_id, name, email, message) VALUES (?, ?, ?, ?)`;

  db.query(query, [property_id, name, email, message || ''], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save inquiry' });
    }
    res.status(201).json({ message: 'Inquiry submitted successfully', id: result.insertId });
  });
});

// ---------- Signup: create a new user account ----------
app.post('/api/signup', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  try {
    // Check if email is already registered
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, existing) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database query failed' });
      }

      if (existing.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      // Hash the password before storing it (never store plain text passwords)
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;
      db.query(insertQuery, [full_name, email, hashedPassword], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to create account' });
        }
        res.status(201).json({ message: 'Account created successfully', id: result.insertId, full_name, email });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ---------- Login: verify email + password ----------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Don't send the hashed password back to the browser
    res.json({ message: 'Login successful', id: user.id, full_name: user.full_name, email: user.email });
  });
});

// ---------- AI Chat: uses Google Gemini, with our properties as context ----------
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const propertyQuery = `
    SELECT properties.*, agents.name AS agent_name,
      GROUP_CONCAT(amenities.amenity_name SEPARATOR ', ') AS amenities
    FROM properties
    JOIN agents ON properties.agent_id = agents.id
    LEFT JOIN amenities ON amenities.property_id = properties.id
    GROUP BY properties.id
  `;

  db.query(propertyQuery, async (err, properties) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Build a plain-text summary of our listings for the AI to reference
    const listingsSummary = properties.map(p =>
      `#${p.id} "${p.title}" in ${p.city} — $${Number(p.price).toLocaleString()}, ${p.beds} beds, ${p.baths} baths, ${p.area}. Amenities: ${p.amenities || 'none listed'}. Agent: ${p.agent_name}.`
    ).join('\n');

    const systemPrompt = `You are the Lumina AI Assistant for Lumina Realty, a luxury real estate website. You help visitors find properties, answer questions about neighborhoods, and give general financing guidance. Only recommend properties from this list — never invent listings that aren't here:\n\n${listingsSummary}\n\nWhen you recommend a property, mention its ID like this: [property:ID] so the website can turn it into a clickable link. Keep replies concise (2-4 sentences) and friendly.`;

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        console.error('Gemini API error:', data);
        return res.status(500).json({ error: 'AI service error', details: data.error?.message });
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";

      // Turn [property:ID] tags into clickable links the frontend can render
      const withLinks = aiText.replace(/\[property:(\d+)\]/g, (match, id) => {
        const prop = properties.find(p => String(p.id) === id);
        return prop ? `<a href="property.html?id=${id}">${prop.title}</a>` : match;
      });

      res.json({ reply: withLinks });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to reach AI service' });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});