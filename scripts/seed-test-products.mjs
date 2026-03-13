/**
 * Test seed — Origins of Odisha product catalog
 * Run: node scripts/seed-test-products.mjs
 */

const API = 'http://localhost:3000'

// ─── 1. Login ─────────────────────────────────────────────────────────────────
async function getToken() {
  const res = await fetch(`${API}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@owntown.com', password: 'admin123' }),
  })
  const data = await res.json()
  if (!data.token) throw new Error('Login failed: ' + JSON.stringify(data))
  return data.token
}

// ─── 2. Category helper ────────────────────────────────────────────────────────
async function createCategory(token, payload) {
  const res = await fetch(`${API}/admin/products/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.id) throw new Error('Category create failed: ' + JSON.stringify(data))
  console.log(`  ✓ Category: ${data.name} (${data.id})`)
  return data
}

// ─── 3. Product helper ─────────────────────────────────────────────────────────
async function createProduct(token, payload) {
  const res = await fetch(`${API}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.id) {
    console.warn(`  ⚠ Product skipped (${payload.name}): ${data.message ?? JSON.stringify(data)}`)
    return null
  }
  console.log(`  ✓ ${data.name}`)
  return data
}

// ─── 4. Seed data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Pickles & Achaar',        sortOrder: 1 },
  { name: 'Snacks & Namkeen',        sortOrder: 2 },
  { name: 'Spices & Masalas',        sortOrder: 3 },
  { name: 'Dried & Preserved Foods', sortOrder: 4 },
  { name: 'Health Foods',            sortOrder: 5 },
  { name: 'Sweets & Ladoos',         sortOrder: 6 },
  { name: 'Art & Handicrafts',       sortOrder: 7 },
  { name: 'Puja & Religious Items',  sortOrder: 8 },
  { name: 'Textiles & Clothing',     sortOrder: 9 },
]

// price in paise (₹ × 100), mrp = 10-20% higher than price
function p(rs) { return Math.round(rs * 100) }
function mrp(rs, pct = 15) { return Math.round(rs * 100 * (1 + pct / 100) / 100) * 100 }
let skuCounter = 1
function sku(prefix) { return `${prefix}-${String(skuCounter++).padStart(3, '0')}` }

async function buildProducts(cats) {
  // map by normalised name key
  const c = Object.fromEntries(cats.map(cat => [
    cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    cat.id
  ]))
  console.log('  Available category keys:', Object.keys(c))

  return [
    // ── Pickles ────────────────────────────────────────────────────────────────
    { name: 'Berhampur Amba Sadha Mango Pickle', description: 'Traditional Berhampur pickle made from sun-ripened mango pulp with mustard oil, red chilli, turmeric, salt, jaggery & Odia spices. No artificial flavours or preservatives. Handcrafted in small batches.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 50, sku: sku('PCK'), isFeatured: true, gstCategory: 'exempt', tags: ['mango', 'pickle', 'berhampur', 'odia'] },
    { name: 'Berhampur Green Chilli Pickle', description: 'Traditional Berhampur green chilli pickle with mustard oil and spices. Bold, fiery flavour.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 40, sku: sku('PCK'), gstCategory: 'exempt', tags: ['chilli', 'pickle', 'berhampur'] },
    { name: 'Berhampur Khajuri Dates Pickle', description: 'Traditional Berhampur pickle made from fresh dates — sweet, tangy and mildly spiced.', categoryId: c['pickles-achaar'], price: p(119), mrp: mrp(119), unit: '250g', stockQuantity: 30, sku: sku('PCK'), gstCategory: 'exempt', tags: ['dates', 'pickle'] },
    { name: 'Berhampur Koli Berry Pickle', description: 'Traditional Berhampur berry pickle — tangy and naturally preserved.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 35, sku: sku('PCK'), gstCategory: 'exempt', tags: ['berry', 'pickle'] },
    { name: 'Berhampur Lemon Pickle', description: 'Classic Berhampur-style lemon pickle made with whole lemons, mustard oil and spices.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 45, sku: sku('PCK'), gstCategory: 'exempt', tags: ['lemon', 'pickle'] },
    { name: 'Berhampur Mango Sweet & Sour Pickle', description: 'The perfect sweet-and-sour raw mango pickle from Berhampur — balanced and addictive.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 40, sku: sku('PCK'), gstCategory: 'exempt', tags: ['mango', 'sweet', 'sour', 'pickle'] },
    { name: 'Berhampur Navaratna Pickle', description: 'Nine-ingredient mixed pickle — a Berhampur specialty using nine seasonal vegetables and spices.', categoryId: c['pickles-achaar'], price: p(129), mrp: mrp(129), unit: '250g', stockQuantity: 25, sku: sku('PCK'), isFeatured: true, gstCategory: 'exempt', tags: ['navaratna', 'mixed', 'pickle'] },
    { name: 'Berhampur Spicy Mango Pickle', description: 'Bold, fiery raw mango pickle — Berhampur style with extra spice and mustard oil.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 50, sku: sku('PCK'), gstCategory: 'exempt', tags: ['mango', 'spicy', 'pickle'] },
    { name: 'Berhampur Sweet Lemon Pickle', description: 'Sweet lemon pickle from Berhampur — gently sweetened with jaggery and lightly spiced.', categoryId: c['pickles-achaar'], price: p(99), mrp: mrp(99), unit: '250g', stockQuantity: 30, sku: sku('PCK'), gstCategory: 'exempt', tags: ['lemon', 'sweet', 'pickle'] },

    // ── Snacks ─────────────────────────────────────────────────────────────────
    { name: 'Berhampur Buguda Mixture', description: 'Traditional crunchy savory mixture from Berhampur, Buguda village style — crispy, spiced and utterly moreish.', categoryId: c['snacks-namkeen'], price: p(90), mrp: mrp(90), unit: '250g', stockQuantity: 60, sku: sku('SNK'), isFeatured: true, gstCategory: 'five', tags: ['mixture', 'namkeen', 'berhampur'] },
    { name: 'Berhampur Rasuna Garlic Mixture', description: 'Garlic-forward traditional crunchy mixture from Berhampur — bold, savory and highly snackable.', categoryId: c['snacks-namkeen'], price: p(90), mrp: mrp(90), unit: '250g', stockQuantity: 55, sku: sku('SNK'), gstCategory: 'five', tags: ['garlic', 'mixture', 'namkeen'] },
    { name: 'Berhampur Rasi Papad', description: 'Traditional thin rice papads from Berhampur — light, crispy and great with dal or curd.', categoryId: c['snacks-namkeen'], price: p(80), mrp: mrp(80), unit: '200g', stockQuantity: 40, sku: sku('SNK'), gstCategory: 'five', tags: ['papad', 'rice', 'berhampur'] },
    { name: 'Berhampur Special Supulu', description: 'Traditional puffed fried snack from Berhampur — light and crispy.', categoryId: c['snacks-namkeen'], price: p(59), mrp: mrp(59), unit: '130g', stockQuantity: 70, sku: sku('SNK'), gstCategory: 'five', tags: ['supulu', 'puffed', 'snack'] },
    { name: 'Homemade Chuda Bhaja with Dryfruits', description: 'Homemade roasted flattened rice with dry fruits and nuts — nutritious, crunchy and lightly salted.', categoryId: c['snacks-namkeen'], price: p(79), mrp: mrp(79), unit: '200g', stockQuantity: 35, sku: sku('SNK'), gstCategory: 'five', tags: ['chuda', 'bhaja', 'dryfruits', 'odia'] },
    { name: 'Juani Ajwain Muduki', description: 'Traditional Odia fried rice puffs flavored with carom seeds (ajwain) — digestive and crunchy.', categoryId: c['snacks-namkeen'], price: p(59), mrp: mrp(59), unit: '130g', stockQuantity: 80, sku: sku('SNK'), gstCategory: 'five', tags: ['muduki', 'ajwain', 'odia'] },
    { name: 'Pudina Mint Muduki', description: 'Traditional Odia fried rice puffs with refreshing mint flavour — cool, crunchy and light.', categoryId: c['snacks-namkeen'], price: p(59), mrp: mrp(59), unit: '130g', stockQuantity: 80, sku: sku('SNK'), gstCategory: 'five', tags: ['muduki', 'mint', 'pudina'] },
    { name: 'Soyabean Muduki', description: 'Soybean-flavored traditional Odia fried rice puffs — protein-rich and crunchy.', categoryId: c['snacks-namkeen'], price: p(59), mrp: mrp(59), unit: '130g', stockQuantity: 75, sku: sku('SNK'), gstCategory: 'five', tags: ['muduki', 'soyabean'] },
    { name: 'Special Rasuna Garlic Muduki', description: 'Garlic-flavored traditional Odia fried rice puffs — savory, aromatic and addictive.', categoryId: c['snacks-namkeen'], price: p(59), mrp: mrp(59), unit: '130g', stockQuantity: 80, sku: sku('SNK'), isFeatured: true, gstCategory: 'five', tags: ['muduki', 'garlic', 'rasuna'] },
    { name: 'Tomato Muduki', description: 'Tomato-flavored traditional Odia fried rice puffs — tangy, light and crispy.', categoryId: c['snacks-namkeen'], price: p(59), mrp: mrp(59), unit: '130g', stockQuantity: 80, sku: sku('SNK'), gstCategory: 'five', tags: ['muduki', 'tomato'] },
    { name: 'Odisha Special Dali Mixture', description: 'Traditional Odia dal-based crunchy mixture — earthy, savory and deeply satisfying.', categoryId: c['snacks-namkeen'], price: p(90), mrp: mrp(90), unit: '250g', stockQuantity: 50, sku: sku('SNK'), gstCategory: 'five', tags: ['dali', 'mixture', 'namkeen'] },
    { name: 'Pakhala Mixture', description: 'Authentic Odia crunchy blend — the traditional companion to Pakhala Bhaata (fermented rice). Light, tangy, spicy. Best within 45 days of opening.', categoryId: c['snacks-namkeen'], price: p(85), mrp: mrp(85), unit: '250g', stockQuantity: 45, sku: sku('SNK'), isFeatured: true, gstCategory: 'five', tags: ['pakhala', 'mixture', 'odia'] },
    { name: 'Saurastra All In One Mix', description: 'Mixed savory snack Saurastra style — a generous blend of sev, gathia, peanuts and spiced bits.', categoryId: c['snacks-namkeen'], price: p(169), mrp: mrp(169), unit: '500g', stockQuantity: 30, sku: sku('SNK'), gstCategory: 'five', tags: ['saurastra', 'mixture'] },

    // ── Spices ─────────────────────────────────────────────────────────────────
    { name: 'Ruchi Biryani Masala', description: 'Aromatic biryani spice blend with whole and ground spices — rich, layered and fragrant.', categoryId: c['spices-masalas'], price: p(45), mrp: mrp(45), unit: '50g', stockQuantity: 100, sku: sku('SPC'), gstCategory: 'five', tags: ['biryani', 'masala', 'spice'] },
    { name: 'Ruchi Chaat Masala', description: 'Tangy, zingy chaat masala with amchur, black salt and cumin — the essential Indian street food sprinkle.', categoryId: c['spices-masalas'], price: p(32), mrp: mrp(32), unit: '50g', stockQuantity: 120, sku: sku('SPC'), gstCategory: 'five', tags: ['chaat', 'masala'] },
    { name: 'Ruchi Chicken Masala', description: 'Well-balanced chicken curry spice blend — warm, earthy and aromatic.', categoryId: c['spices-masalas'], price: p(42), mrp: mrp(42), unit: '50g', stockQuantity: 100, sku: sku('SPC'), gstCategory: 'five', tags: ['chicken', 'masala', 'curry'] },
    { name: 'Ruchi Chilli Powder', description: 'Bright red chilli powder — medium heat, good colour and a clean finish.', categoryId: c['spices-masalas'], price: p(42), mrp: mrp(42), unit: '100g', stockQuantity: 150, sku: sku('SPC'), gstCategory: 'five', tags: ['chilli', 'powder', 'spice'] },
    { name: 'Ruchi Dalma Powder', description: 'Authentic spice blend for Dalma — the iconic Odia lentil and vegetable dish. Earthy, light and perfectly balanced.', categoryId: c['spices-masalas'], price: p(32), mrp: mrp(32), unit: '50g', stockQuantity: 90, sku: sku('SPC'), isFeatured: true, gstCategory: 'five', tags: ['dalma', 'odia', 'masala'] },
    { name: 'Ruchi Garam Masala', description: 'Classic whole-spice garam masala blend — warming, aromatic and deeply flavourful.', categoryId: c['spices-masalas'], price: p(59), mrp: mrp(59), unit: '50g', stockQuantity: 120, sku: sku('SPC'), gstCategory: 'five', tags: ['garam', 'masala', 'spice'] },
    { name: 'Ruchi Turmeric Powder', description: 'Pure ground turmeric — bright yellow, earthy aroma and rich in curcumin.', categoryId: c['spices-masalas'], price: p(40), mrp: mrp(40), unit: '100g', stockQuantity: 200, sku: sku('SPC'), gstCategory: 'five', tags: ['turmeric', 'haldi', 'spice'] },
    { name: 'Ruchi Coriander Powder', description: 'Freshly ground coriander (dhania) powder — citrusy, mild and essential for Indian cooking.', categoryId: c['spices-masalas'], price: p(29), mrp: mrp(29), unit: '100g', stockQuantity: 150, sku: sku('SPC'), gstCategory: 'five', tags: ['coriander', 'dhania', 'spice'] },
    { name: 'Ruchi Cumin Powder', description: 'Ground cumin (jeera) powder — earthy, warm and indispensable in Indian cooking.', categoryId: c['spices-masalas'], price: p(76), mrp: mrp(76), unit: '100g', stockQuantity: 100, sku: sku('SPC'), gstCategory: 'five', tags: ['cumin', 'jeera', 'spice'] },
    { name: 'Ruchi Kashmiri Chilli Powder', description: 'Mild, deep-red Kashmiri chilli powder — for vibrant colour without excessive heat.', categoryId: c['spices-masalas'], price: p(60), mrp: mrp(60), unit: '50g', stockQuantity: 80, sku: sku('SPC'), gstCategory: 'five', tags: ['kashmiri', 'chilli', 'powder'] },
    { name: 'Ruchi Panch Phutan', description: 'Traditional Odia five-spice tempering mix (panch phoron) — fenugreek, mustard, cumin, kalonji & fennel seeds. Essential for Odia cooking.', categoryId: c['spices-masalas'], price: p(25), mrp: mrp(25), unit: '100g', stockQuantity: 100, sku: sku('SPC'), gstCategory: 'five', tags: ['panch', 'phutan', 'odia', 'spice'] },
    { name: 'Ruchi Fish Masala', description: 'Specially crafted fish curry spice blend — coastal Indian style, fragrant and well-seasoned.', categoryId: c['spices-masalas'], price: p(32), mrp: mrp(32), unit: '50g', stockQuantity: 80, sku: sku('SPC'), gstCategory: 'five', tags: ['fish', 'masala', 'curry'] },

    // ── Dried & Preserved ──────────────────────────────────────────────────────
    { name: 'Amba Sadha Dried Mango Pulp', description: 'Traditional Odia preparation of dried mango pulp — intensely fruity, tangy and naturally preserved.', categoryId: c['dried-preserved-foods'], price: p(80), mrp: mrp(80), unit: '200g', stockQuantity: 40, sku: sku('DRY'), gstCategory: 'exempt', tags: ['mango', 'dried', 'odia'] },
    { name: 'Dried Salty Mango Thakara Ambula', description: 'Sun-dried salted mango slices with seed — a traditional Odia preserve used in dal, curries and chutneys.', categoryId: c['dried-preserved-foods'], price: p(75), mrp: mrp(75), unit: '200g', stockQuantity: 35, sku: sku('DRY'), gstCategory: 'exempt', tags: ['mango', 'dried', 'salted'] },
    { name: 'Dried Seedless Mango Kuari Ambula', description: 'Sun-dried salted seedless mango — versatile and convenient traditional Odia preserve.', categoryId: c['dried-preserved-foods'], price: p(89), mrp: mrp(89), unit: '200g', stockQuantity: 30, sku: sku('DRY'), isFeatured: true, gstCategory: 'exempt', tags: ['mango', 'seedless', 'dried'] },
    { name: 'Biri Badi Urad Dal Dumplings', description: 'Handcrafted, sun-dried urad dal (black gram) dumplings made with only dal and salt. Used in Dalma, Ghanta, Badi Jholo. No preservatives. Shelf life up to 6 months.', categoryId: c['dried-preserved-foods'], price: p(95), mrp: mrp(95), unit: '200g', stockQuantity: 50, sku: sku('DRY'), isFeatured: true, gstCategory: 'exempt', tags: ['biri', 'badi', 'urad dal', 'odia'] },

    // ── Health Foods ───────────────────────────────────────────────────────────
    { name: 'Chana Sattu Chatua', description: 'Roasted Bengal gram flour (sattu/chatua) — a traditional Odia health drink and food ingredient. High protein, high fibre, naturally energising.', categoryId: c['health-foods'], price: p(139), mrp: mrp(139), unit: '500g', stockQuantity: 60, sku: sku('HLT'), isFeatured: true, gstCategory: 'exempt', tags: ['sattu', 'chatua', 'health', 'protein'] },
    { name: 'Multi Grain Sattu Chatua', description: 'Multi-grain roasted flour (sattu/chatua) — a wholesome blend of grains traditionally consumed as an energy drink or porridge.', categoryId: c['health-foods'], price: p(149), mrp: mrp(149), unit: '500g', stockQuantity: 50, sku: sku('HLT'), gstCategory: 'exempt', tags: ['multigrain', 'sattu', 'health'] },

    // ── Sweets ─────────────────────────────────────────────────────────────────
    { name: 'Odisha Special Badam Ladoo', description: 'Traditional almond (badam) ladoos from Odisha — rich, nutty and melt-in-the-mouth. Made with pure desi ghee.', categoryId: c['sweets-ladoos'], price: p(99), mrp: mrp(99), unit: '12 pcs', stockQuantity: 25, sku: sku('SWT'), isFeatured: true, gstCategory: 'five', tags: ['badam', 'ladoo', 'sweet', 'odia'] },

    // ── Art & Handicrafts ──────────────────────────────────────────────────────
    { name: 'Elephant Palm-Leaf Pattachitra Frame', description: 'Elephant motif semi-hand-painted Pattachitra on palm leaf in a bamboo frame, crafted by artisans from Raghurajpur village. Symbolises wisdom and prosperity. Perfect for home décor or gifting.', categoryId: c['art-handicrafts'], price: p(600), mrp: mrp(600), unit: '11×6 inch', stockQuantity: 15, sku: sku('ART'), isFeatured: true, gstCategory: 'exempt', tags: ['pattachitra', 'palmleaf', 'elephant', 'art'] },
    { name: 'Krishna Leela Tusser Painting', description: 'Krishna Leela (divine play) scene painted on tusser silk — traditional Odia art form, unframed. A beautiful collectible or wall piece.', categoryId: c['art-handicrafts'], price: p(499), mrp: mrp(499), unit: '1 piece', stockQuantity: 10, sku: sku('ART'), gstCategory: 'exempt', tags: ['krishna', 'tusser', 'painting', 'odia'] },
    { name: 'Krishna Rasleela Palm-Leaf Pattachitra', description: 'Krishna Rasleela scene on palm leaf in a bamboo-framed Pattachitra artwork — vibrant, hand-crafted and steeped in tradition.', categoryId: c['art-handicrafts'], price: p(600), mrp: mrp(600), unit: '1 piece', stockQuantity: 10, sku: sku('ART'), gstCategory: 'exempt', tags: ['krishna', 'pattachitra', 'palmleaf'] },
    { name: 'Tini Thakura Palm-Leaf Pattachitra', description: 'Jagannath, Balabhadra and Subhadra (Tini Thakura) depicted on palm leaf in the Pattachitra style. Available in red and green.', categoryId: c['art-handicrafts'], price: p(700), mrp: mrp(700), unit: '1 piece', stockQuantity: 8, sku: sku('ART'), isFeatured: true, gstCategory: 'exempt', tags: ['jagannath', 'pattachitra', 'palmleaf', 'tini thakura'] },

    // ── Puja Items ─────────────────────────────────────────────────────────────
    { name: 'Puja Salita Cotton Wicks', description: 'Traditional hand-rolled cotton wicks for oil lamps (diyas) — clean burning and long lasting.', categoryId: c['puja-religious-items'], price: p(50), mrp: mrp(50), unit: '30g', stockQuantity: 100, sku: sku('PJA'), gstCategory: 'exempt', tags: ['puja', 'wicks', 'diya'] },
    { name: 'Special Pooja Jhuna Incense', description: 'Traditional incense/resin (jhuna/dhuna) used in Odia religious rituals — pure, aromatic and smoke-cleansing.', categoryId: c['puja-religious-items'], price: p(99), mrp: mrp(99), unit: '200g', stockQuantity: 60, sku: sku('PJA'), isFeatured: true, gstCategory: 'exempt', tags: ['puja', 'incense', 'jhuna', 'odia'] },
    { name: 'Thakura Kapada Idol Clothes 6 Pcs', description: 'Assorted colored fabric outfits for deity idols — used in home puja in multiple sizes. Vibrant, devotional and traditionally crafted.', categoryId: c['puja-religious-items'], price: p(99), mrp: mrp(99), unit: '6 pcs', stockQuantity: 40, sku: sku('PJA'), gstCategory: 'exempt', tags: ['puja', 'idol', 'kapada'] },
    { name: 'Bastra for Tini Thakura with Chunri', description: 'Traditional cloth set with chunri for all three deities — Jagannath, Balabhadra and Subhadra. Used in daily puja at home.', categoryId: c['puja-religious-items'], price: p(99), mrp: mrp(99), unit: '1 set', stockQuantity: 35, sku: sku('PJA'), gstCategory: 'exempt', tags: ['jagannath', 'puja', 'bastra', 'chunri'] },

    // ── Textiles ───────────────────────────────────────────────────────────────
    { name: 'Premium Odisha Gamucha', description: 'Traditional Odia woven cotton gamucha (towel), 4-hand-length. Available in beige, blue, orange and white. Lightweight, absorbent and culturally iconic.', categoryId: c['textiles-clothing'], price: p(99), mrp: mrp(99), unit: '1 piece', stockQuantity: 80, sku: sku('TXT'), isFeatured: true, gstCategory: 'exempt', tags: ['gamucha', 'towel', 'odia', 'cotton'] },
    { name: 'Premium White Dhoti Joda Set', description: 'Premium white cotton dhoti-joda set for men — traditional Odia attire for festivals and ceremonies. 5.1 m × 104 cm.', categoryId: c['textiles-clothing'], price: p(299), mrp: mrp(299), unit: '1 set', stockQuantity: 25, sku: sku('TXT'), gstCategory: 'exempt', tags: ['dhoti', 'joda', 'cotton', 'odia'] },
    { name: 'Pure Cotton Hand Towel', description: 'Small pure cotton hand towel in assorted colours — soft, absorbent and everyday essential.', categoryId: c['textiles-clothing'], price: p(39), mrp: mrp(39), unit: '1 piece', stockQuantity: 150, sku: sku('TXT'), gstCategory: 'exempt', tags: ['towel', 'cotton', 'handtowel'] },
  ]
}

// ─── 5. Fetch existing categories ─────────────────────────────────────────────
async function fetchCategories(token) {
  const res = await fetch(`${API}/admin/products/categories/all`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// ─── 6. Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 OwnTown Test Seed — Origins of Odisha\n')

  const token = await getToken()
  console.log('✓ Logged in as admin\n')

  // Try to fetch existing first, create missing ones
  console.log('📂 Ensuring categories exist...')
  let existingCats = await fetchCategories(token)
  const existingSlugs = new Set(existingCats.map(c => c.slug))

  for (const cat of CATEGORIES) {
    if (!existingSlugs.has(cat.slug)) {
      try {
        const created = await createCategory(token, cat)
        existingCats.push(created)
      } catch (e) {
        console.warn(`  ⚠ Could not create: ${cat.name} — ${e.message}`)
      }
    } else {
      console.log(`  ✓ Exists: ${cat.name}`)
    }
  }

  const allCats = await fetchCategories(token)
  console.log(`  Total categories: ${allCats.length}\n`)

  console.log('📦 Creating products...')
  const products = await buildProducts(allCats)

  let ok = 0, skip = 0
  for (const product of products) {
    const result = await createProduct(token, product)
    result ? ok++ : skip++
  }

  console.log(`\n✅ Done! ${ok} products created, ${skip} skipped.`)
  console.log(`   Categories: ${allCats.length}`)
}

main().catch(console.error)
