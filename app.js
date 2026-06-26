const CHART_COLORS = [
  '#b05f2e', '#3d8a5e', '#2e6db0', '#b08a2e', '#8e2eb0',
  '#2eb08a', '#b02e6d', '#2e4eb0', '#6db02e', '#b04a2e',
];

const SUPABASE_URL = 'https://qykywggmsnbavpdpwxvs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v6madC5lhwPQUK6gZ_hE4g_FSPoOqjQ';
let supabaseClient;

function productToDb(p) {
  let recipe = p.recipe ? { ...p.recipe } : null;
  if (p.usarComoInsumo) {
    recipe = recipe || {};
    recipe.usarComoInsumo = true;
  } else if (recipe) {
    delete recipe.usarComoInsumo;
  }
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    supplier: p.supplier,
    package_qty: p.packageQty,
    unit: p.unit,
    unit_price: p.unitPrice,
    recipe: recipe || null,
    barcode: p.barcode || null,
  };
}

function dbToProduct(row) {
  const rawRecipe = row.recipe;
  const usarComoInsumo = rawRecipe?.usarComoInsumo === true;
  const recipe = rawRecipe && (rawRecipe.ingredients || rawRecipe.unitCost != null || rawRecipe.yieldUnits)
    ? rawRecipe : undefined;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    supplier: row.supplier,
    packageQty: row.package_qty,
    unit: row.unit,
    unitPrice: row.unit_price,
    recipe,
    usarComoInsumo,
    barcode: row.barcode || undefined,
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

// ── COMPRAS ──
async function loadPurchases() {
  const { data, error } = await supabaseClient.from('compras').select('*').order('date', { ascending: false });
  if (error) { console.error('Erro compras:', error); return []; }
  return (data || []).map(r => ({ id: r.id, date: r.date, productId: r.product_id, quantity: r.quantity, unitValue: r.unit_value, location: r.location }));
}
async function savePurchaseToDb(p) {
  const { error } = await supabaseClient.from('compras').upsert({ id: p.id, date: p.date, product_id: p.productId, quantity: p.quantity, unit_value: p.unitValue, location: p.location });
  if (error) console.error('Erro salvar compra:', error);
}
async function deletePurchaseFromDb(id) {
  const { error } = await supabaseClient.from('compras').delete().eq('id', id);
  if (error) console.error('Erro excluir compra:', error);
}

// ── VENDAS ──
async function loadSales() {
  const { data, error } = await supabaseClient.from('vendas').select('*').order('date', { ascending: false });
  if (error) { console.error('Erro vendas:', error); return []; }
  return (data || []).map(r => ({ id: r.id, date: r.date, productId: r.product_id, client: r.client, quantity: r.quantity, unitPrice: r.unit_price, total: r.total }));
}
async function saveSaleToDb(s) {
  const { error } = await supabaseClient.from('vendas').upsert({ id: s.id, date: s.date, product_id: s.productId, client: s.client, quantity: s.quantity, unit_price: s.unitPrice, total: s.total });
  if (error) console.error('Erro salvar venda:', error);
}
async function deleteSaleFromDb(id) {
  const { error } = await supabaseClient.from('vendas').delete().eq('id', id);
  if (error) console.error('Erro excluir venda:', error);
}

// ── CLIENTES ──
async function loadClients() {
  const { data, error } = await supabaseClient.from('clientes').select('*').order('name');
  if (error) { console.error('Erro clientes:', error); return []; }
  return (data || []).map(r => ({ id: r.id, name: r.name, location: r.location }));
}
async function saveClientToDb(c) {
  const { error } = await supabaseClient.from('clientes').upsert({ id: c.id, name: c.name, location: c.location });
  if (error) console.error('Erro salvar cliente:', error);
}
async function deleteClientFromDb(id) {
  const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
  if (error) console.error('Erro excluir cliente:', error);
}

// ── CUSTOS ──
async function loadCostsFromDb() {
  const { data, error } = await supabaseClient.from('custos').select('*');
  if (error) { console.error('Erro custos:', error); return []; }
  return (data || []).map(r => ({ id: r.id, name: r.name, category: r.category, value: r.value, month: r.month, year: r.year }));
}
async function saveCostToDb(c) {
  const { error } = await supabaseClient.from('custos').upsert({ id: c.id, name: c.name, category: c.category, value: c.value, month: c.month, year: c.year });
  if (error) console.error('Erro salvar custo:', error);
}
async function deleteCostFromDb(id) {
  const { error } = await supabaseClient.from('custos').delete().eq('id', id);
  if (error) console.error('Erro excluir custo:', error);
}

// ── INVENTÁRIO HISTÓRICO ──
async function loadInventoryHistory() {
  const { data, error } = await supabaseClient.from('inventario_historico').select('*').order('date');
  if (error) { console.error('Erro inventário:', error); return []; }
  return (data || []).map(r => ({ id: r.id, date: r.date, type: r.type, itemId: r.item_id, itemName: r.item_name, quantity: r.quantity, source: r.source }));
}
async function saveInventoryEntryToDb(entry) {
  const { error } = await supabaseClient.from('inventario_historico').upsert({ id: entry.id, date: entry.date, type: entry.type, item_id: entry.itemId || null, item_name: entry.itemName || null, quantity: entry.quantity, source: entry.source });
  if (error) console.error('Erro salvar inventário:', error);
}

const storageKeys = {
  products: 'brownie_products',
  purchases: 'brownie_purchases',
  sales: 'brownie_sales',
  inventory: 'brownie_inventory',
  ingredients: 'brownie_ingredients',
  inventoryHistory: 'brownie_inventory_history',
  clients: 'brownie_clients',
  costs: 'brownie_costs',
};

const state = {
  products: [],
  purchases: [],
  sales: [],
  inventory: [],
  ingredients: [],
  inventoryHistory: [],
  clients: [],
  costs: [],
};

let currentProductEditId = null;
let currentRecipeProductId = null;
let currentSaleEditId = null;

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
  purchaseUnitValue: document.getElementById('purchaseUnitValue'),
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
  costForm: document.getElementById('costForm'),
  costId: document.getElementById('costId'),
  costName: document.getElementById('costName'),
  costCategory: document.getElementById('costCategory'),
  costValue: document.getElementById('costValue'),
  costMonth: document.getElementById('costMonth'),
  costYear: document.getElementById('costYear'),
  costsTable: document.querySelector('#costsTable tbody'),
  dreMonth: document.getElementById('dreMonth'),
  dreYear: document.getElementById('dreYear'),
  drePanel: document.getElementById('drePanel'),
  costsFilterMonth: document.getElementById('costsFilterMonth'),
  costsFilterYear: document.getElementById('costsFilterYear'),
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
      if (product.type === 'insumo' || (product.type === 'venda' && product.usarComoInsumo)) {
        const option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name + (product.usarComoInsumo && product.type === 'venda' ? ' (prod.)' : '');
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
    const insumoBtn = product.type === 'venda'
      ? `<button type="button" class="btn-secondary toggle-insumo-btn${product.usarComoInsumo ? ' btn-insumo-active' : ''}" data-id="${product.id}" title="Marcar como ingrediente disponível em fichas técnicas">${product.usarComoInsumo ? 'Insumo ✓' : 'Usar como Insumo'}</button>`
      : '';
    row.innerHTML = `
      <td>${typeLabel}${product.usarComoInsumo ? ' <span class="badge-insumo">+Insumo</span>' : ''}</td>
      <td>${product.name}</td>
      <td>${product.supplier || '-'}</td>
      <td>${product.packageQty ?? '-'}</td>
      <td>${product.unit || '-'}</td>
      <td>${formatMoney(product.unitPrice)}</td>
      <td>
        ${insumoBtn}
        <button type="button" class="btn-secondary edit-product-btn" data-id="${product.id}">Editar</button>
        <button type="button" class="btn-secondary delete-product-btn" data-id="${product.id}">Excluir</button>
      </td>
    `;
    if (product.type === 'venda') {
      row.querySelector('.toggle-insumo-btn').addEventListener('click', () => toggleProductAsInsumo(product.id));
    }
    row.querySelector('.edit-product-btn').addEventListener('click', () => startProductEdit(product.id));
    row.querySelector('.delete-product-btn').addEventListener('click', () => deleteProduct(product.id));
    elements.productsTable.appendChild(row);
  });
}

