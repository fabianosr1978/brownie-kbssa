const CHART_COLORS = [
  '#b05f2e', '#3d8a5e', '#2e6db0', '#b08a2e', '#8e2eb0',
  '#2eb08a', '#b02e6d', '#2e4eb0', '#6db02e', '#b04a2e',
];

const SUPABASE_URL = 'https://qykywggmsnbavpdpwxvs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v6madC5lhwPQUK6gZ_hE4g_FSPoOqjQ';
let supabaseClient;

function productToDb(p) {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    supplier: p.supplier,
    package_qty: p.packageQty,
    unit: p.unit,
    unit_price: p.unitPrice,
    recipe: p.recipe || null,
  };
}

function dbToProduct(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    supplier: row.supplier,
    packageQty: row.package_qty,
    unit: row.unit,
    unitPrice: row.unit_price,
    recipe: row.recipe || undefined,
  };
}

async function loadProducts() {
  const { data, error } = await supabaseClient.from('produtos').select('*');
  if (error) { console.error('Erro ao carregar produtos:', error); return []; }
  return (data || []).map(dbToProduct);
}

async function saveProductToDb(product) {
  const { error } = await supabaseClient.from('produtos').upsert(productToDb(product));
  if (error) { console.error('Erro ao salvar produto:', error); alert('Erro ao salvar produto no banco de dados.'); }
}

async function deleteProductFromDb(id) {
  const { error } = await supabaseClient.from('produtos').delete().eq('id', id);
  if (error) { console.error('Erro ao excluir produto:', error); alert('Erro ao excluir produto.'); }
}

const storageKeys = {
  products: 'brownie_products',
  purchases: 'brownie_purchases',
  sales: 'brownie_sales',
  inventory: 'brownie_inventory',
  ingredients: 'brownie_ingredients',
  inventoryHistory: 'brownie_inventory_history',
  clients: 'brownie_clients',
};

const state = {
  products: [],
  purchases: [],
  sales: [],
  inventory: [],
  ingredients: [],
  inventoryHistory: [],
  clients: [],
};

let currentProductEditId = null;
let currentRecipeProductId = null;

const elements = {
  recipeForm: document.getElementById('recipeForm'),
  addIngredientRow: document.getElementById('addIngredientRow'),
  recipeIngredientsTable: document.querySelector('#recipeIngredientsTable tbody'),
  recipeTotalCost: document.getElementById('recipeTotalCost'),
  recipeUnitCost: document.getElementById('recipeUnitCost'),
  recipeProduct: document.getElementById('recipeProduct'),
  loadBaseRecipeBtn: document.getElementById('loadBaseRecipeBtn'),
  recipeProductsTable: document.querySelector('#recipeProductsTable tbody'),
  productId: document.getElementById('productId'),
  productForm: document.getElementById('productForm'),
  productsTable: document.querySelector('#productsTable tbody'),
  purchaseForm: document.getElementById('purchaseForm'),
  purchasesTable: document.querySelector('#purchasesTable tbody'),
  salesForm: document.getElementById('salesForm'),
  salesTable: document.querySelector('#salesTable tbody'),
  inventoryCountTable: document.querySelector('#inventoryCountTable tbody'),
  inventoryTable: document.querySelector('#inventoryTable tbody'),
  inventoryHistoryTable: document.querySelector('#inventoryHistoryTable tbody'),
  inventoryDate: document.getElementById('inventoryDate'),
  inventoryTypeFilter: document.getElementById('inventoryTypeFilter'),
  saveInventoryCountBtn: document.getElementById('saveInventoryCountBtn'),
  purchaseProduct: document.getElementById('purchaseProduct'),
  saleProduct: document.getElementById('saleProduct'),
  saleQuantity: document.getElementById('saleQuantity'),
  saleUnitPrice: document.getElementById('saleUnitPrice'),
  saleTotal: document.getElementById('saleTotal'),
  dashboardSalesTotal: document.getElementById('dashboardSalesTotal'),
  dashboardSalesCount: document.getElementById('dashboardSalesCount'),
  dashboardPurchaseTotal: document.getElementById('dashboardPurchaseTotal'),
  productSalesTable: document.querySelector('#productSalesTable tbody'),
  clientSalesTable: document.querySelector('#clientSalesTable tbody'),
  chartYear: document.getElementById('chartYear'),
  monthlySalesChart: document.getElementById('monthlySalesChart'),
  chartLegend: document.getElementById('chartLegend'),
  navButtons: document.querySelectorAll('.side-nav button'),
  clientForm: document.getElementById('clientForm'),
  clientsTable: document.querySelector('#clientsTable tbody'),
  saleClient: document.getElementById('saleClient'),
};

function loadData(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatMoney(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function updateProductOptions() {
  // Compras: apenas insumos
  elements.purchaseProduct.innerHTML = '<option value="">Selecione um produto</option>';
  state.products.filter(p => p.type === 'insumo').forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    elements.purchaseProduct.appendChild(option);
  });

  // Vendas: apenas itens de venda
  const currentSale = elements.saleProduct.value;
  elements.saleProduct.innerHTML = '<option value="">Selecione um produto</option>';
  state.products.filter(p => p.type === 'venda').forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    elements.saleProduct.appendChild(option);
  });
  elements.saleProduct.value = currentSale;

  // Ficha tecnica: apenas itens de venda
  const currentRecipe = elements.recipeProduct.value;
  elements.recipeProduct.innerHTML = '<option value="">Selecione um produto</option>';
  state.products.filter(p => p.type === 'venda').forEach(product => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    elements.recipeProduct.appendChild(option);
  });
  elements.recipeProduct.value = currentRecipe;

  updateIngredientSelects();
}

