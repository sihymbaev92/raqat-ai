const categories = [
  { id: "all", title: "Барлығы", icon: "🛒" },
  { id: "milk", title: "Сүт өнімдері", icon: "🥛" },
  { id: "meat", title: "Ет, құс және балық", icon: "🥩" },
  { id: "bakery", title: "Нан және кондитер", icon: "🍞" },
  { id: "drinks", title: "Сусындар", icon: "🧃" },
  { id: "household", title: "Үйге арналған", icon: "🧴" },
  { id: "ready", title: "Дайын тағам", icon: "🍱" },
  { id: "frozen", title: "Мұздатылған", icon: "🧊" },
  { id: "sweets", title: "Тәттілер", icon: "🍫" },
  { id: "baby", title: "Балаларға", icon: "🧸" },
];

const products = [
  { id: 1, title: "Орманшы сүті 3.2%", category: "milk", icon: "🥛", price: 420, oldPrice: null, unit: "1 л", badge: "Таңдау", delivery: "fast", type: "local", popular: 99, rating: 4.8, stock: "Көп", tags: ["Суық тізбек", "Күнделікті"], desc: "Күнделікті қолдануға арналған пастерленген сүт. Суық тізбекпен жеткізіледі." },
  { id: 2, title: "Айран", category: "milk", icon: "🥛", price: 380, oldPrice: 450, unit: "1 л", badge: "-16%", delivery: "fast", type: "local", popular: 96, rating: 4.7, stock: "Көп", tags: ["Суық тізбек", "Дастархан"], desc: "Балғын айран. Салқын қаптамамен жеткізіледі." },
  { id: 3, title: "Қатты ірімшік", category: "milk", icon: "🧀", price: 1890, oldPrice: 2190, unit: "250 г", badge: "-14%", delivery: "today", type: "import", popular: 81, rating: 4.6, stock: "Көп", tags: ["Импорт", "Сэндвич"], desc: "Сэндвич, паста және дастарханға арналған ірімшік. Салқын қаптамамен келеді." },
  { id: 4, title: "Грек йогурты", category: "milk", icon: "🥣", price: 790, oldPrice: 950, unit: "300 г", badge: "-17%", delivery: "fast", type: "local", popular: 78, rating: 4.5, stock: "Көп", tags: ["Protein", "Таңғы ас"], desc: "Қою грек йогурты. Гранола және тәттімен жақсы үйлеседі." },
  { id: 5, title: "Наубайхана наны", category: "bakery", icon: "🍞", price: 420, oldPrice: 480, unit: "дана", badge: "-12%", delivery: "fast", type: "local", popular: 97, rating: 4.7, stock: "Бүгін пісті", tags: ["Ыстық", "Fresh"], desc: "Таңертең пісірілген жұмсақ нан. Қаптама бөлек салынады." },
  { id: 6, title: "Круассан", category: "bakery", icon: "🥐", price: 390, oldPrice: null, unit: "дана", badge: null, delivery: "fast", type: "local", popular: 74, rating: 4.6, stock: "Бүгін пісті", tags: ["Таңғы ас", "Кофеге"], desc: "Қабатты қамырдан пісірілген круассан. Кофемен жақсы үйлеседі." },
  { id: 7, title: "Самса сиыр етімен", category: "bakery", icon: "🥟", price: 520, oldPrice: null, unit: "дана", badge: "Ыстық", delivery: "fast", type: "local", popular: 84, rating: 4.7, stock: "Ыстық", tags: ["Халал", "Тіскебасар"], desc: "Ыстық самса. Жұмысқа, жолға немесе шайға ыңғайлы." },
  { id: 8, title: "Тауық төс еті", category: "meat", icon: "🍗", price: 1690, oldPrice: null, unit: "кг", badge: "Халал", delivery: "fast", type: "local", popular: 91, rating: 4.7, stock: "Көп", tags: ["Диета", "Салқын"], desc: "Жеңіл тағамға, сорпаға және грильге арналған тауық еті. Салқындатылған." },
  { id: 9, title: "Премиум сиыр еті", category: "meat", icon: "🥩", price: 3290, oldPrice: null, unit: "кг", badge: "Халал", delivery: "today", type: "local", popular: 86, rating: 4.8, stock: "Шектеулі", tags: ["Сертификат", "Салқын"], desc: "Сертификатталған жеткізушіден. Курьерге берер алдында салқындатылған күйі тексеріледі." },
  { id: 10, title: "Лосось стейк", category: "meat", icon: "🐟", price: 4890, oldPrice: null, unit: "кг", badge: "Премиум", delivery: "today", type: "import", popular: 69, rating: 4.8, stock: "Шектеулі", tags: ["Омега", "Мұздатылған"], desc: "Балық бөлімі. Мұздатылған қаптамамен, бөлек тасымалданады." },
  { id: 11, title: "Минералды су", category: "drinks", icon: "💧", price: 250, oldPrice: 310, unit: "1 л", badge: "-19%", delivery: "fast", type: "local", popular: 88, rating: 4.5, stock: "Көп", tags: ["Күнделікті", "Қораппен"], desc: "Күнделікті ішуге арналған газсыз минералды су. Қораппен де алуға болады." },
  { id: 12, title: "Табиғи шырын", category: "drinks", icon: "🧃", price: 890, oldPrice: null, unit: "1 л", badge: null, delivery: "fast", type: "local", popular: 73, rating: 4.4, stock: "Көп", tags: ["Қант аз", "Балаларға"], desc: "Қант мөлшері азайтылған табиғи шырын. Балаларға және отбасы дастарханына." },
  { id: 13, title: "Кофе дәні", category: "drinks", icon: "☕", price: 2890, oldPrice: 3290, unit: "250 г", badge: "-12%", delivery: "today", type: "import", popular: 72, rating: 4.7, stock: "Көп", tags: ["Арабика", "Таңғы ас"], desc: "Хош иісті кофе дәні. Үйдегі кофехана сезімін береді." },
  { id: 14, title: "Палау жинағы", category: "ready", icon: "🍛", price: 4990, oldPrice: 5590, unit: "4 адамға", badge: "Жинақ", delivery: "today", type: "local", popular: 87, rating: 4.8, stock: "Дайын", tags: ["Жинақ", "Отбасылық"], desc: "Күріш, ет, май және дәмдеуіштен тұратын дайын палау жинағы." },
  { id: 15, title: "Пицца негізі", category: "ready", icon: "🍕", price: 1290, oldPrice: 1490, unit: "2 дана", badge: "-13%", delivery: "today", type: "local", popular: 70, rating: 4.4, stock: "Көп", tags: ["Кешкі ас", "Тез"], desc: "Үйде тез пицца жасауға арналған дайын негіз." },
  { id: 16, title: "Тұшпара", category: "frozen", icon: "🥟", price: 1790, oldPrice: 2090, unit: "800 г", badge: "-14%", delivery: "today", type: "local", popular: 83, rating: 4.6, stock: "Мұздатылған", tags: ["Халал", "Тез"], desc: "Етті тұшпара. Мұздатылған қаптамамен жеткізіледі." },
  { id: 17, title: "Мұздатылған наггетс", category: "frozen", icon: "🍗", price: 1590, oldPrice: null, unit: "500 г", badge: "Балаларға", delivery: "today", type: "import", popular: 76, rating: 4.4, stock: "Мұздатылған", tags: ["Балаларға", "Тез"], desc: "Балаларға ұнайтын тез дайындалатын наггетс." },
  { id: 18, title: "Балалар печеньесі", category: "baby", icon: "🍪", price: 690, oldPrice: null, unit: "180 г", badge: "Балаларға", delivery: "fast", type: "local", popular: 82, rating: 4.5, stock: "Көп", tags: ["Балаларға", "Тіскебасар"], desc: "Жұмсақ печенье. Мектепке немесе шайға ыңғайлы." },
  { id: 19, title: "Балалар сүті", category: "baby", icon: "🍼", price: 620, oldPrice: null, unit: "200 мл", badge: "Балаларға", delivery: "fast", type: "local", popular: 79, rating: 4.6, stock: "Көп", tags: ["Балаларға", "Суық тізбек"], desc: "Балаларға арналған шағын қаптамадағы сүт." },
  { id: 20, title: "Шоколад плиткасы", category: "sweets", icon: "🍫", price: 590, oldPrice: 690, unit: "90 г", badge: "-14%", delivery: "fast", type: "import", popular: 75, rating: 4.5, stock: "Көп", tags: ["Тәтті", "Шайға"], desc: "Шайға және сыйлыққа арналған шоколад." },
  { id: 21, title: "Печенье ассорти", category: "sweets", icon: "🍪", price: 1290, oldPrice: 1490, unit: "500 г", badge: "-13%", delivery: "fast", type: "local", popular: 73, rating: 4.4, stock: "Көп", tags: ["Тәтті", "Отбасылық"], desc: "Отбасылық шайға арналған печенье ассорти." },
  { id: 22, title: "Ыдыс жуу құралы", category: "household", icon: "🧴", price: 1190, oldPrice: 1390, unit: "500 мл", badge: "-14%", delivery: "today", type: "import", popular: 64, rating: 4.4, stock: "Көп", tags: ["Үйге", "Бөлек қаптама"], desc: "Май мен иісті кетіруге арналған қою формула. Азық-түліктен бөлек қапталады." },
  { id: 23, title: "Кір жуғыш ұнтақ", category: "household", icon: "🧺", price: 2490, oldPrice: 2990, unit: "3 кг", badge: "-17%", delivery: "today", type: "import", popular: 66, rating: 4.3, stock: "Көп", tags: ["Үйге", "Эконом"], desc: "Үйге арналған тауар. Азық-түліктен бөлек пакетке салынады." },
  { id: 24, title: "Қағаз сүлгі", category: "household", icon: "🧻", price: 990, oldPrice: null, unit: "2 орам", badge: null, delivery: "fast", type: "local", popular: 68, rating: 4.3, stock: "Көп", tags: ["Үйге", "Күнделікті"], desc: "Асүйге арналған сіңіргіш қағаз сүлгі." },
];