async function toggleProductAsInsumo(id) {
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  product.usarComoInsumo = !product.usarComoInsumo;
  await saveProductToDb(product);
  renderProducts();
  updateIngredientSelects();
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

async function deletePurchase(id) {
  state.purchases = state.purchases.filter(purchase => purchase.id !== id);
  await deletePurchaseFromDb(id);
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
      <td style="display:flex;gap:6px">
        <button type="button" class="btn-secondary edit-sale-btn">Editar</button>
        <button type="button" class="btn-secondary delete-sale-btn">Excluir</button>
      </td>
    `;
    row.querySelector('.edit-sale-btn').addEventListener('click', () => startSaleEdit(sale.id));
    row.querySelector('.delete-sale-btn').addEventListener('click', () => deleteSale(sale.id));
    elements.salesTable.appendChild(row);
  });
}

function startSaleEdit(saleId) {
  const sale = state.sales.find(s => s.id === saleId);
  if (!sale) return;
  currentSaleEditId = saleId;
  document.getElementById('saleDate').value = sale.date;
  elements.saleClient.value = sale.client;
  elements.saleProduct.value = sale.productId;
  elements.saleQuantity.value = sale.quantity;
  elements.saleUnitPrice.value = sale.unitPrice;
  elements.saleTotal.value = sale.total;
  document.querySelector('#salesForm .btn-primary').textContent = 'Atualizar venda';
  document.getElementById('vendas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetSaleForm() {
  currentSaleEditId = null;
  elements.salesForm.reset();
  elements.saleTotal.value = '';
  document.querySelector('#salesForm .btn-primary').textContent = 'Registrar venda';
}

async function deleteSale(saleId) {
  state.sales = state.sales.filter(sale => sale.id !== saleId);
  await deleteSaleFromDb(saleId);
  renderAll();
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

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function getDashYear() {
  return parseInt(document.getElementById('chartYear')?.value) || new Date().getFullYear();
}
function getDashMonth() {
  return parseInt(document.getElementById('dashMonth')?.value) || 0;
}
function filterSalesByPeriod(year, month) {
  return state.sales.filter(s => {
    if (!s.date) return false;
    const y = parseInt(s.date.substring(0,4));
    const m = parseInt(s.date.substring(5,7));
    return y === year && (month === 0 || m === month);
  });
}

function getDashProduct() {
  return document.getElementById('dashProduct')?.value || '';
}

function getDashClient() {
  return document.getElementById('dashClient')?.value || '';
}

function getFilteredSalesDash() {
  const year = getDashYear();
  const month = getDashMonth();
  const productId = getDashProduct();
  const client = getDashClient();
  return state.sales.filter(s => {
    if (!s.date) return false;
    const y = parseInt(s.date.substring(0,4));
    const m = parseInt(s.date.substring(5,7));
    if (y !== year) return false;
    if (month !== 0 && m !== month) return false;
    if (productId && s.productId !== productId) return false;
    if (client && s.client !== client) return false;
    return true;
  });
}

function populateDashProductOptions() {
  const sel = document.getElementById('dashProduct');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos os produtos</option>';
  state.products.filter(p => p.type === 'venda').forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function populateDashClientOptions() {
  const sel = document.getElementById('dashClient');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos os clientes</option>';
  state.clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function getWeekOfYear(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function drawSalesByMonthChart() {
  const year = getDashYear();
  const productId = getDashProduct();
  const revenue = new Array(12).fill(0);
  const qty = new Array(12).fill(0);
  state.sales.forEach(s => {
    if (!s.date || parseInt(s.date.substring(0,4)) !== year) return;
    if (productId && s.productId !== productId) return;
    const m = parseInt(s.date.substring(5,7)) - 1;
    if (m >= 0 && m < 12) { revenue[m] += s.total || 0; qty[m] += s.quantity || 0; }
  });
  destroyChart('salesByMonth');
  const ctx = document.getElementById('salesByMonthChart');
  if (!ctx) return;
  chartInstances['salesByMonth'] = new Chart(ctx, {
    data: {
      labels: MONTHS_SHORT,
      datasets: [
        { type:'bar', label:'Receita (R$)', data:revenue, backgroundColor:'#FFD900', borderColor:'#e6c300', borderWidth:1, yAxisID:'yR', order:2 },
        { type:'line', label:'Quantidade', data:qty, borderColor:'#1a1208', backgroundColor:'#1a1208', pointBackgroundColor:'#1a1208', pointRadius:4, tension:0.3, yAxisID:'yQ', order:1 }
      ]
    },
    options: {
      responsive:true, interaction:{mode:'index',intersect:false},
      plugins:{ legend:{position:'top'}, tooltip:{ callbacks:{ label:(c)=> c.datasetIndex===0 ? ' Receita: '+formatMoney(c.raw) : ' Qtd: '+c.raw }}},
      scales:{
        yR:{ type:'linear', position:'left', grid:{color:'#e8dfc8'}, ticks:{callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))} },
        yQ:{ type:'linear', position:'right', grid:{drawOnChartArea:false}, ticks:{callback:v=>v+' un.'} }
      }
    }
  });
}

function drawSalesByProductChart() {
  const filtered = getFilteredSalesDash();
  const summary = {};
  filtered.forEach(s => {
    const p = state.products.find(p => p.id === s.productId);
    const name = p ? p.name : 'Removido';
    if (!summary[name]) summary[name] = { qty:0, total:0 };
    summary[name].qty += s.quantity; summary[name].total += s.total;
  });
  const sorted = Object.keys(summary).sort((a,b) => summary[b].total - summary[a].total);
  const totalRev = sorted.reduce((s,n) => s + summary[n].total, 0);
  const colors = ['#FFD900','#e07b39','#2e6db0','#2e7d52','#8b3d1c','#cc1515','#8e2eb0','#2eb08a'];
  destroyChart('salesByProduct');
  const ctx = document.getElementById('salesByProductChart');
  if (ctx) {
    chartInstances['salesByProduct'] = new Chart(ctx, {
      type: 'bar',
      data: { labels: sorted, datasets:[{ label:'Receita (R$)', data:sorted.map(n=>summary[n].total), backgroundColor:sorted.map((_,i)=>colors[i%colors.length]), borderRadius:6 }] },
      options: { indexAxis:'y', responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${formatMoney(c.raw)}`}} },
        scales:{ x:{ ticks:{callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))}, grid:{color:'#e8dfc8'} } } }
    });
  }
  const tbody = document.querySelector('#productSalesTable tbody');
  if (tbody) tbody.innerHTML = sorted.length===0 ? '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Sem dados</td></tr>'
    : sorted.map(n => { const pct = totalRev>0?(summary[n].total/totalRev*100).toFixed(1):'0.0'; return `<tr><td>${n}</td><td>${summary[n].qty}</td><td>${formatMoney(summary[n].total)}</td><td>${pct}%</td></tr>`; }).join('');
}