function updateIngredientSelects() {
  document.querySelectorAll('.ingredient-name').forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecione um insumo</option>';
    state.products.forEach(product => {
      if (product.type === 'insumo') {
        const option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name;
        select.appendChild(option);
      }
    });
    select.value = currentValue;
  });
}

function renderProducts() {
  elements.productsTable.innerHTML = '';
  state.products.forEach(product => {
    const row = document.createElement('tr');
    const typeLabel = product.type === 'venda' ? 'Item de Venda' : product.type === 'insumo' ? 'Insumos' : '-';
    row.innerHTML = `
      <td>${typeLabel}</td>
      <td>${product.name}</td>
      <td>${product.supplier || '-'}</td>
      <td>${product.packageQty ?? '-'}</td>
      <td>${product.unit || '-'}</td>
      <td>${formatMoney(product.unitPrice)}</td>
      <td>
        <button type="button" class="btn-secondary edit-product-btn" data-id="${product.id}">Editar</button>
        <button type="button" class="btn-secondary delete-product-btn" data-id="${product.id}">Excluir</button>
      </td>
    `;
    row.querySelector('.edit-product-btn').addEventListener('click', () => {
      startProductEdit(product.id);
    });
    row.querySelector('.delete-product-btn').addEventListener('click', () => {
      deleteProduct(product.id);
    });
    elements.productsTable.appendChild(row);
  });
}