const promos = [
  { title: "Сүт апталығы", badge: "-20%", icon: "🥛" },
  { title: "Халал ет өнімдері", badge: "-10%", icon: "🥩" },
  { title: "Отбасылық себет", badge: "2+1", icon: "🛒" },
  { title: "Үйге керек", badge: "-15%", icon: "🧴" },
];

const slots = [
  { id: "express", label: "30-45 минут", meta: "Жедел · 900 ₸" },
  { id: "10:00-13:00", label: "10:00-13:00", meta: "4 орын" },
  { id: "16:00-19:00", label: "16:00-19:00", meta: "7 орын" },
  { id: "19:00-22:00", label: "19:00-22:00", meta: "2 орын" },
];

const searchChips = ["сүт", "нан", "тауық", "балаларға", "үйге", "акция", "палау", "тұшпара"];
const reorderIds = [1, 2, 5, 11, 18, 24];
const familyCartIds = [1, 2, 5, 8, 11, 18, 22, 24];

const recipes = [
  { id: "pilaf", title: "Жұма палауы", icon: "🍛", desc: "4 адамға арналған дайын жинақ.", itemIds: [14, 9, 11], chips: ["45 мин", "Отбасылық", "Халал"] },
  { id: "breakfast", title: "Жайлы таңғы ас", icon: "☕", desc: "Кофе, круассан, йогурт және сүт.", itemIds: [1, 4, 6, 13], chips: ["15 мин", "Таңғы ас", "Кофе"] },
  { id: "kids", title: "Балаларға ланч", icon: "🧸", desc: "Сүт, печенье, наггетс және шырын.", itemIds: [12, 17, 18, 19], chips: ["Балаларға", "Тез", "Тіскебасар"] },
];