function drawSalesByClientChart() {
  const filtered = getFilteredSalesDash();
  const summary = {};
  filtered.forEach(s => {
    if (!summary[s.client]) summary[s.client] = { qty:0, total:0 };
    summary[s.client].qty += s.quantity; summary[s.client].total += s.total;
  });
  const sorted = Object.keys(summary).sort((a,b) => summary[b].total - summary[a].total);
  const totalRev = sorted.reduce((s,c) => s + summary[c].total, 0);
  const colors = ['#2e6db0','#8b3d1c','#2e7d52','#cc1515','#8e2eb0','#FFD900','#e07b39'];
  destroyChart('salesByClient');
  const ctx = document.getElementById('salesByClientChart');
  if (ctx) {
    chartInstances['salesByClient'] = new Chart(ctx, {
      type:'bar',
      data:{ labels:sorted, datasets:[{ label:'Receita (R$)', data:sorted.map(c=>summary[c].total), backgroundColor:sorted.map((_,i)=>colors[i%colors.length]), borderRadius:6 }] },
      options:{ indexAxis:'y', responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${formatMoney(c.raw)}`}} },
        scales:{ x:{ ticks:{callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))}, grid:{color:'#e8dfc8'} } } }
    });
  }
  const tbody = document.querySelector('#clientSalesTable tbody');
  if (tbody) tbody.innerHTML = sorted.length===0 ? '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Sem dados</td></tr>'
    : sorted.map(c => { const pct = totalRev>0?(summary[c].total/totalRev*100).toFixed(1):'0.0'; return `<tr><td>${c}</td><td>${summary[c].qty}</td><td>${formatMoney(summary[c].total)}</td><td>${pct}%</td></tr>`; }).join('');
}

function drawSalesByWeekChart() {
  const year = getDashYear();
  const productId = getDashProduct();
  const client = getDashClient();
  const weekData = {};
  state.sales.forEach(s => {
    if (!s.date || parseInt(s.date.substring(0,4)) !== year) return;
    if (productId && s.productId !== productId) return;
    if (client && s.client !== client) return;
    const week = getWeekOfYear(s.date);
    if (!weekData[week]) weekData[week] = { total: 0, qty: 0 };
    weekData[week].total += s.total || 0;
    weekData[week].qty += s.quantity || 0;
  });
  const weeks = Object.keys(weekData).map(Number).sort((a, b) => a - b);
  destroyChart('salesByWeek');
  const ctx = document.getElementById('salesByWeekChart');
  if (!ctx) return;
  chartInstances['salesByWeek'] = new Chart(ctx, {
    data: {
      labels: weeks.map(w => 'Sem. ' + w),
      datasets: [
        { type: 'bar',  label: 'Receita (R$)', data: weeks.map(w => weekData[w].total), backgroundColor: '#FFD900', borderColor: '#e6c200', borderWidth: 1, yAxisID: 'yR', order: 2 },
        { type: 'line', label: 'Quantidade',   data: weeks.map(w => weekData[w].qty),   borderColor: '#1a1208', backgroundColor: '#1a1208', pointRadius: 4, tension: 0.3, yAxisID: 'yQ', order: 1 }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: c => c.datasetIndex === 0 ? ' Receita: ' + formatMoney(c.raw) : ' Qtd: ' + c.raw } }
      },
      scales: {
        yR: { type: 'linear', position: 'left',  beginAtZero: true, grid: { color: '#e8dfc8' }, ticks: { callback: v => 'R$ ' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)) } },
        yQ: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function drawDreByMonthChart() {
  const year = getDashYear();
  const receita=new Array(12).fill(0), cmvArr=new Array(12).fill(0), fixoArr=new Array(12).fill(0), varArr=new Array(12).fill(0), tribArr=new Array(12).fill(0), prolArr=new Array(12).fill(0);
  state.sales.forEach(s => {
    if (!s.date || parseInt(s.date.substring(0,4)) !== year) return;
    const m = parseInt(s.date.substring(5,7))-1;
    receita[m] += s.total||0;
    const p = state.products.find(p=>p.id===s.productId);
    if (p?.recipe?.unitCost) cmvArr[m] += p.recipe.unitCost * s.quantity;
  });
  state.costs.forEach(c => {
    if (c.year !== year) return;
    const m = (c.month||1)-1;
    if (m<0||m>11) return;
    if (c.category==='cmv') cmvArr[m]+=c.value||0;
    else if (c.category==='fixo') fixoArr[m]+=c.value||0;
    else if (c.category==='variavel') varArr[m]+=c.value||0;
    else if (c.category==='tributos') tribArr[m]+=c.value||0;
    else if (c.category==='prolabore') prolArr[m]+=c.value||0;
  });
  const resultado = receita.map((r,i) => r - cmvArr[i] - fixoArr[i] - varArr[i] - tribArr[i] - prolArr[i]);
  destroyChart('dreByMonth');
  const ctx = document.getElementById('dreByMonthChart');
  if (!ctx) return;
  chartInstances['dreByMonth'] = new Chart(ctx, {
    data:{
      labels: MONTHS_SHORT,
      datasets:[
        { type:'bar', label:'Receita', data:receita, backgroundColor:'rgba(255,217,0,0.85)', borderRadius:4, order:3 },
        { type:'bar', label:'CMV', data:cmvArr, backgroundColor:'rgba(204,21,21,0.8)', borderRadius:4, order:3 },
        { type:'bar', label:'Custos Fixos', data:fixoArr, backgroundColor:'rgba(224,123,57,0.8)', borderRadius:4, order:3 },
        { type:'bar', label:'Custos Variáveis', data:varArr, backgroundColor:'rgba(224,178,57,0.8)', borderRadius:4, order:3 },
        { type:'line', label:'Resultado Líquido', data:resultado, borderColor:'#2e7d52', backgroundColor:'rgba(46,125,82,0.1)', pointBackgroundColor:resultado.map(v=>v>=0?'#2e7d52':'#cc1515'), pointRadius:5, tension:0.3, fill:true, order:1 }
      ]
    },
    options:{
      responsive:true, interaction:{mode:'index',intersect:false},
      plugins:{ legend:{position:'top'}, tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${formatMoney(c.raw)}`}} },
      scales:{ y:{ ticks:{callback:v=>'R$ '+(Math.abs(v)>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))}, grid:{color:'#e8dfc8'} } }
    }
  });
}

function drawMonthlySalesChart() { drawSalesByMonthChart(); }

function drawPurchasesByMonthChart() {
  const year = getDashYear();
  const values = new Array(12).fill(0);
  state.purchases.forEach(p => {
    if (!p.date || parseInt(p.date.substring(0,4)) !== year) return;
    const m = parseInt(p.date.substring(5,7)) - 1;
    if (m >= 0 && m < 12) values[m] += p.quantity * p.unitValue;
  });
  destroyChart('purchasesByMonth');
  const ctx = document.getElementById('purchasesByMonthChart');
  if (!ctx) return;
  chartInstances['purchasesByMonth'] = new Chart(ctx, {
    type: 'bar',
    data: { labels: MONTHS_SHORT, datasets:[{ label:'Compras (R$)', data:values, backgroundColor:'#8b3d1c', borderRadius:6 }] },
    options: { responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${formatMoney(c.raw)}`}} },
      scales:{ y:{ ticks:{callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))}, grid:{color:'#e8dfc8'} } } }
  });
}

function drawPurchasesByWeekChart() {
  const year = getDashYear();
  const weekData = {};
  state.purchases.forEach(p => {
    if (!p.date || parseInt(p.date.substring(0,4)) !== year) return;
    const week = getWeekOfYear(p.date);
    if (!weekData[week]) weekData[week] = 0;
    weekData[week] += p.quantity * p.unitValue;
  });
  const weeks = Object.keys(weekData).map(Number).sort((a,b) => a-b);
  destroyChart('purchasesByWeek');
  const ctx = document.getElementById('purchasesByWeekChart');
  if (!ctx) return;
  chartInstances['purchasesByWeek'] = new Chart(ctx, {
    type: 'bar',
    data: { labels: weeks.map(w=>`Sem. ${w}`), datasets:[{ label:'Compras (R$)', data:weeks.map(w=>weekData[w]), backgroundColor:'#e07b39', borderRadius:4 }] },
    options: { responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${formatMoney(c.raw)}`}} },
      scales:{ y:{ ticks:{callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))}, grid:{color:'#e8dfc8'} } } }
  });
}

function drawInventoryByMonthChart() {
  const year = getDashYear();
  const values = new Array(12).fill(null);
  for (let m = 0; m < 12; m++) {
    const monthFirst = `${year}-${String(m+1).padStart(2,'0')}-01`;
    const latestPerIng = {};
    state.inventoryHistory.forEach(entry => {
      if (entry.source === 'sale-deduction' || entry.source === 'purchase') return;
      if (entry.type !== 'ingredient') return;
      const d = (entry.date||'').substring(0,10);
      if (d > monthFirst) return;
      const n = entry.itemName;
      if (!latestPerIng[n] || d >= latestPerIng[n].date) latestPerIng[n] = { quantity: entry.quantity, date: d };
    });
    let totalValue = 0; let hasData = false;
    Object.entries(latestPerIng).forEach(([name, data]) => {
      const product = state.products.find(p => p.name === name && p.type === 'insumo');
      if (!product) return;
      const unitCost = product.packageQty ? product.unitPrice / product.packageQty : 0;
      totalValue += data.quantity * unitCost;
      hasData = true;
    });
    values[m] = hasData ? totalValue : null;
  }
  destroyChart('inventoryByMonth');
  const ctx = document.getElementById('inventoryByMonthChart');
  if (!ctx) return;
  chartInstances['inventoryByMonth'] = new Chart(ctx, {
    type: 'line',
    data: { labels: MONTHS_SHORT, datasets:[{ label:'Valor do Estoque (R$)', data:values, borderColor:'#2e6db0', backgroundColor:'rgba(46,109,176,0.08)', pointBackgroundColor:'#2e6db0', pointRadius:5, tension:0.3, fill:true, spanGaps:true }] },
    options: { responsive:true, plugins:{ legend:{position:'top'}, tooltip:{callbacks:{label:c=>c.raw!=null?' '+formatMoney(c.raw):' Sem dados'}} },
      scales:{ y:{ min:0, ticks:{stepSize:50, callback:v=>'R$ '+(v>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0))}, grid:{color:'#e8dfc8'} } } }
  });
}