function renderRecipeProducts() {
  elements.recipeProductsTable.innerHTML = '';
  state.products.forEach(product => {
    if (product.recipe) {
      const row = document.createElement('tr');
      const unitCost = product.recipe.unitCost || 0;
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${formatMoney(unitCost)}</td>
        <td><button type="button" class="btn-secondary edit-recipe-btn" data-id="${product.id}">Editar</button></td>
      `;
      row.querySelector('.edit-recipe-btn').addEventListener('click', () => {
        populateRecipeForm(product);
        // scroll to form
        document.getElementById('fichaPanel').scrollIntoView({ behavior: 'smooth' });
      });
      elements.recipeProductsTable.appendChild(row);
    }
  });
}

async function deleteProduct(id) {
  if (!confirm('Excluir este produto?')) return;
  await deleteProductFromDb(id);
  state.products = state.products.filter(p => p.id !== id);
  renderAll();
}

function renderPurchases() {
  elements.purchasesTable.innerHTML = '';
  state.purchases.forEach(purchase => {
    const product = state.products.find(p => p.id === purchase.productId);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${purchase.date}</td>
      <td>${product ? product.name : 'Produto removido'}</td>
      <td>${purchase.quantity}</td>
      <td>${formatMoney(purchase.unitValue)}</td>
      <td>${formatMoney(purchase.quantity * purchase.unitValue)}</td>
      <td>${purchase.location}</td>
      <td><button type="button" class="btn-secondary" data-purchase-id="${purchase.id}">Excluir</button></td>
    `;
    row.querySelector('button').addEventListener('click', () => deletePurchase(purchase.id));
    elements.purchasesTable.appendChild(row);
  });
}

function deletePurchase(id) {
  state.purchases = state.purchases.filter(purchase => purchase.id !== id);
  saveData(storageKeys.purchases, state.purchases);
  renderAll();
}

function renderSales() {
  elements.salesTable.innerHTML = '';
  state.sales.forEach(sale => {
    const product = state.products.find(p => p.id === sale.productId);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${sale.date}</td>
      <td>${sale.client}</td>
      <td>${product ? product.name : 'Produto removido'}</td>
      <td>${sale.quantity}</td>
      <td>${formatMoney(sale.unitPrice)}</td>
      <td>${formatMoney(sale.total)}</td>
      <td><button type="button" class="btn-secondary delete-sale-btn" data-id="${sale.id}">Excluir</button></td>
    `;
    row.querySelector('.delete-sale-btn').addEventListener('click', () => {
      deleteSale(sale.id);
    });
    elements.salesTable.appendChild(row);
  });
}

function deleteSale(saleId) {
  state.sales = state.sales.filter(sale => sale.id !== saleId);
  saveData(storageKeys.sales, state.sales);
  renderAll();
}

function renderInventory() {
  elements.inventoryTable.innerHTML = '';
  const filterType = elements.inventoryTypeFilter?.value || '';

  const latestCount = {};

  const keyFor = entry => entry.type === 'product' ? `product:${entry.itemId}` : `ingredient:${entry.itemName}`;

  state.inventoryHistory.forEach(entry => {
    if (entry.source !== 'sale-deduction' && entry.source !== 'purchase') {
      latestCount[keyFor(entry)] = { quantity: entry.quantity, date: entry.date };
    }
  });

  const comprasSince = (productId, sinceDate) => state.purchases
    .filter(p => p.productId === productId && (!sinceDate || p.date >= sinceDate))
    .reduce((sum, p) => sum + p.quantity, 0);

  const consumoSince = (ingredientName, sinceDate) => {
    let total = 0;
    state.sales.forEach(sale => {
      if (sinceDate && sale.date < sinceDate) return;
      const product = state.products.find(p => p.id === sale.productId);
      if (!product?.recipe?.ingredients || !product.recipe.yieldUnits) return;
      const ingredient = product.recipe.ingredients.find(i => i.name === ingredientName);
      if (!ingredient) return;
      total += (ingredient.recipeQty / product.recipe.yieldUnits) * sale.quantity;
    });
    return total;
  };

  const renderRow = (product, key, typeLabel, isIngredient) => {
    const count = latestCount[key];
    const lastCountValue = count ? count.quantity : 0;
    const compras = comprasSince(product.id, count?.date);
    const consumo = isIngredient ? consumoSince(product.name, count?.date) : 0;
    const totalQty = Number((lastCountValue + compras).toFixed(2));
    const saldoQty = Number((totalQty - consumo).toFixed(2));
    const isNegative = saldoQty < 0;
    const unitCost = product.packageQty ? product.unitPrice / product.packageQty : 0;
    const valorEstoque = formatMoney(Math.max(saldoQty, 0) * unitCost);

    const row = document.createElement('tr');
    if (isNegative) row.classList.add('saldo-negativo');
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${typeLabel}</td>
      <td>${product.unit || '-'}</td>
      <td><input type="number" class="inventory-count-inline" step="0.01" min="0" placeholder="-" value="${count ? count.quantity : ''}" /></td>
      <td>${compras}</td>
      <td>${totalQty}</td>
      <td>${saldoQty}${isNegative ? ' ⚠️' : ''}</td>
      <td>${isNegative ? '—' : valorEstoque}</td>
    `;

    const input = row.querySelector('.inventory-count-inline');
    input.addEventListener('change', () => {
      const newQty = Number(input.value);
      if (input.value === '' || isNaN(newQty) || newQty < 0) return;
      const today = new Date().toISOString().split('T')[0];
      const type = product.type === 'venda' ? 'product' : 'ingredient';
      state.inventoryHistory.push({
        id: crypto.randomUUID(),
        date: today,
        type,
        itemId: type === 'product' ? product.id : undefined,
        itemName: type === 'ingredient' ? product.name : undefined,
        quantity: newQty,
        source: 'count',
      });
      saveData(storageKeys.inventoryHistory, state.inventoryHistory);
      renderAll();
    });

    elements.inventoryTable.appendChild(row);
  };

  if (!filterType || filterType === 'venda') {
    state.products.filter(product => product.type === 'venda').forEach(product => {
      renderRow(product, `product:${product.id}`, 'Item de Venda', false);
    });
  }

  if (!filterType || filterType === 'insumo') {
    state.products.filter(product => product.type === 'insumo').forEach(product => {
      renderRow(product, `ingredient:${product.name}`, 'Insumos', true);
    });
  }
}

function renderInventoryHistory() {
  elements.inventoryHistoryTable.innerHTML = '';

  const countEntries = state.inventoryHistory.filter(entry => entry.source !== 'sale-deduction' && entry.source !== 'purchase');

  const groups = {};
  countEntries.forEach(entry => {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry);
  });

  const chronoDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));
  const countNumbers = {};
  chronoDates.forEach((date, idx) => {
    countNumbers[date] = idx + 1;
  });

  const displayDates = [...chronoDates].sort((a, b) => new Date(b) - new Date(a));

  displayDates.forEach(date => {
    const entries = groups[date];

    const summaryRow = document.createElement('tr');
    summaryRow.className = 'history-summary-row';
    summaryRow.innerHTML = `
      <td>${date}</td>
      <td>Contagem nº ${countNumbers[date]}</td>
      <td>${entries.length} ${entries.length === 1 ? 'item' : 'itens'}</td>
      <td class="history-actions">
        <button type="button" class="btn-secondary toggle-history-btn">Ver itens</button>
        <button type="button" class="btn-secondary delete-history-btn">Excluir</button>
      </td>
    `;

    const detailRow = document.createElement('tr');
    detailRow.className = 'history-detail-row';
    detailRow.style.display = 'none';
    const detailCell = document.createElement('td');
    detailCell.colSpan = 4;

    const detailTable = document.createElement('table');
    detailTable.className = 'history-detail-table';
    const detailRows = entries.map(entry => {
      const isProduct = entry.type === 'product';
      const product = isProduct
        ? state.products.find(p => p.id === entry.itemId)
        : state.products.find(p => p.type === 'insumo' && p.name === entry.itemName);
      const name = isProduct ? (product?.name || 'Produto removido') : entry.itemName;
      const typeLabel = isProduct ? 'Item de Venda' : 'Insumos';
      return `
        <tr>
          <td>${name}</td>
          <td>${typeLabel}</td>
          <td>${product?.unit || '-'}</td>
          <td>${entry.quantity}</td>
        </tr>
      `;
    }).join('');
    detailTable.innerHTML = `
      <thead>
        <tr>
          <th>Item</th>
          <th>Tipo</th>
          <th>Unidade</th>
          <th>Quantidade</th>
        </tr>
      </thead>
      <tbody>${detailRows}</tbody>
    `;
    detailCell.appendChild(detailTable);
    detailRow.appendChild(detailCell);

    const toggleBtn = summaryRow.querySelector('.toggle-history-btn');
    toggleBtn.addEventListener('click', () => {
      const isHidden = detailRow.style.display === 'none';
      detailRow.style.display = isHidden ? 'table-row' : 'none';
      toggleBtn.textContent = isHidden ? 'Ocultar itens' : 'Ver itens';
    });

    summaryRow.querySelector('.delete-history-btn').addEventListener('click', () => {
      if (!confirm(`Excluir a Contagem nº ${countNumbers[date]} (${date})?`)) return;
      deleteInventoryCount(date);
    });

    elements.inventoryHistoryTable.appendChild(summaryRow);
    elements.inventoryHistoryTable.appendChild(detailRow);
  });
}