const state = {
  category: "all",
  query: "",
  sort: "popular",
  promoApplied: false,
  selectedSlot: "10:00-13:00",
  modalProductId: null,
  onlyFavorites: false,
  filters: {
    price: new Set(),
    delivery: new Set(),
    type: new Set(),
  },
  cart: new Map(),
  favorites: new Set(),
  substitution: new Map(),
  notes: new Map(),
};

const formatter = new Intl.NumberFormat("kk-KZ", { maximumFractionDigits: 0 });
const formatPrice = (value) => `${formatter.format(Math.max(0, value))} ₸`;
const $ = (selector) => document.querySelector(selector);
const productById = new Map(products.map((product) => [product.id, product]));
const categoryById = new Map(categories.map((category) => [category.id, category]));
const FREE_DELIVERY_THRESHOLD = 15000;
const WHATSAPP_PHONE = "77000000000";

function productsInCategory(categoryId) {
  return categoryId === "all" ? products.length : products.filter((product) => product.category === categoryId).length;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderSearchSuggestions() {
  $("#searchSuggestions").innerHTML = searchChips
    .map((chip) => `<button type="button" data-search-chip="${chip}">${chip}</button>`)
    .join("");
}

function renderCategoryMenus() {
  const html = categories
    .map(
      (category) => `
        <button type="button" data-category="${category.id}">
          <span>${category.icon}</span>
          <strong>${category.title}</strong>
          <small>${productsInCategory(category.id)}</small>
        </button>
      `
    )
    .join("");
  $("#categoryMenu").innerHTML = html;
  $("#mobileCategoryRow").innerHTML = html;
}

function renderSlots() {
  $("#slotPills").innerHTML = slots
    .map(
      (slot) => `
        <button type="button" data-slot="${slot.id}" class="${slot.id === state.selectedSlot ? "is-active" : ""}">
          <span>${slot.label}</span><small>${slot.meta}</small>
        </button>
      `
    )
    .join("");
}

function renderPromos() {
  $("#miniPromos").innerHTML = promos
    .slice(0, 3)
    .map(
      (promo) => `
        <article class="mini-promo">
          <span>${promo.badge}</span>
          <strong>${promo.title}</strong>
          <small>${promo.icon} бүгін қолжетімді</small>
        </article>
      `
    )
    .join("");

  $("#promoRow").innerHTML = promos
    .map(
      (promo) => `
        <article class="promo-card">
          <em>${promo.badge}</em>
          <strong>${promo.title}</strong>
          <span>${promo.icon}</span>
        </article>
      `
    )
    .join("");
}

function renderReorder() {
  $("#reorderRow").innerHTML = reorderIds
    .map((id) => {
      const product = productById.get(id);
      return `
        <article class="reorder-card">
          <span class="icon">${product.icon}</span>
          <strong>${product.title}</strong>
          <small>${formatPrice(product.price)} · бұрын жиі алынған</small>
          <button type="button" data-add="${product.id}">Қосу</button>
        </article>
      `;
    })
    .join("");
}

function renderRecipes() {
  $("#recipeGrid").innerHTML = recipes
    .map(
      (recipe) => `
        <article class="recipe-card" data-icon="${recipe.icon}">
          <p class="eyebrow">Жинақ</p>
          <strong>${recipe.title}</strong>
          <small>${recipe.desc}</small>
          <ul>${recipe.chips.map((chip) => `<li>${chip}</li>`).join("")}</ul>
          <button type="button" data-bundle="${recipe.id}">Жинақты қосу</button>
        </article>
      `
    )
    .join("");
}

function recommendedProducts(limit = 6) {
  const cartCategories = new Set(Array.from(state.cart.keys()).map((id) => productById.get(id)?.category));
  return products
    .filter((product) => !state.cart.has(product.id))
    .map((product) => ({
      product,
      score:
        product.popular +
        (cartCategories.has(product.category) ? 20 : 0) +
        (product.oldPrice ? 10 : 0) +
        (product.delivery === "fast" ? 6 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

function renderPersonalRail() {
  $("#personalRail").innerHTML = recommendedProducts(8)
    .map(
      (product) => `
        <article class="personal-card">
          <span class="icon">${product.icon}</span>
          <strong>${product.title}</strong>
          <small>Ұсыныс: ${product.tags[0]} · ${formatPrice(product.price)}</small>
          <button type="button" data-add="${product.id}">Қосу</button>
        </article>
      `
    )
    .join("");
}

function matchesFilter(product) {
  const { price, delivery, type } = state.filters;
  const priceOk =
    price.size === 0 ||
    (price.has("deal") && product.oldPrice != null) ||
    (price.has("low") && product.price <= 1000);
  const deliveryOk = delivery.size === 0 || delivery.has(product.delivery);
  const typeOk = type.size === 0 || type.has(product.type);
  return priceOk && deliveryOk && typeOk;
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  const items = products.filter((product) => {
    const categoryOk = state.category === "all" || product.category === state.category;
    const queryOk =
      !query ||
      product.title.toLowerCase().includes(query) ||
      product.tags.some((tag) => tag.toLowerCase().includes(query));
    const favoriteOk = !state.onlyFavorites || state.favorites.has(product.id);
    return categoryOk && queryOk && favoriteOk && matchesFilter(product);
  });

  if (state.sort === "cheap") return [...items].sort((a, b) => a.price - b.price);
  if (state.sort === "expensive") return [...items].sort((a, b) => b.price - a.price);
  return [...items].sort((a, b) => b.popular - a.popular);
}

function renderProducts() {
  const items = filteredProducts();
  $("#emptyState").hidden = items.length > 0;
  $("#activeCategoryLabel").textContent = state.onlyFavorites
    ? "Таңдаулы"
    : categoryById.get(state.category)?.title ?? "Барлық категория";

  $("#productGrid").innerHTML = items
    .map((product) => {
      const favorite = state.favorites.has(product.id);
      const qty = state.cart.get(product.id) ?? 0;
      return `
        <article class="product-card">
          ${product.badge ? `<span class="badge">${product.badge}</span>` : ""}
          <button class="favorite-button ${favorite ? "is-active" : ""}" type="button" data-favorite="${product.id}" aria-label="Таңдаулы">${favorite ? "♥" : "♡"}</button>
          <button class="product-image" type="button" data-detail="${product.id}">${product.icon}</button>
          <h3>${product.title}</h3>
          <span class="product-meta">★ ${product.rating} · ${product.stock} · ${
        product.delivery === "fast" ? "30 минут" : "Бүгін"
      }</span>
          <div class="product-tags">${product.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
          <div class="price-row">
            <strong class="price">${formatPrice(product.price)}</strong>
            ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ""}
          </div>
          <div class="qty-row">
            <span class="qty-pill">${product.unit}</span>
            ${
              qty > 0
                ? `<div class="inline-qty"><button type="button" data-dec="${product.id}">−</button><span>${qty}</span><button type="button" data-inc="${product.id}">+</button></div>`
                : `<button class="add-button" type="button" data-add="${product.id}">Себетке</button>`
            }
          </div>
          <div class="product-actions">
            <button class="details-button" type="button" data-detail="${product.id}">Толығырақ</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateActiveCategory() {
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("is-active", !state.onlyFavorites && button.dataset.category === state.category);
  });
}

function updateFavoriteCount() {
  $("#favoriteCount").textContent = String(state.favorites.size);
}

function addToCart(id, qty = 1) {
  const product = productById.get(id);
  if (!product) return;
  state.cart.set(id, (state.cart.get(id) ?? 0) + qty);
  renderCart();
  renderProducts();
  renderPersonalRail();
  showToast(`${product.title} себетке қосылды`);
}

function setCartQty(id, qty) {
  if (qty <= 0) state.cart.delete(id);
  else state.cart.set(id, qty);
  renderCart();
  renderProducts();
  renderPersonalRail();
}

function addMany(ids) {
  ids.forEach((id) => state.cart.set(id, (state.cart.get(id) ?? 0) + 1));
  renderCart();
  renderProducts();
  renderPersonalRail();
}

function cartSummary() {
  const subtotal = Array.from(state.cart.entries()).reduce((sum, [id, qty]) => {
    const product = productById.get(id);
    return sum + (product?.price ?? 0) * qty;
  }, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : state.selectedSlot === "express" ? 1200 : 900;
  const discount = state.promoApplied ? Math.round(subtotal * 0.1) : 0;
  const bonus = Math.round(subtotal * 0.01);
  return { subtotal, delivery, discount, total: subtotal + delivery - discount, bonus };
}

function renderCartRecommendations() {
  const recs = recommendedProducts(3);
  $("#cartRecommendations").innerHTML = recs.length
    ? recs
        .map(
          (product) => `
            <div class="cart-rec">
              <span>${product.icon}</span>
              <div><strong>${product.title}</strong><br /><small>${formatPrice(product.price)} · себетке сай</small></div>
              <button type="button" data-add="${product.id}">+</button>
            </div>
          `
        )
        .join("")
    : "";
}

function renderFreeDelivery(summary) {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - summary.subtotal);
  const percent = Math.min(100, Math.round((summary.subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  $("#freeDeliveryMeter").style.width = `${percent}%`;
  $("#freeDeliveryPercent").textContent = `${percent}%`;
  $("#freeDeliveryText").textContent = remaining === 0 ? "Тегін жеткізу ашылды" : `Тегін жеткізуге дейін ${formatPrice(remaining)}`;
}

function renderCart() {
  const totalCount = Array.from(state.cart.values()).reduce((sum, qty) => sum + qty, 0);
  const summary = cartSummary();
  $("#cartCount").textContent = String(totalCount);
  $("#itemsSubtotal").textContent = formatPrice(summary.subtotal);
  $("#deliveryFee").textContent = summary.delivery === 0 ? "Тегін" : formatPrice(summary.delivery);
  $("#discountTotal").textContent = summary.discount > 0 ? `-${formatPrice(summary.discount)}` : "0 ₸";
  $("#cartTotal").textContent = formatPrice(summary.total);
  renderFreeDelivery(summary);
  renderCartRecommendations();

  const rows = Array.from(state.cart.entries())
    .map(([id, qty]) => {
      const product = productById.get(id);
      if (!product) return "";
      const pref = state.substitution.get(id) ?? "similar";
      return `
        <div class="cart-row">
          <div>
            <strong>${product.icon} ${product.title}</strong>
            <br />
            <small>${formatPrice(product.price)} · ${product.unit} · бонус ${Math.round(product.price * qty * 0.01)}</small>
          </div>
          <div class="cart-qty">
            <button type="button" data-cart-dec="${product.id}">−</button>
            <strong>${qty}</strong>
            <button type="button" data-cart-inc="${product.id}">+</button>
          </div>
          <div class="cart-substitution">
            <label>
              Алмастыру ережесі
              <select data-substitution="${product.id}">
                <option value="similar" ${pref === "similar" ? "selected" : ""}>Ұқсас тауар ұсын</option>
                <option value="refund" ${pref === "refund" ? "selected" : ""}>Жоқ болса алып таста</option>
                <option value="contact" ${pref === "contact" ? "selected" : ""}>Алдымен хабарлас</option>
              </select>
            </label>
            <label>
              Сатып алушыға ескерту
              <input data-note="${product.id}" value="${state.notes.get(id) ?? ""}" placeholder="Мысалы: майсыз ет, жаңа піскен нан, салқын сүт..." />
            </label>
          </div>
        </div>
      `;
    })
    .join("");
  $("#cartItems").innerHTML = rows || `<p class="empty-state">Себет бос.</p>`;
}

function openProductModal(id) {
  const product = productById.get(id);
  if (!product) return;
  state.modalProductId = id;
  $("#modalProductIcon").textContent = product.icon;
  $("#modalProductCategory").textContent = categoryById.get(product.category)?.title ?? "Тауар";
  $("#modalProductTitle").textContent = product.title;
  $("#modalProductDescription").textContent = product.desc;
  $("#modalProductDelivery").textContent = product.delivery === "fast" ? "30 минут жеткізу" : "Бүгін жеткізу";
  $("#modalProductUnit").textContent = `${product.unit} · ★ ${product.rating}`;
  $("#modalProductPrice").textContent = formatPrice(product.price);
  $("#modalProductOldPrice").textContent = product.oldPrice ? formatPrice(product.oldPrice) : "";
  $("#modalFavorite").textContent = state.favorites.has(id) ? "♥ Таңдаулы" : "♡ Таңдаулы";
  $("#productModal").classList.add("is-open");
}

function closeProductModal() {
  state.modalProductId = null;
  $("#productModal").classList.remove("is-open");
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  updateFavoriteCount();
  renderProducts();
  if (state.modalProductId === id) openProductModal(id);
}

function buildWhatsAppOrderText() {
  const summary = cartSummary();
  const lines = ["Тимур супермаркет тапсырысы", ""];
  Array.from(state.cart.entries()).forEach(([id, qty]) => {
    const product = productById.get(id);
    if (!product) return;
    const pref = state.substitution.get(id) ?? "similar";
    const note = state.notes.get(id)?.trim();
    const prefLabel =
      pref === "refund" ? "жоқ болса алып таста" : pref === "contact" ? "алдымен хабарлас" : "ұқсас тауар ұсын";
    lines.push(`- ${product.title} x${qty} = ${formatPrice(product.price * qty)} (${prefLabel})`);
    if (note) lines.push(`  Ескерту: ${note}`);
  });
  const slot = slots.find((item) => item.id === state.selectedSlot)?.label ?? $("#slotSelect").value;
  const address = $("#addressInput").value.trim() || "мекенжай кейін беріледі";
  const payment = $("#paymentSelect").selectedOptions[0]?.textContent ?? "Төлем түрі";
  lines.push("");
  lines.push(`Жеткізу: ${slot}`);
  lines.push(`Мекенжай: ${address}`);
  lines.push(`Төлем: ${payment}`);
  lines.push(`Тауарлар: ${formatPrice(summary.subtotal)}`);
  lines.push(`Жеткізу ақысы: ${summary.delivery === 0 ? "тегін" : formatPrice(summary.delivery)}`);
  if (summary.discount > 0) lines.push(`Жеңілдік: -${formatPrice(summary.discount)}`);
  lines.push(`Барлығы: ${formatPrice(summary.total)}`);
  return lines.join("\n");
}

function sendCartToWhatsApp() {
  if (state.cart.size === 0) {
    showToast("Алдымен себетке тауар қосыңыз");
    return;
  }
  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(buildWhatsAppOrderText())}`;
  window.open(url, "_blank", "noopener");
}

function validateCheckout() {
  if (state.cart.size === 0) {
    showToast("Алдымен себетке тауар қосыңыз");
    return;
  }
  const address = $("#addressInput").value.trim();
  if (address.length < 6) {
    showToast("Жеткізу мекенжайын енгізіңіз");
    $("#addressInput").focus();
    return;
  }
  const slot = slots.find((item) => item.id === state.selectedSlot)?.label ?? $("#slotSelect").value;
  const payment = $("#paymentSelect").selectedOptions[0]?.textContent ?? "Төлем";
  showToast(`Тапсырыс қабылданды: ${slot}, ${payment}`);
}

function resetFilters() {
  Object.values(state.filters).forEach((set) => set.clear());
  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.checked = false;
  });
  state.query = "";
  state.category = "all";
  state.onlyFavorites = false;
  state.sort = "popular";
  $("#searchInput").value = "";
  $("#sortSelect").value = "popular";
  updateActiveCategory();
  renderProducts();
}

function openCart() {
  $("#cartDrawer").classList.add("is-open");
}

function bindEvents() {
  document.body.addEventListener("click", (event) => {
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      state.category = categoryButton.dataset.category;
      state.onlyFavorites = false;
      updateActiveCategory();
      renderProducts();
      $("#catalogSidebar").classList.remove("is-open");
    }

    const searchChip = event.target.closest("[data-search-chip]");
    if (searchChip) {
      state.query = searchChip.dataset.searchChip;
      $("#searchInput").value = state.query;
      renderProducts();
      document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
    }

    const slotButton = event.target.closest("[data-slot]");
    if (slotButton) {
      state.selectedSlot = slotButton.dataset.slot;
      $("#slotSelect").value = state.selectedSlot === "express" ? "10:00-13:00" : state.selectedSlot;
      renderSlots();
      renderCart();
      showToast(`${slotButton.textContent.trim()} таңдалды`);
    }

    const addButton = event.target.closest("[data-add]");
    if (addButton) addToCart(Number(addButton.dataset.add));

    const incButton = event.target.closest("[data-inc]");
    if (incButton) setCartQty(Number(incButton.dataset.inc), (state.cart.get(Number(incButton.dataset.inc)) ?? 0) + 1);

    const decButton = event.target.closest("[data-dec]");
    if (decButton) setCartQty(Number(decButton.dataset.dec), (state.cart.get(Number(decButton.dataset.dec)) ?? 0) - 1);

    const detailButton = event.target.closest("[data-detail]");
    if (detailButton) openProductModal(Number(detailButton.dataset.detail));

    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) toggleFavorite(Number(favoriteButton.dataset.favorite));

    const cartIncButton = event.target.closest("[data-cart-inc]");
    if (cartIncButton) {
      const id = Number(cartIncButton.dataset.cartInc);
      setCartQty(id, (state.cart.get(id) ?? 0) + 1);
    }

    const cartDecButton = event.target.closest("[data-cart-dec]");
    if (cartDecButton) {
      const id = Number(cartDecButton.dataset.cartDec);
      setCartQty(id, (state.cart.get(id) ?? 0) - 1);
    }

    const bundleButton = event.target.closest("[data-bundle]");
    if (bundleButton) {
      const recipe = recipes.find((item) => item.id === bundleButton.dataset.bundle);
      if (!recipe) return;
      addMany(recipe.itemIds);
      openCart();
      showToast(`${recipe.title} жинағы қосылды`);
    }
  });

  document.body.addEventListener("change", (event) => {
    const input = event.target;
    if (input.matches("[data-filter]")) {
      const bucket = state.filters[input.dataset.filter];
      if (!bucket) return;
      if (input.checked) bucket.add(input.value);
      else bucket.delete(input.value);
      renderProducts();
    }

    if (input.matches("[data-substitution]")) {
      state.substitution.set(Number(input.dataset.substitution), input.value);
      showToast("Алмастыру таңдауы сақталды");
    }
  });

  document.body.addEventListener("input", (event) => {
    const input = event.target;
    if (input.matches("[data-note]")) state.notes.set(Number(input.dataset.note), input.value);
  });

  $("#catalogToggle").addEventListener("click", () => $("#catalogSidebar").classList.add("is-open"));
  $("#closeCatalog").addEventListener("click", () => $("#catalogSidebar").classList.remove("is-open"));
  $("#cartButton").addEventListener("click", openCart);
  $("#mobileCartButton").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", () => $("#cartDrawer").classList.remove("is-open"));
  $("#closeProductModal").addEventListener("click", closeProductModal);

  $("#productModal").addEventListener("click", (event) => {
    if (event.target.id === "productModal") closeProductModal();
  });

  $("#cartDrawer").addEventListener("click", (event) => {
    if (event.target.id === "cartDrawer") event.currentTarget.classList.remove("is-open");
  });

  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    renderProducts();
  });

  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    state.onlyFavorites = false;
    renderProducts();
  });

  $("#sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  $("#resetFilters").addEventListener("click", resetFilters);

  $("#applyPromo").addEventListener("click", () => {
    const code = $("#promoCode").value.trim().toUpperCase();
    if (code !== "ТИМУР10" && code !== "TIMUR10") {
      showToast("Промокод табылмады");
      return;
    }
    state.promoApplied = true;
    renderCart();
    showToast("ТИМУР10 промокоды қолданылды");
  });

  $("#modalAddToCart").addEventListener("click", () => {
    if (state.modalProductId != null) addToCart(state.modalProductId);
  });

  $("#modalFavorite").addEventListener("click", () => {
    if (state.modalProductId != null) toggleFavorite(state.modalProductId);
  });

  $("#checkoutButton").addEventListener("click", validateCheckout);
  $("#whatsappButton").addEventListener("click", sendCartToWhatsApp);
  $("#fillFamilyCart").addEventListener("click", () => {
    addMany(familyCartIds);
    openCart();
    showToast("Отбасылық себет қосылды");
  });
  $("#heroFillCart").addEventListener("click", () => {
    addMany([1, 5, 6, 13, 18, 20]);
    openCart();
    showToast("15 минуттық себет дайын");
  });
  $("#addReorder").addEventListener("click", () => {
    addMany(reorderIds);
    openCart();
    showToast("Қайта алу себеті қосылды");
  });

  $("#favoritesButton").addEventListener("click", () => {
    if (state.favorites.size === 0) {
      showToast("Таңдаулыда әзірге тауар жоқ");
      return;
    }
    state.onlyFavorites = true;
    state.category = "all";
    state.query = "";
    $("#searchInput").value = "";
    updateActiveCategory();
    renderProducts();
    document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  });
}

renderSearchSuggestions();
renderCategoryMenus();
renderSlots();
renderPromos();
renderReorder();
renderRecipes();
updateActiveCategory();
updateFavoriteCount();
renderPersonalRail();
renderProducts();
renderCart();
bindEvents();