// -- LEGADO: mantido para não quebrar chamadas existentes --
function _oldDrawMonthlySalesChart() {
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

function updatePontoEquilibrio(year, month, totalSales, cmvTotal, costsF) {
  const sumCat = cat => costsF.filter(c => c.category === cat).reduce((s, c) => s + c.value, 0);
  const fixedCosts = sumCat('fixo') + sumCat('prolabore') + sumCat('tributos');

  // Margem bruta: usa período atual; se sem vendas, tenta o ano todo
  let marginPct = 0;
  if (totalSales > 0) {
    marginPct = Math.max(0, (totalSales - cmvTotal) / totalSales);
  } else {
    const allSales = state.sales.filter(s => s.date && parseInt(s.date.substring(0,4)) === year);
    const allRev = allSales.reduce((s, v) => s + (v.total||0), 0);
    let allCmv = 0;
    allSales.forEach(s => { const p = state.products.find(pr => pr.id === s.productId); if (p?.recipe?.unitCost) allCmv += p.recipe.unitCost * s.quantity; });
    marginPct = allRev > 0 ? Math.max(0, (allRev - allCmv) / allRev) : 0;
  }

  const peValue = fixedCosts > 0 && marginPct > 0 ? fixedCosts / marginPct : 0;

  // PE em unidades: usa ticket médio por unidade do período ou do ano
  const filtered = getFilteredSalesDash();
  const totalQty = filtered.reduce((s, v) => s + (v.quantity||0), 0);
  const avgUnit  = totalQty > 0 ? totalSales / totalQty : (() => {
    const allS = state.sales.filter(s => s.date && parseInt(s.date.substring(0,4)) === year);
    const ar = allS.reduce((s,v)=>s+(v.total||0),0), aq = allS.reduce((s,v)=>s+(v.quantity||0),0);
    return aq > 0 ? ar / aq : 0;
  })();
  const peQty = peValue > 0 && avgUnit > 0 ? Math.ceil(peValue / avgUnit) : 0;

  const falta = peValue - totalSales;
  const progressPct = peValue > 0 ? Math.min(totalSales / peValue * 100, 100) : 0;
  const progressClass = progressPct >= 100 ? 'pe-ok' : progressPct >= 70 ? 'pe-warn' : 'pe-danger';

  const el = id => document.getElementById(id);
  if (el('pePeValue')) el('pePeValue').textContent = peValue > 0 ? formatMoney(peValue) : '—';
  if (el('pePeQty'))   el('pePeQty').textContent   = peQty > 0 ? peQty + ' unid.' : '—';

  const faltaEl = el('peFalta');
  if (faltaEl) {
    if (peValue === 0) { faltaEl.textContent = '—'; faltaEl.style.color = ''; }
    else if (falta > 0) { faltaEl.textContent = '−' + formatMoney(falta); faltaEl.style.color = 'var(--accent-red)'; }
    else { faltaEl.textContent = '+' + formatMoney(-falta); faltaEl.style.color = 'var(--success,#2d8653)'; }
  }

  const fillEl = el('peProgressFill');
  if (fillEl) { fillEl.style.width = progressPct.toFixed(1) + '%'; fillEl.className = 'pe-progress-fill ' + progressClass; }

  const labelEl = el('peProgressLabel');
  if (labelEl) labelEl.textContent = peValue > 0
    ? `Receita atual: ${formatMoney(totalSales)} de ${formatMoney(peValue)} necessários`
    : 'Lance custos fixos em Custos & DRE para calcular.';

  const pctEl = el('peProgressPct');
  if (pctEl) {
    pctEl.textContent = peValue > 0 ? progressPct.toFixed(1) + '%' : '';
    pctEl.style.color = progressPct >= 100 ? 'var(--success,#2d8653)' : progressPct >= 70 ? '#d4900a' : 'var(--accent-red)';
  }

  const subEl = el('peSubtitle');
  if (subEl) {
    if (fixedCosts === 0) subEl.textContent = 'Lance custos fixos em Custos & DRE para calcular.';
    else subEl.textContent = `Custos fixos: ${formatMoney(fixedCosts)} | Margem bruta: ${(marginPct*100).toFixed(1)}%`;
  }
}

function renderDashboard() {
  const year = getDashYear();
  const month = getDashMonth();
  const filtered = getFilteredSalesDash();

  const totalSales    = filtered.reduce((sum, s) => sum + (s.total||0), 0);
  const numSales      = filtered.length;
  const totalPurchases = state.purchases
    .filter(p => { if (!p.date) return false; const y=parseInt(p.date.substring(0,4)), m2=parseInt(p.date.substring(5,7)); return y===year && (month===0||m2===month); })
    .reduce((sum, p) => sum + (p.quantity*p.unitValue), 0);

  const costsF = state.costs.filter(c => c.year===year && (month===0||c.month===month));
  let cmvAuto = 0;
  filtered.forEach(s => { const p=state.products.find(pr=>pr.id===s.productId); if (p?.recipe?.unitCost) cmvAuto+=p.recipe.unitCost*s.quantity; });
  const sumCat    = cat => costsF.filter(c=>c.category===cat).reduce((s,c)=>s+c.value,0);
  const cmvTotal  = cmvAuto + sumCat('cmv');
  const resultado = totalSales - cmvTotal - sumCat('fixo') - sumCat('variavel') - sumCat('tributos') - sumCat('prolabore');
  const margemBruta   = totalSales > 0 ? ((totalSales - cmvTotal) / totalSales * 100) : 0;
  const cmvPct        = totalSales > 0 ? (cmvTotal / totalSales * 100) : 0;
  const resultadoPct  = totalSales > 0 ? (resultado / totalSales * 100) : 0;
  const ticketMedio   = numSales > 0 ? totalSales / numSales : 0;

  elements.dashboardSalesTotal.textContent    = formatMoney(totalSales);
  elements.dashboardSalesCount.textContent    = numSales + (numSales !== 1 ? ' vendas' : ' venda');
  elements.dashboardPurchaseTotal.textContent = formatMoney(totalPurchases);

  const el = id => document.getElementById(id);
  const resultEl = el('dashboardResultado'); const resultCard = el('dashResultCard');
  if (resultEl)  { resultEl.textContent = formatMoney(resultado); resultEl.style.color = resultado >= 0 ? 'var(--success,#2d8653)' : 'var(--accent-red)'; }
  if (resultCard) resultCard.style.borderTopColor = resultado >= 0 ? 'var(--success,#2d8653)' : 'var(--accent-red)';

  const ticketEl = el('dashboardTicketMedio');
  if (ticketEl) ticketEl.textContent = formatMoney(ticketMedio);

  const cmvEl = el('dashboardCMV');
  if (cmvEl) cmvEl.textContent = formatMoney(cmvTotal);

  const cmvPctEl = el('dashKpiCMVPct');
  if (cmvPctEl) cmvPctEl.textContent = cmvPct.toFixed(1) + '% da receita';

  const margemEl = el('dashboardMargemBruta');
  if (margemEl) { margemEl.textContent = margemBruta.toFixed(1) + '%'; margemEl.style.color = margemBruta >= 30 ? 'var(--success,#2d8653)' : margemBruta >= 0 ? 'var(--text)' : 'var(--accent-red)'; }

  const resPctEl = el('dashKpiResultPct');
  if (resPctEl) resPctEl.textContent = resultadoPct.toFixed(1) + '% da receita';

  updatePontoEquilibrio(year, month, totalSales, cmvTotal, costsF);

  populateChartYears();
  populateDashProductOptions();
  populateDashClientOptions();
  requestAnimationFrame(() => {
    drawSalesByMonthChart();
    drawSalesByWeekChart();
    drawSalesByProductChart();
    drawSalesByClientChart();
    drawDreByMonthChart();
    drawPurchasesByMonthChart();
    drawPurchasesByWeekChart();
    drawInventoryByMonthChart();
  });
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

async function addClient(event) {
  event.preventDefault();
  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const location = document.getElementById('clientLocation').value.trim();
  if (!name || !location) return;

  if (id) {
    const existing = state.clients.find(c => c.id === id);
    if (existing) { existing.name = name; existing.location = location; await saveClientToDb(existing); }
  } else {
    const client = { id: crypto.randomUUID(), name, location };
    state.clients.push(client);
    await saveClientToDb(client);
  }
  event.target.reset();
  document.getElementById('clientId').value = '';
  renderAll();
}

async function deleteClient(id) {
  state.clients = state.clients.filter(c => c.id !== id);
  await deleteClientFromDb(id);
  renderAll();
}

function renderAll() {
  renderProducts();
  renderRecipeProducts();
  renderPurchases();
  renderSales();
  renderClients();
  renderInventoryCountTable();
  renderInventoryHistory();
  renderDashboard();
  updateProductOptions();
  updateClientOptions();
  renderCosts();
  renderDRE();
  renderPlanejamento();
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
  const barcode = (document.getElementById('productBarcode')?.value || '').trim() || undefined;

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
      product.barcode = barcode;
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
      barcode,
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
  const barcodeField = document.getElementById('productBarcode');
  if (barcodeField) barcodeField.value = product.barcode || '';
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
    const product = state.products.find(p => p.name === select.value);
    if (product) {
      row.querySelector('.ingredient-package-price').value = product.unitPrice ?? '';
      row.querySelector('.ingredient-package-qty').value = product.packageQty ?? '';
      updateRowCost(row);
    }
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

async function addPurchase(event) {
  event.preventDefault();
  const date = document.getElementById('purchaseDate').value;
  const productId = document.getElementById('purchaseProduct').value;
  const quantity = Number(document.getElementById('purchaseQuantity').value);
  const unitValue = Number(document.getElementById('purchaseUnitValue').value);
  const location = document.getElementById('purchaseLocation').value.trim();

  if (!date || !productId || !quantity || !unitValue) return;

  const purchase = { id: crypto.randomUUID(), date, productId, quantity, unitValue, location };
  state.purchases.push(purchase);
  await savePurchaseToDb(purchase);
  event.target.reset();
  document.getElementById('purchaseTotalDisplay').value = '';
  renderAll();
}

async function addSale(event) {
  event.preventDefault();
  const date = document.getElementById('saleDate').value;
  const client = document.getElementById('saleClient').value.trim();
  const productId = document.getElementById('saleProduct').value;
  const quantity = Number(elements.saleQuantity.value);
  const unitPrice = Number(elements.saleUnitPrice.value);

  if (!date || !client || !productId || !quantity || !unitPrice) return;

  const total = Number((quantity * unitPrice).toFixed(2));

  if (currentSaleEditId) {
    const idx = state.sales.findIndex(s => s.id === currentSaleEditId);
    if (idx >= 0) {
      state.sales[idx] = { id: currentSaleEditId, date, client, productId, quantity, unitPrice, total };
      await saveSaleToDb(state.sales[idx]);
    }
  } else {
    const sale = { id: crypto.randomUUID(), date, client, productId, quantity, unitPrice, total };
    state.sales.push(sale);
    await saveSaleToDb(sale);
  }

  resetSaleForm();
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

async function saveInventoryCount() {
  const date = elements.inventoryDate.value;
  if (!date) {
    alert('Por favor, selecione a data da contagem');
    return;
  }

  const inputs = elements.inventoryCountTable.querySelectorAll('.inventory-count-input');
  const newEntries = [];
  inputs.forEach(input => {
    if (input.value === '') return;
    const quantity = Number(input.value);
    if (quantity < 0) return;
    const type = input.dataset.productType === 'venda' ? 'product' : 'ingredient';
    newEntries.push({
      id: crypto.randomUUID(),
      date,
      type,
      itemId: type === 'product' ? input.dataset.productId : undefined,
      itemName: type === 'ingredient' ? input.dataset.productName : undefined,
      quantity,
      source: 'count',
    });
  });

  if (!newEntries.length) {
    alert('Preencha ao menos uma quantidade antes de salvar');
    return;
  }

  for (const entry of newEntries) {
    state.inventoryHistory.push(entry);
    await saveInventoryEntryToDb(entry);
  }
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
        requestAnimationFrame(() => renderDashboard());
      }
      if (targetId === 'planejamento') {
        requestAnimationFrame(() => calcularPlanejamento());
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

// ── LEITOR DE CÓDIGO DE BARRAS ────────────────────────────
let html5QrCode = null;

function handleBarcodeDetected(barcode) {
  const code = barcode.trim().replace(/\s+/g, '');
  const product = state.products.find(p => (p.barcode || '').trim().replace(/\s+/g, '') === code);
  const resultEl = document.getElementById('scanResult');
  if (!resultEl) return;
  resultEl.style.display = 'block';

  if (product) {
    elements.purchaseProduct.value = product.id;
    const pkg = product.packageQty && product.packageQty > 0 ? product.packageQty : 1;
    elements.purchaseUnitValue.value = ((product.unitPrice || 0) / pkg).toFixed(4);
    resultEl.className = 'scan-result scan-ok';
    resultEl.innerHTML = `✓ <strong>${product.name}</strong> encontrado — preencha a quantidade e confirme.`;
    document.getElementById('purchaseQuantity').focus();
  } else {
    resultEl.className = 'scan-result scan-error';
    resultEl.innerHTML = `Código lido: <strong>${code}</strong> — não encontrado nos produtos cadastrados.<br>
      <small>Verifique se o produto foi salvo com exatamente este código.</small><br>
      <a href="#" onclick="goToProductsWithBarcode('${code}');return false;">Cadastrar produto com este código →</a>`;
  }

  const barcodeInput = document.getElementById('barcodeInput');
  if (barcodeInput) barcodeInput.value = '';
}

function goToProductsWithBarcode(barcode) {
  document.querySelectorAll('.card-section').forEach(s => s.classList.remove('active'));
  document.getElementById('produtos').classList.add('active');
  document.querySelectorAll('.side-nav button').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-target="produtos"]')?.classList.add('active');
  const barcodeField = document.getElementById('productBarcode');
  if (barcodeField) { barcodeField.value = barcode; barcodeField.focus(); }
}

function startCameraScan() {
  const container = document.getElementById('scannerContainer');
  if (!container) return;
  container.style.display = 'block';

  if (html5QrCode) return;
  html5QrCode = new Html5Qrcode('barcodeReader');
  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 280, height: 120 } },
    (decodedText) => {
      handleBarcodeDetected(decodedText);
      stopCameraScan();
    },
    () => {}
  ).catch(err => {
    const resultEl = document.getElementById('scanResult');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.className = 'scan-result scan-error';
      resultEl.textContent = 'Não foi possível acessar a câmera. Use um leitor USB ou permita o acesso à câmera.';
    }
    stopCameraScan();
    console.warn('Câmera:', err);
  });
}