function deleteInventoryCount(date) {
  state.inventoryHistory = state.inventoryHistory.filter(
    entry => !(entry.date === date && entry.source !== 'sale-deduction')
  );
  saveData(storageKeys.inventoryHistory, state.inventoryHistory);
  renderAll();
}

function populateChartYears() {
  const sel = elements.chartYear;
  if (!sel) return;
  const prev = sel.value ? parseInt(sel.value) : null;
  const years = new Set([new Date().getFullYear()]);
  state.sales.forEach(s => {
    const y = parseInt(s.date?.substring(0, 4));
    if (!isNaN(y)) years.add(y);
  });
  const sorted = [...years].sort((a, b) => b - a);
  sel.innerHTML = '';
  sorted.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  });
  sel.value = (prev && sorted.includes(prev)) ? prev : sorted[0];
}

function drawMonthlySalesChart() {
  const canvas = elements.monthlySalesChart;
  if (!canvas) return;
  const width = canvas.offsetWidth;
  if (!width) return;

  const year = parseInt(elements.chartYear?.value) || new Date().getFullYear();
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const clientOrder = [];
  const clientSet = new Set();
  state.sales.forEach(s => {
    if (parseInt(s.date?.substring(0, 4)) === year && !clientSet.has(s.client)) {
      clientSet.add(s.client);
      clientOrder.push(s.client);
    }
  });

  const data = clientOrder.map(() => new Array(12).fill(0));
  state.sales.forEach(s => {
    if (parseInt(s.date?.substring(0, 4)) !== year) return;
    const m = parseInt(s.date?.substring(5, 7)) - 1;
    const ci = clientOrder.indexOf(s.client);
    if (ci !== -1 && m >= 0 && m < 12) data[ci][m] += s.total;
  });

  const height = 300;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 20, right: 20, bottom: 48, left: 75 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);

  let maxVal = 0;
  data.forEach(d => d.forEach(v => { if (v > maxVal) maxVal = v; }));
  if (maxVal === 0) maxVal = 100;
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  maxVal = Math.ceil(maxVal / mag) * mag;

  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#7a6a5b';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const val = (maxVal / 5) * i;
    const y = pad.top + ch - (ch * i / 5);
    ctx.strokeStyle = i === 0 ? '#d3c4b5' : '#ede3d9';
    ctx.lineWidth = i === 0 ? 1.5 : 0.7;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.stroke();
    const label = val >= 1000 ? 'R$ ' + (val / 1000).toFixed(1) + 'k' : 'R$ ' + val.toFixed(0);
    ctx.fillText(label, pad.left - 8, y + 4);
  }

  if (clientOrder.length === 0) {
    ctx.fillStyle = '#7a6a5b';
    ctx.textAlign = 'center';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText('Nenhuma venda registrada para ' + year, width / 2, height / 2);
  } else {
    const groupW = cw / 12;
    const barPad = groupW * 0.1;
    const barW = Math.max((groupW - barPad * 2) / clientOrder.length, 2);
    clientOrder.forEach((_, ci) => {
      ctx.fillStyle = CHART_COLORS[ci % CHART_COLORS.length];
      for (let m = 0; m < 12; m++) {
        const val = data[ci][m];
        if (!val) continue;
        const bh = (val / maxVal) * ch;
        const x = pad.left + m * groupW + barPad + ci * barW;
        const y = pad.top + ch - bh;
        ctx.fillRect(x, y, Math.max(barW - 1, 1), bh);
      }
    });
  }

  ctx.fillStyle = '#7a6a5b';
  ctx.textAlign = 'center';
  ctx.font = '11px Inter, system-ui, sans-serif';
  monthLabels.forEach((lbl, i) => {
    ctx.fillText(lbl, pad.left + (i + 0.5) * (cw / 12), pad.top + ch + 20);
  });

  if (elements.chartLegend) {
    elements.chartLegend.innerHTML = '';
    clientOrder.forEach((client, ci) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-color" style="background:${CHART_COLORS[ci % CHART_COLORS.length]}"></span><span>${client}</span>`;
      elements.chartLegend.appendChild(item);
    });
  }
}

function renderDashboard() {
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSaleItems = state.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalPurchases = state.purchases.reduce((sum, purchase) => sum + purchase.quantity * purchase.unitValue, 0);

  elements.dashboardSalesTotal.textContent = formatMoney(totalSales);
  elements.dashboardSalesCount.textContent = totalSaleItems;
  elements.dashboardPurchaseTotal.textContent = formatMoney(totalPurchases);

  const productSummary = {};
  state.sales.forEach(sale => {
    const product = state.products.find(p => p.id === sale.productId);
    const name = product ? product.name : 'Produto removido';
    if (!productSummary[name]) {
      productSummary[name] = { quantity: 0, total: 0 };
    }
    productSummary[name].quantity += sale.quantity;
    productSummary[name].total += sale.total;
  });

  elements.productSalesTable.innerHTML = '';
  Object.entries(productSummary).forEach(([name, summary]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${name}</td>
      <td>${summary.quantity}</td>
      <td>${formatMoney(summary.total)}</td>
    `;
    elements.productSalesTable.appendChild(row);
  });

  const clientSummary = {};
  state.sales.forEach(sale => {
    if (!clientSummary[sale.client]) {
      clientSummary[sale.client] = { quantity: 0, total: 0 };
    }
    clientSummary[sale.client].quantity += sale.quantity;
    clientSummary[sale.client].total += sale.total;
  });

  elements.clientSalesTable.innerHTML = '';
  Object.entries(clientSummary).forEach(([client, summary]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${client}</td>
      <td>${summary.quantity}</td>
      <td>${formatMoney(summary.total)}</td>
    `;
    elements.clientSalesTable.appendChild(row);
  });

  populateChartYears();
  requestAnimationFrame(() => drawMonthlySalesChart());
}

