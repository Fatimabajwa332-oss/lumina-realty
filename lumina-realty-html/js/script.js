// ========================================
// Lumina Realty — script.js
// Now connected to the real backend API (Node/Express + MySQL)
// ========================================

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async () => {

  // ---------- 0. Update navbar based on login state ----------
  const signinBtn = document.getElementById('signin-btn');

  if (signinBtn) {
    const storedUser = localStorage.getItem('lumina_user');

    if (storedUser) {
      const user = JSON.parse(storedUser);
      const firstName = user.full_name.split(' ')[0];

      signinBtn.textContent = `Hi, ${firstName}`;
      signinBtn.removeAttribute('href');
      signinBtn.style.cursor = 'pointer';

      signinBtn.addEventListener('click', () => {
        const confirmLogout = confirm('Sign out of your account?');
        if (confirmLogout) {
          localStorage.removeItem('lumina_user');
          window.location.href = 'index.html';
        }
      });
    }
  }

  // ---------- 1. Password Show/Hide Toggle ----------
  const toggleButtons = document.querySelectorAll('.toggle-visibility');

  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input[type="password"], input[type="text"].pw-visible');
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          input.classList.add('pw-visible');
        } else {
          input.type = 'password';
          input.classList.remove('pw-visible');
        }
      }
    });
  });

  // ---------- 2. Mobile Menu Toggle ----------
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksEl = document.getElementById('nav-links');

  if (menuToggle && navLinksEl) {
    menuToggle.addEventListener('click', () => {
      navLinksEl.classList.toggle('mobile-open');
    });
  }

  // ---------- 3. Favorite (Heart) Button Toggle ----------
  // Uses event delegation since cards are added dynamically after fetching from the API
  document.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.fav-btn');
    if (!favBtn) return;

    e.preventDefault();
    e.stopPropagation();

    favBtn.classList.toggle('active');
    favBtn.textContent = favBtn.classList.contains('active') ? '♥' : '♡';
  });

  // ========================================
  // Helper: format a price string like "4850000.00" into "$4,850,000"
  // ========================================
  function formatPrice(price) {
    const num = Math.round(parseFloat(price));
    return '$' + num.toLocaleString('en-US');
  }

  // ========================================
  // Helper: build a property card (used on browse.html and portfolio.html)
  // ========================================
  function buildPropertyCard(p) {
    return `
      <a href="property.html?id=${p.id}" class="property-card" data-price="${p.price}" data-amenities="${(p.amenities || '').toLowerCase()}">
        <div class="property-image" style="background-image: url('images/property-${p.id}/house${p.id}.jpg'), ${gradientForId(p.id)}; background-size: cover; background-position: center;">
          <span class="badge badge-dark">${p.badge || ''}</span>
          <button class="fav-btn" aria-label="Save property">♡</button>
        </div>
        <div class="property-info">
          <div class="price-row">
            <span class="price">${formatPrice(p.price)}</span>
          </div>
          <p class="location">${p.title}, ${p.city}</p>
          <div class="property-meta">
            <span>🛏 ${p.beds} Beds</span>
            <span>🛁 ${p.baths} Baths</span>
            <span>▭ ${p.area}</span>
          </div>
        </div>
      </a>
    `;
  }

  // Consistent placeholder gradient per property (until real photos are added)
  function gradientForId(id) {
    const gradients = [
      'linear-gradient(160deg,#e8c99b,#8a6a4a)',
      'linear-gradient(160deg,#9fc9e0,#3c6f8f)',
      'linear-gradient(160deg,#3d4652,#171b21)',
      'linear-gradient(160deg,#5c6b52,#2c3626)',
      'linear-gradient(160deg,#3a4a3f,#0e3d2f)',
      'linear-gradient(160deg,#cfc9bd,#8f8a7c)',
      'linear-gradient(160deg,#9db3a8,#4c6259)'
    ];
    return gradients[(id - 1) % gradients.length];
  }

  // ========================================
  // 4. Browse Page (browse.html): fetch properties + wire up filters/sort
  // ========================================
  const grid = document.getElementById('property-grid');

  if (grid) {
    try {
      const res = await fetch(`${API_BASE}/properties`);
      const allProperties = await res.json();

      grid.innerHTML = allProperties.map(buildPropertyCard).join('');

      const cards = Array.from(grid.querySelectorAll('.property-card'));
      const priceSlider = document.getElementById('price-slider');
      const priceMaxLabel = document.getElementById('price-max-label');
      const amenityTags = document.querySelectorAll('.tag-btn');
      const sortSelect = document.getElementById('sort-select');

      function formatPriceLabel(value) {
        const num = Number(value);
        if (num >= 5000000) return '$5M+';
        if (num >= 1000000) return '$' + (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        return '$' + Math.round(num / 1000) + 'k';
      }

      function applyFilters() {
        const maxPrice = Number(priceSlider.value);
        const activeAmenities = Array.from(amenityTags)
          .filter(btn => btn.classList.contains('active'))
          .map(btn => btn.dataset.amenity);

        cards.forEach(card => {
          const price = Number(card.dataset.price);
          const cardAmenities = card.dataset.amenities || '';

          const priceOk = price <= maxPrice;
          const amenitiesOk = activeAmenities.length === 0 ||
            activeAmenities.every(a => cardAmenities.includes(a));

          card.style.display = (priceOk && amenitiesOk) ? '' : 'none';
        });
      }

      function applySort() {
        const value = sortSelect.value;
        const sorted = cards.slice();

        if (value === 'Price: Low to High') {
          sorted.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
        } else if (value === 'Price: High to Low') {
          sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
        }

        sorted.forEach(card => grid.appendChild(card));
      }

      if (priceSlider) {
        priceMaxLabel.textContent = formatPriceLabel(priceSlider.value);
        priceSlider.addEventListener('input', () => {
          priceMaxLabel.textContent = formatPriceLabel(priceSlider.value);
          applyFilters();
        });
      }

      amenityTags.forEach(btn => {
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
          applyFilters();
        });
      });

      if (sortSelect) {
        sortSelect.addEventListener('change', applySort);
      }

    } catch (err) {
      console.error('Failed to load properties:', err);
      grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px 0; color:var(--text-body);">Could not load properties. Make sure the backend server is running.</p>';
    }
  }

  // ========================================
  // 5. Agent Portfolio Page (portfolio.html): fetch agent + their properties
  // ========================================
  const portfolioGrid = document.getElementById('portfolio-grid');

  if (portfolioGrid) {
    const params = new URLSearchParams(window.location.search);
    const agentId = params.get('id');

    try {
      const [agentRes, propsRes] = await Promise.all([
        fetch(`${API_BASE}/agents/${agentId}`),
        fetch(`${API_BASE}/agents/${agentId}/properties`)
      ]);

      const agent = await agentRes.json();
      const agentProperties = await propsRes.json();

      document.getElementById('pf-agent-name').textContent = agent.name || 'Agent Portfolio';
      document.getElementById('pf-heading').textContent = agent.name ? `${agent.name}'s Portfolio` : 'Agent Portfolio';
      document.getElementById('pf-subheading').textContent = agent.name
        ? `Properties currently represented by ${agent.name}.`
        : 'Properties represented by this agent.';
      document.title = (agent.name || 'Agent Portfolio') + ' — Lumina Realty';

      if (agentProperties.length === 0) {
        document.getElementById('pf-empty').style.display = 'block';
      } else {
        portfolioGrid.innerHTML = agentProperties.map(buildPropertyCard).join('');
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      portfolioGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px 0; color:var(--text-body);">Could not load this portfolio. Make sure the backend server is running.</p>';
    }
  }

  // ========================================
  // 6. Property Detail Page (property.html): fetch single property by ID
  // ========================================
  const titleEl = document.getElementById('pd-title');

  if (titleEl) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '1';

    try {
      const res = await fetch(`${API_BASE}/properties/${id}`);
      const p = await res.json();

      if (res.status === 404) {
        document.querySelector('.property-page').innerHTML = '<p style="padding:60px 0; text-align:center;">Property not found.</p>';
        return;
      }

      document.getElementById('pd-title').textContent = p.title;
      document.getElementById('pd-address').textContent = '📍 ' + p.address;
      document.getElementById('pd-price').textContent = formatPrice(p.price);
      document.getElementById('pd-badge').textContent = p.badge;
      document.getElementById('pd-beds').textContent = String(p.beds).padStart(2, '0');
      document.getElementById('pd-baths').textContent = String(p.baths).padStart(2, '0');
      document.getElementById('pd-area').textContent = p.area;
      document.getElementById('pd-garage').textContent = p.garage;
      document.getElementById('pd-heading').textContent = p.title;
      document.getElementById('pd-desc-1').textContent = p.description1;
      document.getElementById('pd-desc-2').textContent = p.description2;
      document.getElementById('pd-agent-name').textContent = p.agent_name;

      const callBtn = document.getElementById('pd-call-btn');
      const emailBtn = document.getElementById('pd-email-btn');
      if (callBtn) callBtn.href = p.agent_phone ? `tel:${p.agent_phone.replace(/[^+\d]/g, '')}` : '#';
      if (emailBtn) emailBtn.href = p.agent_email ? `mailto:${p.agent_email}?subject=Inquiry about ${encodeURIComponent(p.title)}` : '#';

      const initials = p.agent_name ? p.agent_name.split(' ').map(w => w[0]).join('') : '';
      document.getElementById('pd-agent-initials').textContent = initials;

      document.title = p.title + " — Lumina Realty";

      const gradient = gradientForId(p.id);
      const folder = `images/property-${p.id}`;
      const propId = p.id;

      const mainStyle = `background-image: url('${folder}/house${propId}.jpg'), ${gradient}; background-size: cover; background-position: center;`;
      const thumb1Style = `background-image: url('${folder}/livingroom${propId}.jpg'), ${gradient}; background-size: cover; background-position: center;`;
      const thumb2Style = `background-image: url('${folder}/kitchen${propId}.jpg'), ${gradient}; background-size: cover; background-position: center;`;
      const thumb3Style = `background-image: url('${folder}/bedroom${propId}.jpg'), ${gradient}; background-size: cover; background-position: center;`;
      const thumb4Style = `background-image: url('${folder}/bathroom${propId}.jpg'), ${gradient}; background-size: cover; background-position: center;`;

      document.getElementById('pd-gallery-main').setAttribute('style', mainStyle);
      document.getElementById('pd-thumb-1').setAttribute('style', thumb1Style);
      document.getElementById('pd-thumb-2').setAttribute('style', thumb2Style);
      document.getElementById('pd-thumb-3').setAttribute('style', thumb3Style);
      document.getElementById('pd-thumb-4').setAttribute('style', thumb4Style);

      document.getElementById('pd-breadcrumb').innerHTML =
        `<a href="browse.html">Properties</a> &gt; California &gt; <strong>${p.city}</strong>`;

      const mapQuery = encodeURIComponent(p.address || p.city);
      document.getElementById('pd-map').src = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

      const amenitiesBox = document.getElementById('pd-amenities');
      amenitiesBox.innerHTML = (p.amenities || []).map(a => `<span class="amenity">✓ ${a}</span>`).join('');

      // ---------- Wire up the "Request Private Tour" form to the API ----------
      const tourForm = document.getElementById('tour-form');
      if (tourForm) {
        tourForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const name = document.getElementById('fname').value.trim();
          const email = document.getElementById('femail').value.trim();
          const message = document.getElementById('fmsg').value.trim();

          if (!name || !email) {
            alert('Please enter your name and email.');
            return;
          }

          const submitBtn = tourForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.textContent;
          submitBtn.textContent = 'SENDING...';
          submitBtn.disabled = true;

          try {
            const res = await fetch(`${API_BASE}/inquiries`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ property_id: p.id, name, email, message })
            });

            if (res.ok) {
              submitBtn.textContent = 'REQUEST SENT ✓';
              tourForm.reset();
            } else {
              submitBtn.textContent = originalText;
              alert('Something went wrong. Please try again.');
            }
          } catch (err) {
            console.error(err);
            submitBtn.textContent = originalText;
            alert('Could not reach the server. Make sure the backend is running.');
          } finally {
            submitBtn.disabled = false;
            setTimeout(() => { submitBtn.textContent = originalText; }, 3000);
          }
        });
      }

    } catch (err) {
      console.error('Failed to load property:', err);
    }
  }

  // ========================================
  // 7. AI Chat Widget — searches real properties from the API
  // ========================================
  const chatFab = document.querySelector('.chat-fab');

  if (chatFab) {
    chatFab.addEventListener('click', () => {
      let chatBox = document.querySelector('.chat-box');

      if (!chatBox) {
        chatBox = document.createElement('div');
        chatBox.className = 'chat-box';
        chatBox.innerHTML = `
          <div class="chat-box-header">
            <span>Lumina AI Assistant</span>
            <button class="chat-box-close" aria-label="Close chat">×</button>
          </div>
          <div class="chat-box-messages">
            <div class="chat-msg chat-msg-ai">Hi! I'm your Lumina AI assistant. Ask me about any property, neighborhood, or financing question.</div>
          </div>
          <div class="chat-box-input">
            <input type="text" placeholder="Type your message...">
            <button aria-label="Send">➤</button>
          </div>
        `;
        document.body.appendChild(chatBox);

        chatBox.querySelector('.chat-box-close').addEventListener('click', () => {
          chatBox.classList.remove('open');
        });

        const input = chatBox.querySelector('input');
        const sendBtn = chatBox.querySelector('.chat-box-input button');
        const messages = chatBox.querySelector('.chat-box-messages');

        const sendMessage = async () => {
          const text = input.value.trim();
          if (text === '') return;

          const userMsg = document.createElement('div');
          userMsg.className = 'chat-msg chat-msg-user';
          userMsg.textContent = text;
          messages.appendChild(userMsg);

          input.value = '';
          messages.scrollTop = messages.scrollHeight;

          // Show a "typing..." placeholder while we wait for the AI
          const typingMsg = document.createElement('div');
          typingMsg.className = 'chat-msg chat-msg-ai';
          typingMsg.textContent = 'Typing...';
          messages.appendChild(typingMsg);
          messages.scrollTop = messages.scrollHeight;

          const reply = await generateAssistantReply(text);
          typingMsg.innerHTML = reply;
          messages.scrollTop = messages.scrollHeight;
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMessage();
        });
      }

      chatBox.classList.toggle('open');
    });
  }

  // ---------- Real AI logic: calls our backend, which talks to Google Gemini ----------
  async function generateAssistantReply(message) {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Chat error:', data);
        return "Sorry, I ran into an issue answering that. Please try again.";
      }

      return data.reply;
    } catch (err) {
      console.error(err);
      return "I couldn't reach the AI service. Make sure the backend server is running.";
    }
  }


  // ========================================
  // 8. Signup Form (signup.html)
  // ========================================
  const signupForm = document.getElementById('signup-form');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const full_name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorBox = document.getElementById('signup-error');
      const submitBtn = signupForm.querySelector('button[type="submit"]');

      errorBox.style.display = 'none';

      if (password.length < 8) {
        errorBox.textContent = 'Password must be at least 8 characters.';
        errorBox.style.display = 'block';
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'CREATING ACCOUNT...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('lumina_user', JSON.stringify({ id: data.id, full_name: data.full_name, email: data.email }));
          window.location.href = 'index.html';
        } else {
          errorBox.textContent = data.error || 'Something went wrong. Please try again.';
          errorBox.style.display = 'block';
        }
      } catch (err) {
        console.error(err);
        errorBox.textContent = 'Could not reach the server. Make sure the backend is running.';
        errorBox.style.display = 'block';
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // ========================================
  // 9. Login Form (login.html)
  // ========================================
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorBox = document.getElementById('login-error');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      errorBox.style.display = 'none';

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'SIGNING IN...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('lumina_user', JSON.stringify({ id: data.id, full_name: data.full_name, email: data.email }));
          window.location.href = 'index.html';
        } else {
          errorBox.textContent = data.error || 'Invalid email or password.';
          errorBox.style.display = 'block';
        }
      } catch (err) {
        console.error(err);
        errorBox.textContent = 'Could not reach the server. Make sure the backend is running.';
        errorBox.style.display = 'block';
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

});