function stopCameraScan() {
  const container = document.getElementById('scannerContainer');
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
      if (container) container.style.display = 'none';
    }).catch(() => {
      html5QrCode = null;
      if (container) container.style.display = 'none';
    });
  } else {
    if (container) container.style.display = 'none';
  }
}

function initBarcodeScanner() {
  const barcodeInput = document.getElementById('barcodeInput');
  const cameraScanBtn = document.getElementById('cameraScanBtn');
  const stopScanBtn = document.getElementById('stopScanBtn');

  if (barcodeInput) {
    barcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const code = barcodeInput.value.trim();
        if (code) handleBarcodeDetected(code);
      }
    });
  }
  if (cameraScanBtn) {
    cameraScanBtn.addEventListener('click', startCameraScan);
  }
  if (stopScanBtn) {
    stopScanBtn.addEventListener('click', stopCameraScan);
  }
}

// ── CUSTOS & DRE ──────────────────────────────────────────
const COST_LABELS = {
  fixo: 'Custo Fixo',
  variavel: 'Custo Variável',
  cmv: 'CMV',
  tributos: 'Tributos',
  prolabore: 'Pró-labore',
};

function initCostYearSelectors() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);

  [elements.costYear, elements.dreYear, elements.costsFilterYear].forEach(el => {
    if (!el) return;
    if (el.tagName === 'INPUT') {
      el.value = currentYear;
    } else {
      el.innerHTML = years.map(y => `<option value="${y}"${y === currentYear ? ' selected' : ''}>${y}</option>`).join('');
    }
  });

  const currentMonth = now.getMonth() + 1;
  [elements.costMonth, elements.dreMonth, elements.costsFilterMonth].forEach(el => {
    if (el) el.value = currentMonth;
  });
}