function renderClients() {
  if (!elements.clientsTable) return;
  elements.clientsTable.innerHTML = '';
  state.clients.forEach(client => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${client.name}</td>
      <td>${client.location}</td>
      <td><button type="button" class="btn-secondary">Excluir</button></td>
    `;
    row.querySelector('button').addEventListener('click', () => deleteClient(client.id));
    elements.clientsTable.appendChild(row);
  });
}

function updateClientOptions() {
  if (!elements.saleClient) return;
  const current = elements.saleClient.value;
  elements.saleClient.innerHTML = '<option value="">Selecione o cliente</option>';
  state.clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.name;
    option.textContent = client.name;
    elements.saleClient.appendChild(option);
  });
  elements.saleClient.value = current;
}

function addClient(event) {
  event.preventDefault();
  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const location = document.getElementById('clientLocation').value.trim();
  if (!name || !location) return;

  if (id) {
    const existing = state.clients.find(c => c.id === id);
    if (existing) { existing.name = name; existing.location = location; }
  } else {
    state.clients.push({ id: crypto.randomUUID(), name, location });
  }
  saveData(storageKeys.clients, state.clients);
  event.target.reset();
  document.getElementById('clientId').value = '';
  renderAll();
}

function deleteClient(id) {
  state.clients = state.clients.filter(c => c.id !== id);
  saveData(storageKeys.clients, state.clients);
  renderAll();
}

function renderAll() {
  renderProducts();
  renderRecipeProducts();
  renderPurchases();
  renderSales();
  renderClients();
  renderInventoryCountTable();
  renderInventory();
  renderInventoryHistory();
  renderDashboard();
  updateProductOptions();
  updateClientOptions();
}

async function addProduct(event) {
  event.preventDefault();
  const productId = elements.productId.value || currentProductEditId;
  const productType = document.getElementById('productType').value;
  const productName = document.getElementById('productName').value.trim();
  const supplier = document.getElementById('productSupplier').value.trim();
  const packageQty = Number(document.getElementById('productPackageQty').value);
  const unit = document.getElementById('productUnit').value;
  const unitPrice = Number(document.getElementById('productUnitPrice').value);

  if (!productType || !productName || !supplier || !packageQty || !unit || !unitPrice) return;

  if (productId) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
      product.type = productType;
      product.name = productName;
      product.supplier = supplier;
      product.packageQty = packageQty;
      product.unit = unit;
      product.unitPrice = unitPrice;
      await saveProductToDb(product);
    }
  } else {
    const newProduct = {
      id: crypto.randomUUID(),
      type: productType,
      name: productName,
      supplier,
      packageQty,
      unit,
      unitPrice,
    };
    state.products.push(newProduct);
    await saveProductToDb(newProduct);
  }
  resetProductForm();
  renderAll();
}

function startProductEdit(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  currentProductEditId = product.id;
  elements.productId.value = product.id;
  document.getElementById('productType').value = product.type || '';
  document.getElementById('productName').value = product.name;
  document.getElementById('productSupplier').value = product.supplier;
  document.getElementById('productPackageQty').value = product.packageQty || '';
  document.getElementById('productUnit').value = product.unit || '';
  document.getElementById('productUnitPrice').value = product.unitPrice || '';
  document.querySelector('#productForm .btn-primary').textContent = 'Atualizar produto';
}

function resetProductForm() {
  currentProductEditId = null;
  elements.productId.value = '';
  elements.productForm.reset();
  document.querySelector('#productForm .btn-primary').textContent = 'Salvar produto';
}

function createIngredientRow() {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <select class="ingredient-name" required>
        <option value="">Selecione um produto</option>
      </select>
    </td>
    <td><input class="ingredient-brand" type="text" placeholder="Marca / embalagem" /></td>
    <td><input class="ingredient-package-price" type="number" step="0.01" min="0" placeholder="R$" /></td>
    <td><input class="ingredient-package-qty" type="number" step="0.01" min="0" placeholder="Qtd" /></td>
    <td><input class="ingredient-recipe-qty" type="number" step="0.01" min="0" placeholder="Uso" /></td>
    <td><input class="ingredient-cost" type="number" step="0.01" readonly /></td>
    <td><button type="button" class="btn-secondary remove-ingredient-row">Remover</button></td>
  `;

  const select = row.querySelector('.ingredient-name');
  populateIngredientOptions(row);
  select.addEventListener('change', () => {
    updateRecipeTotals();
  });

  const inputs = row.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      updateRowCost(row);
      updateRecipeTotals();
    });
  });

  row.querySelector('.remove-ingredient-row').addEventListener('click', () => {
    row.remove();
    updateRecipeTotals();
  });

  return row;
}

function populateIngredientOptions(row) {
  const select = row.querySelector('.ingredient-name');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">Selecione um insumo</option>';
  state.products.forEach(product => {
    if (product.type === 'insumo') {
      const option = document.createElement('option');
      option.value = product.name;
      option.textContent = product.name;
      select.appendChild(option);
    }
  });
  select.value = currentValue;
}

function updateRowCost(row) {
  const price = Number(row.querySelector('.ingredient-package-price').value) || 0;
  const packageQty = Number(row.querySelector('.ingredient-package-qty').value) || 0;
  const recipeQty = Number(row.querySelector('.ingredient-recipe-qty').value) || 0;
  const cost = packageQty > 0 ? (price / packageQty) * recipeQty : 0;
  row.querySelector('.ingredient-cost').value = cost ? cost.toFixed(2) : '';
}

function updateRecipeTotals() {
  const rows = Array.from(elements.recipeIngredientsTable.querySelectorAll('tr'));
  const totalCost = rows.reduce((sum, row) => {
    return sum + (Number(row.querySelector('.ingredient-cost').value) || 0);
  }, 0);
  const yieldUnits = Number(document.getElementById('recipeYield').value) || 1;
  const unitCost = yieldUnits ? totalCost / yieldUnits : 0;

  elements.recipeTotalCost.textContent = formatMoney(totalCost);
  elements.recipeUnitCost.textContent = formatMoney(unitCost);
}

function populateRecipeForm(product) {
  elements.recipeForm.reset();
  elements.recipeIngredientsTable.innerHTML = '';
  currentRecipeProductId = product.id;
  elements.recipeProduct.value = product.id;
  document.getElementById('recipeTotalWeight').value = product.recipe?.totalWeight || '';
  document.getElementById('recipeYield').value = product.recipe?.yieldUnits || '';
  document.getElementById('recipePrepTime').value = product.recipe?.prepTime || '';

  const recipeButton = elements.recipeForm.querySelector('.btn-primary');
  if (recipeButton) {
    recipeButton.textContent = product.recipe ? 'Atualizar ficha técnica' : 'Salvar ficha técnica';
  }

  // Show recipe ingredients section when loading a product
  document.getElementById('recipeIngredients').classList.remove('hidden');

  if (product.recipe?.ingredients?.length) {
    product.recipe.ingredients.forEach(item => {
      const row = createIngredientRow();
      row.querySelector('.ingredient-name').value = item.name;
      row.querySelector('.ingredient-brand').value = item.brand;
      row.querySelector('.ingredient-package-price').value = item.packagePrice || '';
      row.querySelector('.ingredient-package-qty').value = item.packageQty || '';
      row.querySelector('.ingredient-recipe-qty').value = item.recipeQty || '';
      updateRowCost(row);
      elements.recipeIngredientsTable.appendChild(row);
    });
  } else {
    elements.recipeIngredientsTable.appendChild(createIngredientRow());
  }

  updateRecipeTotals();
}

function resetRecipeForm() {
  currentRecipeProductId = null;
  elements.recipeForm.reset();
  elements.recipeIngredientsTable.innerHTML = '';
  const recipeButton = elements.recipeForm.querySelector('.btn-primary');
  if (recipeButton) recipeButton.textContent = 'Salvar ficha técnica';
  elements.recipeProduct.value = '';
  elements.recipeIngredientsTable.appendChild(createIngredientRow());
  updateRecipeTotals();
}

function copyBaseRecipeToForm(baseProduct) {
  if (!baseProduct?.recipe?.ingredients?.length) return false;
  // preserve selected product id
  const currentId = elements.recipeProduct.value;
  // clear existing rows
  elements.recipeIngredientsTable.innerHTML = '';
  // copy recipe-level fields
  document.getElementById('recipeTotalWeight').value = baseProduct.recipe.totalWeight || '';
  document.getElementById('recipeYield').value = baseProduct.recipe.yieldUnits || '';
  document.getElementById('recipePrepTime').value = baseProduct.recipe.prepTime || '';

  baseProduct.recipe.ingredients.forEach(item => {
    const row = createIngredientRow();
    row.querySelector('.ingredient-name').value = item.name;
    row.querySelector('.ingredient-brand').value = item.brand || '';
    row.querySelector('.ingredient-package-price').value = item.packagePrice || '';
    row.querySelector('.ingredient-package-qty').value = item.packageQty || '';
    row.querySelector('.ingredient-recipe-qty').value = item.recipeQty || '';
    updateRowCost(row);
    elements.recipeIngredientsTable.appendChild(row);
  });

  // restore selected product
  elements.recipeProduct.value = currentId;
  updateRecipeTotals();
  return true;
}