async function addCost(e) {
  e.preventDefault();
  const id = elements.costId.value || crypto.randomUUID();
  const cost = {
    id,
    name: elements.costName.value.trim(),
    category: elements.costCategory.value,
    value: Number(elements.costValue.value),
    month: Number(elements.costMonth.value),
    year: Number(elements.costYear.value),
  };
  const idx = state.costs.findIndex(c => c.id === id);
  if (idx >= 0) state.costs[idx] = cost;
  else state.costs.push(cost);
  await saveCostToDb(cost);
  elements.costForm.reset();
  elements.costId.value = '';
  initCostYearSelectors();
  renderCosts();
  renderDRE();
}

async function deleteCost(id) {
  if (!confirm('Excluir este custo?')) return;
  state.costs = state.costs.filter(c => c.id !== id);
  await deleteCostFromDb(id);
  renderCosts();
  renderDRE();
}

function renderCosts() {
  if (!elements.costsTable) return;
  const filterMonth = Number(elements.costsFilterMonth.value);
  const filterYear = Number(elements.costsFilterYear.value);
  const filtered = state.costs.filter(c => c.month === filterMonth && c.year === filterYear)
    .sort((a, b) => a.category.localeCompare(b.category));

  elements.costsTable.innerHTML = filtered.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Nenhum custo lançado neste período</td></tr>'
    : filtered.map(c => `
      <tr>
        <td>${String(c.month).padStart(2,'0')}/${c.year}</td>
        <td>${c.name}</td>
        <td><span class="cost-badge cost-badge-${c.category}">${COST_LABELS[c.category] || c.category}</span></td>
        <td>${formatMoney(c.value)}</td>
        <td><button class="btn-secondary" onclick="deleteCost('${c.id}')">Excluir</button></td>
      </tr>
    `).join('');
}

function renderDRE() {
  if (!elements.drePanel) return;
  const month = Number(elements.dreMonth.value);
  const year  = Number(elements.dreYear.value);

  // Helpers
  const salesM = state.sales.filter(s => { const d=new Date(s.date+'T00:00:00'); return d.getMonth()+1===month && d.getFullYear()===year; });
  const salesY = state.sales.filter(s => { const d=new Date(s.date+'T00:00:00'); return d.getFullYear()===year && d.getMonth()+1<=month; });
  const cmvOf  = (sales) => { let v=0; sales.forEach(s => { const p=state.products.find(p=>p.id===s.productId); if(p?.recipe?.unitCost) v+=p.recipe.unitCost*s.quantity; }); return v; };
  const costsM = (cat) => state.costs.filter(c=>c.category===cat&&c.year===year&&c.month===month);
  const costsY = (cat) => state.costs.filter(c=>c.category===cat&&c.year===year&&c.month<=month);

  // Monthly
  const rM=salesM.reduce((s,v)=>s+(v.total||0),0);
  const cmvAutoM=cmvOf(salesM), cmvManM=costsM('cmv').reduce((s,c)=>s+c.value,0), cmvM=cmvAutoM+cmvManM;
  const fixoM=costsM('fixo').reduce((s,c)=>s+c.value,0), varM=costsM('variavel').reduce((s,c)=>s+c.value,0);
  const lbM=rM-cmvM, roM=lbM-fixoM-varM;
  const tribM=costsM('tributos').reduce((s,c)=>s+c.value,0), proM=costsM('prolabore').reduce((s,c)=>s+c.value,0);
  const rlM=roM-tribM-proM;

  // YTD
  const rY=salesY.reduce((s,v)=>s+(v.total||0),0);
  const cmvAutoY=cmvOf(salesY), cmvManY=costsY('cmv').reduce((s,c)=>s+c.value,0), cmvY=cmvAutoY+cmvManY;
  const fixoY=costsY('fixo').reduce((s,c)=>s+c.value,0), varY=costsY('variavel').reduce((s,c)=>s+c.value,0);
  const lbY=rY-cmvY, roY=lbY-fixoY-varY;
  const tribY=costsY('tributos').reduce((s,c)=>s+c.value,0), proY=costsY('prolabore').reduce((s,c)=>s+c.value,0);
  const rlY=roY-tribY-proY;

  const av  = (v,b) => b>0 ? (v/b*100).toFixed(1)+'%' : '—';
  const fm  = v => formatMoney(Math.abs(v));
  const cls = v => v<0 ? 'dre-t-neg' : v>0 ? 'dre-t-pos' : '';
  const monthLabel = new Date(year,month-1,1).toLocaleString('pt-BR',{month:'long'}).toUpperCase()+' '+year;

  // Cost items grouped by name for table rows
  const itemRows = (catM, catY, baseM, baseY) => {
    const namesM = {}, namesY = {};
    catM.forEach(c => { namesM[c.name]=(namesM[c.name]||0)+c.value; });
    catY.forEach(c => { namesY[c.name]=(namesY[c.name]||0)+c.value; });
    const names = [...new Set([...Object.keys(namesM),...Object.keys(namesY)])];
    return names.map(n => `
      <tr class="dre-tr-item">
        <td><span class="dre-arrow">›</span> ${n}</td>
        <td class="dre-td-num">${fm(namesM[n]||0)}</td>
        <td class="dre-td-pct">${av(namesM[n]||0,baseM)}</td>
        <td class="dre-td-num">${fm(namesY[n]||0)}</td>
        <td class="dre-td-pct">${av(namesY[n]||0,baseY)}</td>
      </tr>`).join('');
  };

  const secHdr = (label, bg, fg='#fff') =>
    `<tr class="dre-tr-sec" style="background:${bg};color:${fg}"><td colspan="5">${label}</td></tr>`;
  const totRow = (label, mV, yV, color) =>
    `<tr class="dre-tr-total" style="color:${color}">
       <td>${label}</td>
       <td class="dre-td-num">${formatMoney(mV)}</td>
       <td class="dre-td-pct">${av(mV,rM)}</td>
       <td class="dre-td-num">${formatMoney(yV)}</td>
       <td class="dre-td-pct">${av(yV,rY)}</td>
     </tr>`;
  const resultRow = (label, mV, yV) => {
    const c = mV>=0 ? '#2d8653' : '#cc1515';
    return `<tr class="dre-tr-result" style="border-top:3px solid ${c}">
       <td>${label}</td>
       <td class="dre-td-num" style="color:${c}">${formatMoney(mV)}</td>
       <td class="dre-td-pct" style="color:${c}">${av(mV,rM)}</td>
       <td class="dre-td-num" style="color:${mV>=0?'#2d8653':'#cc1515'}">${formatMoney(yV)}</td>
       <td class="dre-td-pct" style="color:${mV>=0?'#2d8653':'#cc1515'}">${av(yV,rY)}</td>
     </tr>`;
  };

  // KPI Panel
  const kpiColor = (v) => v>=0 ? '#2d8653' : '#cc1515';
  const kpiPanel = `
    <div class="dre-kpi-panel">
      <div class="dre-kpi-card" style="border-left-color:#2d8653">
        <div class="dre-kpi-icon" style="background:#e8f7f0;color:#2d8653">📈</div>
        <div class="dre-kpi-info">
          <div class="dre-kpi-label">Receita Bruta</div>
          <div class="dre-kpi-value" style="color:#2d8653">${formatMoney(rM)}</div>
          <div class="dre-kpi-pct">100% referência</div>
        </div>
      </div>
      <div class="dre-kpi-card" style="border-left-color:#e07b30">
        <div class="dre-kpi-icon" style="background:#fef3e8;color:#e07b30">📦</div>
        <div class="dre-kpi-info">
          <div class="dre-kpi-label">CMV</div>
          <div class="dre-kpi-value" style="color:#e07b30">${formatMoney(cmvM)}</div>
          <div class="dre-kpi-pct">${av(cmvM,rM)} da receita</div>
        </div>
      </div>
      <div class="dre-kpi-card" style="border-left-color:${kpiColor(lbM)}">
        <div class="dre-kpi-icon" style="background:#e8f7f0;color:${kpiColor(lbM)}">💰</div>
        <div class="dre-kpi-info">
          <div class="dre-kpi-label">Lucro Bruto</div>
          <div class="dre-kpi-value" style="color:${kpiColor(lbM)}">${formatMoney(lbM)}</div>
          <div class="dre-kpi-pct">${av(lbM,rM)} da receita</div>
        </div>
      </div>
      <div class="dre-kpi-card" style="border-left-color:${roM>=0?'#1a7bb0':'#cc1515'}">
        <div class="dre-kpi-icon" style="background:#e8f3fb;color:${roM>=0?'#1a7bb0':'#cc1515'}">📊</div>
        <div class="dre-kpi-info">
          <div class="dre-kpi-label">EBITDA</div>
          <div class="dre-kpi-value" style="color:${roM>=0?'#1a7bb0':'#cc1515'}">${formatMoney(roM)}</div>
          <div class="dre-kpi-pct">${av(roM,rM)} da receita</div>
        </div>
      </div>
      <div class="dre-kpi-card" style="border-left-color:${kpiColor(rlM)}">
        <div class="dre-kpi-icon" style="background:${rlM>=0?'#e8f7f0':'#fde8e8'};color:${kpiColor(rlM)}">💼</div>
        <div class="dre-kpi-info">
          <div class="dre-kpi-label">Resultado Final</div>
          <div class="dre-kpi-value" style="color:${kpiColor(rlM)}">${formatMoney(rlM)}</div>
          <div class="dre-kpi-pct">${av(rlM,rM)} da receita</div>
        </div>
      </div>
    </div>`;

  elements.drePanel.innerHTML = `
    ${kpiPanel}
    <div style="overflow-x:auto">
    <table class="dre-table">
      <thead>
        <tr class="dre-tr-head">
          <th>DESCRIÇÃO</th>
          <th class="dre-td-num">${monthLabel}</th>
          <th class="dre-td-pct">AV%</th>
          <th class="dre-td-num">ACUM. ${year}</th>
          <th class="dre-td-pct">AV%</th>
        </tr>
      </thead>
      <tbody>
        ${secHdr('RECEITA BRUTA','#1a2f1a')}
        <tr class="dre-tr-item">
          <td><span class="dre-arrow">›</span> Receita de Vendas</td>
          <td class="dre-td-num dre-t-pos">${formatMoney(rM)}</td>
          <td class="dre-td-pct">${av(rM,rM)}</td>
          <td class="dre-td-num dre-t-pos">${formatMoney(rY)}</td>
          <td class="dre-td-pct">${av(rY,rY)}</td>
        </tr>
        ${totRow('Total Receita Bruta', rM, rY, '#2d8653')}

        ${secHdr('(−) CUSTO DAS MERCADORIAS VENDIDAS — CMV','#6b3010')}
        ${cmvAutoM>0?`<tr class="dre-tr-item"><td><span class="dre-arrow">›</span> Custo via fichas técnicas</td><td class="dre-td-num">${fm(cmvAutoM)}</td><td class="dre-td-pct">${av(cmvAutoM,rM)}</td><td class="dre-td-num">${fm(cmvAutoY)}</td><td class="dre-td-pct">${av(cmvAutoY,rY)}</td></tr>`:''}
        ${itemRows(costsM('cmv'), costsY('cmv'), rM, rY)}
        ${totRow('Total CMV', cmvM, cmvY, '#e07b30')}

        <tr class="dre-tr-lb">
          <td>▶ Lucro Bruto</td>
          <td class="dre-td-num ${cls(lbM)}">${formatMoney(lbM)}</td>
          <td class="dre-td-pct ${cls(lbM)}">${av(lbM,rM)}</td>
          <td class="dre-td-num ${cls(lbY)}">${formatMoney(lbY)}</td>
          <td class="dre-td-pct ${cls(lbY)}">${av(lbY,rY)}</td>
        </tr>
        <tr class="dre-tr-margin">
          <td colspan="5">Margem Bruta: <strong>${av(lbM,rM)}</strong> no mês &nbsp;|&nbsp; <strong>${av(lbY,rY)}</strong> acumulado</td>
        </tr>

        ${secHdr('(−) DESPESAS OPERACIONAIS','#5a1010')}
        ${itemRows(costsM('fixo'), costsY('fixo'), rM, rY)}
        ${itemRows(costsM('variavel'), costsY('variavel'), rM, rY)}
        ${totRow('Total Despesas Operacionais', fixoM+varM, fixoY+varY, '#cc1515')}

        <tr class="dre-tr-lb" style="border-top:2px solid ${roM>=0?'#1a7bb0':'#cc1515'}">
          <td>▶ EBITDA / Resultado Operacional</td>
          <td class="dre-td-num ${cls(roM)}">${formatMoney(roM)}</td>
          <td class="dre-td-pct ${cls(roM)}">${av(roM,rM)}</td>
          <td class="dre-td-num ${cls(roY)}">${formatMoney(roY)}</td>
          <td class="dre-td-pct ${cls(roY)}">${av(roY,rY)}</td>
        </tr>

        ${secHdr('(−) DEDUÇÕES','#2c1a4a')}
        ${itemRows(costsM('tributos'), costsY('tributos'), rM, rY)}
        ${itemRows(costsM('prolabore'), costsY('prolabore'), rM, rY)}
        ${(tribM+proM)>0?`<tr class="dre-tr-item"><td colspan="5" style="font-size:0.75rem;color:var(--muted);padding:2px 16px">Tributos: ${formatMoney(tribM)} &nbsp;|&nbsp; Pró-labore: ${formatMoney(proM)}</td></tr>`:''}

        ${resultRow('▶ RESULTADO LÍQUIDO', rlM, rlY)}
      </tbody>
    </table>
    </div>`;
}

// ── PLANEJAMENTO DE COMPRAS ──────────────────────────────────

function getPlanWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(today); mon.setDate(today.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = d => d.toISOString().substring(0, 10);
  return { from: fmt(mon), to: fmt(sun) };
}

function getPlanMonthRange() {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10);
  const to   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().substring(0, 10);
  return { from, to };
}

function renderPlanejamento() {
  const fromEl = document.getElementById('planDateFrom');
  const toEl   = document.getElementById('planDateTo');
  if (fromEl && !fromEl.value && toEl && !toEl.value) {
    const { from, to } = getPlanWeekRange();
    fromEl.value = from;
    toEl.value   = to;
  }

  const tbody = document.querySelector('#planResultTable tbody');
  if (!tbody) return;

  const insumos = state.products.filter(p => p.type === 'insumo');
  if (insumos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">Nenhum insumo cadastrado.</td></tr>';
    return;
  }

  // Latest inventory count — read-only, comes from Contagem de estoque
  // Uses >= so that when two counts share the same date, the last inserted wins
  const latestCount = {};
  state.inventoryHistory.forEach(entry => {
    if (entry.source === 'sale-deduction' || entry.source === 'purchase') return;
    if (entry.type !== 'ingredient') return;
    const n = entry.itemName;
    const entryDate = (entry.date || '').substring(0, 10);
    const existingDate = (latestCount[n]?.date || '').substring(0, 10);
    if (!latestCount[n] || entryDate >= existingDate) {
      latestCount[n] = { quantity: entry.quantity, date: entryDate };
    }
  });

  tbody.innerHTML = '';
  insumos.forEach(product => {
    const saldo = Math.round(latestCount[product.name]?.quantity || 0);
    const countDate = latestCount[product.name]?.date || null;
    const row = document.createElement('tr');
    row.dataset.productId = product.id;
    row.dataset.saldoInicial = saldo;
    row.innerHTML = `
      <td>${product.name}</td>
      <td class="plan-saldo-readonly">${saldo}</td>
      <td class="plan-cell plan-compras">—</td>
      <td class="plan-cell plan-consumo">—</td>
      <td class="plan-cell plan-saldo-atual">—</td>
      <td class="plan-cell plan-demanda">—</td>
      <td>${product.unit || '-'}</td>
      <td class="plan-cell plan-custo">—</td>
    `;
    tbody.appendChild(row);
  });

  const summaryEl = document.getElementById('planSummaryText');
  if (summaryEl) summaryEl.style.display = 'none';
}