async function addRecipeProduct(event) {
  event.preventDefault();
  const productId = elements.recipeProduct.value;
  const totalWeight = document.getElementById('recipeTotalWeight').value.trim();
  const yieldUnits = Number(document.getElementById('recipeYield').value) || 0;
  const prepTime = Number(document.getElementById('recipePrepTime').value) || 0;
  const rows = Array.from(elements.recipeIngredientsTable.querySelectorAll('tr'));

  if (!productId) {
    alert('Por favor, selecione um produto');
    return;
  }

  if (!yieldUnits || yieldUnits <= 0) {
    alert('Por favor, defina o rendimento (maior que zero)');
    return;
  }

  if (rows.length === 0) {
    alert('Por favor, adicione ingredientes');
    return;
  }

  const product = state.products.find(p => p.id === productId);
  if (!product) {
    alert('Produto não encontrado. Cadastre-o primeiro.');
    return;
  }

  const ingredients = rows.map(row => ({
    name: row.querySelector('.ingredient-name').value,
    brand: row.querySelector('.ingredient-brand').value.trim(),
    packagePrice: Number(row.querySelector('.ingredient-package-price').value) || 0,
    packageQty: Number(row.querySelector('.ingredient-package-qty').value) || 0,
    recipeQty: Number(row.querySelector('.ingredient-recipe-qty').value) || 0,
    cost: Number(row.querySelector('.ingredient-cost').value) || 0,
  })).filter(item => item.name);

  if (!ingredients.length) {
    alert('Por favor, preencha os ingredientes com nomes válidos');
    return;
  }

  const totalCost = ingredients.reduce((sum, item) => sum + item.cost, 0);
  const unitCost = yieldUnits ? totalCost / yieldUnits : 0;

  product.recipe = {
    totalWeight,
    yieldUnits,
    prepTime,
    totalCost: Number(totalCost.toFixed(2)),
    unitCost: Number(unitCost.toFixed(2)),
    ingredients,
  };

  await saveProductToDb(product);
  alert('Ficha técnica salva com sucesso!');
  
  // Hide recipe ingredients section
  document.getElementById('recipeIngredients').classList.add('hidden');
  
  resetRecipeForm();
  renderAll();
}

function addPurchase(event) {
  event.preventDefault();
  const date = document.getElementById('purchaseDate').value;
  const productId = document.getElementById('purchaseProduct').value;
  const quantity = Number(document.getElementById('purchaseQuantity').value);
  const unitValue = Number(document.getElementById('purchaseUnitValue').value);
  const location = document.getElementById('purchaseLocation').value.trim();

  if (!date || !productId || !quantity || !unitValue || !location) return;

  state.purchases.push({
    id: crypto.randomUUID(),
    date,
    productId,
    quantity,
    unitValue,
    location,
  });
  saveData(storageKeys.purchases, state.purchases);
  event.target.reset();
  renderAll();
}

function addSale(event) {
  event.preventDefault();
  const date = document.getElementById('saleDate').value;
  const client = document.getElementById('saleClient').value.trim();
  const productId = document.getElementById('saleProduct').value;
  const quantity = Number(elements.saleQuantity.value);
  const unitPrice = Number(elements.saleUnitPrice.value);

  if (!date || !client || !productId || !quantity || !unitPrice) return;

  const total = Number((quantity * unitPrice).toFixed(2));
  state.sales.push({
    id: crypto.randomUUID(),
    date,
    client,
    productId,
    quantity,
    unitPrice,
    total,
  });
  saveData(storageKeys.sales, state.sales);
  event.target.reset();
  elements.saleTotal.value = '';
  renderAll();
}