function calcularPlanejamento() {
  const dateFrom = document.getElementById('planDateFrom')?.value;
  const dateTo   = document.getElementById('planDateTo')?.value;
  if (!dateFrom || !dateTo) { alert('Selecione o período de análise.'); return; }

  const summaryEl = document.getElementById('planSummaryText');
  let totalBuyCost = 0;
  let itemsToBuy = 0;

  document.querySelectorAll('#planResultTable tbody tr[data-product-id]').forEach(row => {
    const product = state.products.find(p => p.id === row.dataset.productId);
    if (!product) return;

    const saldoInicial = Number(row.dataset.saldoInicial) || 0;

    const compras = state.purchases
      .filter(p => p.productId === product.id && p.date >= dateFrom && p.date <= dateTo)
      .reduce((sum, p) => sum + p.quantity, 0);

    let consumo = 0;
    state.sales.forEach(sale => {
      if (sale.date < dateFrom || sale.date > dateTo) return;
      const sp = state.products.find(p => p.id === sale.productId);
      if (!sp?.recipe?.ingredients || !sp.recipe.yieldUnits) return;
      const ing = sp.recipe.ingredients.find(i => i.name === product.name);
      if (!ing) return;
      consumo += (ing.recipeQty / sp.recipe.yieldUnits) * sale.quantity;
    });

    const saldoAtual = saldoInicial + compras - consumo;
    const demanda    = Math.max(0, -saldoAtual);
    const unitCost   = product.packageQty ? product.unitPrice / product.packageQty : 0;
    const costEst    = demanda * unitCost;
    if (demanda > 0) { totalBuyCost += costEst; itemsToBuy++; }

    row.querySelector('.plan-compras').textContent = Math.round(compras);
    row.querySelector('.plan-consumo').textContent = Math.round(consumo);
    row.querySelector('.plan-saldo-atual').innerHTML = saldoAtual < 0
      ? `<span style="color:var(--accent-red);font-weight:700">${Math.round(saldoAtual)}</span>`
      : String(Math.round(saldoAtual));
    row.querySelector('.plan-demanda').innerHTML = demanda > 0
      ? `<span class="plan-status-buy">${Math.round(demanda)}</span>`
      : '<span class="plan-status-ok">—</span>';
    row.querySelector('.plan-custo').textContent = demanda > 0 && unitCost > 0 ? formatMoney(costEst) : '—';
  });

  if (summaryEl) {
    summaryEl.textContent = itemsToBuy === 0
      ? '✓ Estoque suficiente para o período selecionado!'
      : `${itemsToBuy} insumo(s) com demanda de compra. Custo estimado: ${formatMoney(totalBuyCost)}`;
    summaryEl.className = 'plan-summary ' + (itemsToBuy === 0 ? 'plan-summary-ok' : 'plan-summary-warn');
    summaryEl.style.display = 'block';
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

function exportPDF(mode) {
  const targetId = mode === 'dre' ? 'drePrintArea' : 'dashboard';
  const orientation = mode === 'dre' ? 'portrait' : 'landscape';
  const target = document.getElementById(targetId);
  if (!target) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'pdf-print-style';
  styleEl.textContent = `@page { size: A4 ${orientation}; margin: 8mm; }`;
  document.head.appendChild(styleEl);

  target.classList.add('print-target');
  document.body.classList.add('printing');

  const cleanup = () => {
    target.classList.remove('print-target');
    document.body.classList.remove('printing');
    const s = document.getElementById('pdf-print-style');
    if (s) s.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

let appInitialized = false;

async function initialize() {
  [
    state.products,
    state.purchases,
    state.sales,
    state.clients,
    state.costs,
    state.inventoryHistory,
  ] = await Promise.all([
    loadProducts(),
    loadPurchases(),
    loadSales(),
    loadClients(),
    loadCostsFromDb(),
    loadInventoryHistory(),
  ]);

  if (!appInitialized) {
    elements.productForm.addEventListener('submit', addProduct);
    elements.recipeForm.addEventListener('submit', addRecipeProduct);
    elements.recipeProduct.addEventListener('change', handleRecipeProductChange);
    elements.purchaseForm.addEventListener('submit', addPurchase);
    elements.purchaseProduct.addEventListener('change', () => {
      const product = state.products.find(p => p.id === elements.purchaseProduct.value);
      const uvEl = document.getElementById('purchaseUnitValue');
      if (product && uvEl) {
        const pkg = product.packageQty && product.packageQty > 0 ? product.packageQty : 1;
        uvEl.value = (product.unitPrice / pkg).toFixed(4);
      } else if (uvEl) {
        uvEl.value = '';
      }
      updatePurchaseTotalDisplay();
    });
    const updatePurchaseTotalDisplay = () => {
      const qty = parseFloat(document.getElementById('purchaseQuantity')?.value) || 0;
      const uv  = parseFloat(document.getElementById('purchaseUnitValue')?.value) || 0;
      const totalEl = document.getElementById('purchaseTotalDisplay');
      if (totalEl) totalEl.value = formatMoney(qty * uv);
    };
    document.getElementById('purchaseQuantity')?.addEventListener('input', updatePurchaseTotalDisplay);
    document.getElementById('purchaseUnitValue')?.addEventListener('input', updatePurchaseTotalDisplay);
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
      });
    }
    elements.saleQuantity.addEventListener('input', updateSaleTotal);
    elements.saleUnitPrice.addEventListener('input', updateSaleTotal);
    elements.addIngredientRow.addEventListener('click', () => {
      elements.recipeIngredientsTable.appendChild(createIngredientRow());
    });
    if (elements.chartYear) {
      elements.chartYear.addEventListener('change', () => renderDashboard());
    }
    const dashMonthEl = document.getElementById('dashMonth');
    if (dashMonthEl) dashMonthEl.addEventListener('change', () => renderDashboard());
    const dashProductEl = document.getElementById('dashProduct');
    if (dashProductEl) dashProductEl.addEventListener('change', () => renderDashboard());
    const dashClientEl = document.getElementById('dashClient');
    if (dashClientEl) dashClientEl.addEventListener('change', () => renderDashboard());
    document.querySelectorAll('.dash-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const now = new Date();
        const yr = now.getFullYear(), mo = now.getMonth() + 1;
        const yearEl = document.getElementById('chartYear');
        const monthEl = document.getElementById('dashMonth');
        if (btn.dataset.quick === 'thisMonth') {
          if (yearEl) yearEl.value = yr;
          if (monthEl) monthEl.value = mo;
        } else if (btn.dataset.quick === 'lastMonth') {
          const lm = mo === 1 ? 12 : mo - 1;
          const ly = mo === 1 ? yr - 1 : yr;
          if (yearEl) yearEl.value = ly;
          if (monthEl) monthEl.value = lm;
        } else if (btn.dataset.quick === 'annual') {
          if (yearEl) yearEl.value = yr;
          if (monthEl) monthEl.value = 0;
        }
        renderDashboard();
      });
    });
    window.addEventListener('resize', () => {
      if (document.getElementById('dashboard')?.classList.contains('active')) {
        drawSalesByMonthChart(); drawSalesByWeekChart(); drawSalesByProductChart(); drawSalesByClientChart();
        drawDreByMonthChart(); drawPurchasesByMonthChart(); drawPurchasesByWeekChart(); drawInventoryByMonthChart();
      }
    });
    if (elements.loadBaseRecipeBtn) {
      elements.loadBaseRecipeBtn.addEventListener('click', () => {
        const baseName = 'Brownie Doce de Leite 90g';
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
    initBarcodeScanner();
    if (elements.costForm) {
      elements.costForm.addEventListener('submit', addCost);
    }
    if (elements.dreMonth) {
      elements.dreMonth.addEventListener('change', renderDRE);
    }
    if (elements.dreYear) {
      elements.dreYear.addEventListener('change', renderDRE);
    }
    if (elements.costsFilterMonth) {
      elements.costsFilterMonth.addEventListener('change', renderCosts);
    }
    if (elements.costsFilterYear) {
      elements.costsFilterYear.addEventListener('change', renderCosts);
    }
    initCostYearSelectors();
    const calcPlanBtn = document.getElementById('calcPlanBtn');
    if (calcPlanBtn) calcPlanBtn.addEventListener('click', calcularPlanejamento);
    document.querySelectorAll('.plan-period-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const range = btn.dataset.period === 'month' ? getPlanMonthRange() : getPlanWeekRange();
        const fromEl = document.getElementById('planDateFrom');
        const toEl   = document.getElementById('planDateTo');
        if (fromEl) fromEl.value = range.from;
        if (toEl)   toEl.value   = range.to;
      });
    });
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