function renderInventoryCountTable() {
  if (!elements.inventoryCountTable) return;
  const filterType = elements.inventoryTypeFilter?.value || '';
  elements.inventoryCountTable.innerHTML = '';
  state.products
    .filter(product => !filterType || product.type === filterType)
    .forEach(product => {
      const typeLabel = product.type === 'venda' ? 'Item de Venda' : product.type === 'insumo' ? 'Insumos' : '-';
      const unitCost = product.packageQty ? product.unitPrice / product.packageQty : 0;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${typeLabel}</td>
        <td>${product.name}</td>
        <td>${product.unit || '-'}</td>
        <td>${formatMoney(unitCost)}</td>
        <td><input type="number" class="inventory-count-input" step="0.01" min="0" placeholder="Qtd" data-product-id="${product.id}" data-product-type="${product.type}" data-product-name="${product.name}" data-unit-cost="${unitCost}" /></td>
        <td class="count-valor">—</td>
      `;
      const input = row.querySelector('.inventory-count-input');
      const valorCell = row.querySelector('.count-valor');
      input.addEventListener('input', () => {
        const qty = Number(input.value);
        valorCell.textContent = qty > 0 ? formatMoney(qty * unitCost) : '—';
      });
      elements.inventoryCountTable.appendChild(row);
    });
}

function saveInventoryCount() {
  const date = elements.inventoryDate.value;
  if (!date) {
    alert('Por favor, selecione a data da contagem');
    return;
  }

  const inputs = elements.inventoryCountTable.querySelectorAll('.inventory-count-input');
  let savedCount = 0;
  inputs.forEach(input => {
    if (input.value === '') return;
    const quantity = Number(input.value);
    if (quantity < 0) return;
    const type = input.dataset.productType === 'venda' ? 'product' : 'ingredient';
    state.inventoryHistory.push({
      id: crypto.randomUUID(),
      date,
      type,
      itemId: type === 'product' ? input.dataset.productId : undefined,
      itemName: type === 'ingredient' ? input.dataset.productName : undefined,
      quantity,
      source: 'count',
    });
    savedCount++;
  });

  if (!savedCount) {
    alert('Preencha ao menos uma quantidade antes de salvar');
    return;
  }

  saveData(storageKeys.inventoryHistory, state.inventoryHistory);
  renderAll();
}


function updateSaleTotal() {
  const quantity = Number(elements.saleQuantity.value);
  const unitPrice = Number(elements.saleUnitPrice.value);
  if (quantity && unitPrice) {
    elements.saleTotal.value = (quantity * unitPrice).toFixed(2);
  } else {
    elements.saleTotal.value = '';
  }
}

function initNavigation() {
  document.querySelectorAll('.side-nav button[data-target]').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const targetSection = document.getElementById(targetId);
      const group = button.closest('.side-nav-group');

      // Toggle submenu only for Cadastro button
      if (button.classList.contains('submenu-toggle') && group) {
        group.classList.toggle('active');
      }

      // Remove active class from all sections
      document.querySelectorAll('.card-section').forEach(section => {
        section.classList.remove('active');
      });
      
      // Add active class to target section
      if (targetSection) {
        targetSection.classList.add('active');
      }

      if (targetId === 'dashboard') {
        requestAnimationFrame(() => drawMonthlySalesChart());
      }

      // Close Cadastro submenu when navigating away
      if (!button.classList.contains('submenu-toggle') && group) {
        group.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.side-nav button[data-anchor]').forEach(button => {
    button.addEventListener('click', () => {
      const anchorId = button.dataset.anchor;
      const targetPanel = document.getElementById(anchorId);
      document.querySelectorAll('.cadastro-panels .panel').forEach(panel => panel.classList.add('hidden'));
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
      }
      if (anchorId === 'fichaPanel') {
        elements.recipeProduct.focus();
      }
      const targetSection = document.getElementById('produtos');
      if (targetSection) {
        document.querySelectorAll('.card-section').forEach(section => section.classList.remove('active'));
        targetSection.classList.add('active');
      }
    });
  });
}

function handleRecipeProductChange() {
  const productId = elements.recipeProduct.value;
  if (!productId) {
    resetRecipeForm();
    return;
  }
  const product = state.products.find(p => p.id === productId);
  if (product) {
    populateRecipeForm(product);
  } else {
    elements.recipeForm.reset();
    elements.recipeIngredientsTable.innerHTML = '';
    document.getElementById('recipeIngredients').classList.remove('hidden');
    elements.recipeIngredientsTable.appendChild(createIngredientRow());
    updateRecipeTotals();
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appContent').style.display = 'none';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appContent').style.display = 'block';
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const btn = event.target.querySelector('button[type="submit"]');
  errorEl.textContent = '';
  btn.textContent = 'Entrando...';
  btn.disabled = true;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  btn.textContent = 'Entrar';
  btn.disabled = false;
  if (error) { errorEl.textContent = 'E-mail ou senha incorretos.'; return; }
  showApp();
  await initialize();
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  showLogin();
}

let appInitialized = false;

async function initialize() {
  state.products = await loadProducts();
  state.purchases = loadData(storageKeys.purchases);
  state.sales = loadData(storageKeys.sales);
  state.inventory = loadData(storageKeys.inventory);
  state.ingredients = loadData(storageKeys.ingredients);
  state.inventoryHistory = loadData(storageKeys.inventoryHistory);
  state.clients = loadData(storageKeys.clients);

  if (!appInitialized) {
    elements.productForm.addEventListener('submit', addProduct);
    elements.recipeForm.addEventListener('submit', addRecipeProduct);
    elements.recipeProduct.addEventListener('change', handleRecipeProductChange);
    elements.purchaseForm.addEventListener('submit', addPurchase);
    elements.salesForm.addEventListener('submit', addSale);
    if (elements.clientForm) {
      elements.clientForm.addEventListener('submit', addClient);
    }
    if (elements.saveInventoryCountBtn) {
      elements.saveInventoryCountBtn.addEventListener('click', saveInventoryCount);
    }
    if (elements.inventoryTypeFilter) {
      elements.inventoryTypeFilter.addEventListener('change', () => {
        renderInventoryCountTable();
        renderInventory();
      });
    }
    elements.saleQuantity.addEventListener('input', updateSaleTotal);
    elements.saleUnitPrice.addEventListener('input', updateSaleTotal);
    elements.addIngredientRow.addEventListener('click', () => {
      elements.recipeIngredientsTable.appendChild(createIngredientRow());
    });
    if (elements.chartYear) {
      elements.chartYear.addEventListener('change', () => drawMonthlySalesChart());
    }
    window.addEventListener('resize', () => {
      if (document.getElementById('dashboard')?.classList.contains('active')) {
        drawMonthlySalesChart();
      }
    });
    if (elements.loadBaseRecipeBtn) {
      elements.loadBaseRecipeBtn.addEventListener('click', () => {
        const baseName = 'Brownie Tradicional 16 Fatias';
        const baseProduct = state.products.find(p => p.name === baseName);
        if (!baseProduct) {
          alert('Produto base "' + baseName + '" não encontrado. Cadastre-o em Produtos primeiro.');
          return;
        }
        const copied = copyBaseRecipeToForm(baseProduct);
        if (!copied) alert('Produto base não possui ficha técnica com ingredientes.');
      });
    }
    const recipeYieldInput = document.getElementById('recipeYield');
    if (recipeYieldInput) {
      recipeYieldInput.addEventListener('input', updateRecipeTotals);
    }
    elements.recipeIngredientsTable.appendChild(createIngredientRow());
    if (elements.inventoryDate) {
      elements.inventoryDate.valueAsDate = new Date();
    }
    const firstSection = document.getElementById('produtos');
    if (firstSection) firstSection.classList.add('active');
    initNavigation();
    appInitialized = true;
  }

  renderAll();
}

(async () => {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showApp();
    await initialize();
  } else {
    showLogin();
  }
})();
