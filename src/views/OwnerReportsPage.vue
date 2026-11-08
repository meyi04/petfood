<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Sales reports</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading || !store" @click="downloadReport">
            <ion-icon slot="start" :icon="downloadOutline" />
            Download PDF
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">UNDERSTAND YOUR BUSINESS</p>
      <div class="report-heading">
        <div>
          <h1>Sales report</h1>
          <p v-if="store">{{ store.name }} · {{ store.address }}, {{ store.municipality }}</p>
          <p v-else>Confirmed orders count toward sales. Cancelled orders are excluded.</p>
        </div>
        <ion-select v-model="period" aria-label="Report date range" interface="popover">
          <ion-select-option value="7">Last 7 days</ion-select-option>
          <ion-select-option value="30">Last 30 days</ion-select-option>
          <ion-select-option value="all">All time</ion-select-option>
        </ion-select>
      </div>

      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else>
        <section v-if="store" class="shop-identity">
          <img v-if="store.imageUrl" :src="store.imageUrl" :alt="`${store.name} shop`" />
          <div class="shop-copy">
            <span>REPORT FOR</span>
            <strong>{{ store.name }}</strong>
            <small>{{ store.address }}, {{ store.municipality }} · {{ store.phone }}</small>
          </div>
        </section>

        <section class="download-panel" aria-label="Download sales report">
          <div>
            <strong>Take your shop report with you</strong>
            <p>Download sales totals, best-selling products, and order details as a PDF file.</p>
          </div>
          <ion-button
            class="download-report-button"
            :disabled="!store"
            @click="downloadReport"
          >
            <ion-icon slot="start" :icon="downloadOutline" />
            Download PDF report
          </ion-button>
        </section>

        <section class="metric-grid">
          <ion-card class="metric-card revenue-card">
            <ion-card-content>
              <span class="metric-label">TOTAL SALES</span>
              <strong>{{ formatCurrency(totalSales) }}</strong>
              <span class="metric-footnote">{{ periodLabel }}</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">CONFIRMED ORDERS</span>
              <strong>{{ salesOrders.length }}</strong>
              <span class="metric-footnote">{{ periodLabel }}</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">ITEMS SOLD</span>
              <strong>{{ itemsSold }}</strong>
              <span class="metric-footnote">Across confirmed orders</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">AVERAGE ORDER</span>
              <strong>{{ formatCurrency(averageOrder) }}</strong>
              <span class="metric-footnote">Per completed order</span>
            </ion-card-content>
          </ion-card>
        </section>

        <section class="products-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">BEST SELLERS</p>
              <h2>Products sold</h2>
            </div>
            <span>{{ topProducts.length }} products</span>
          </div>
          <ion-card v-if="topProducts.length" class="products-card">
            <div v-for="(product, index) in topProducts" :key="product.productId" class="product-row">
              <span class="product-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="product-details">
                <strong>{{ product.name }}</strong>
                <span>{{ product.quantity }} {{ product.quantity === 1 ? 'item' : 'items' }} sold</span>
              </div>
              <strong class="product-sales">{{ formatCurrency(product.sales) }}</strong>
            </div>
          </ion-card>
          <section v-else class="empty-state">
            <ion-icon :icon="barChartOutline" />
            <h2>No confirmed sales in this period</h2>
            <p>Orders appear here as soon as you confirm them.</p>
          </section>
        </section>

        <p class="report-note">
          Date ranges use confirmation time where available. Older confirmed orders use their order date. Pending and cancelled orders are excluded.
        </p>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { barChartOutline, downloadOutline } from 'ionicons/icons';
import { jsPDF } from 'jspdf';
import { listStoreOrders } from '@/services/orderService';
import { getOwnerStore } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { PetFoodOrder, Store } from '@/types';

interface ProductSales {
  productId: string;
  name: string;
  quantity: number;
  sales: number;
}

const authStore = useAuthStore();
const period = ref<'7' | '30' | 'all'>('30');
const allOrders = ref<PetFoodOrder[]>([]);
const store = ref<Store | null>(null);
const loading = ref(true);
const error = ref('');

const periodLabel = computed(() => {
  if (period.value === 'all') return 'All time';
  return `Last ${period.value} days`;
});

const salesOrders = computed(() => {
  const startTime = period.value === 'all'
    ? null
    : Date.now() - Number(period.value) * 24 * 60 * 60 * 1000;
  return allOrders.value.filter((order) => {
    if (order.status !== 'confirmed' && order.status !== 'completed') return false;
    if (startTime === null) return true;
    const confirmedAt = (order.confirmedAt ?? order.completedAt ?? order.createdAt)?.toMillis?.();
    return confirmedAt !== undefined && confirmedAt >= startTime;
  });
});

const totalSales = computed(() =>
  salesOrders.value.reduce((sum, order) => sum + order.total, 0),
);

const itemsSold = computed(() =>
  salesOrders.value.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  ),
);

const averageOrder = computed(() =>
  salesOrders.value.length ? totalSales.value / salesOrders.value.length : 0,
);

const topProducts = computed<ProductSales[]>(() => {
  const byProduct = new Map<string, ProductSales>();
  for (const order of salesOrders.value) {
    for (const item of order.items) {
      const sales = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantity: 0,
        sales: 0,
      };
      sales.quantity += item.quantity;
      sales.sales += item.unitPrice * item.quantity;
      byProduct.set(item.productId, sales);
    }
  }
  return [...byProduct.values()].sort((first, second) => second.sales - first.sales);
});

watch(period, loadOrders);

async function loadOrders(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to view sales reports.');
    const ownerStore = await getOwnerStore(ownerId);
    if (!ownerStore) throw new Error('Create your store profile before viewing reports.');
    store.value = ownerStore;
    allOrders.value = await listStoreOrders(ownerStore.id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load sales reports.';
  } finally {
    loading.value = false;
  }
}

function downloadReport(): void {
  if (!store.value) return;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const pageBottom = pageHeight - margin;
  let y = margin;

  function drawPageHeader(): void {
    pdf.setFillColor(25, 117, 104);
    pdf.rect(0, 0, pageWidth, 4, 'F');
    pdf.setTextColor(25, 117, 104);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(store.value?.name ?? 'Shop', margin, 15);
    pdf.setTextColor(80, 90, 90);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('SALES REPORT', pageWidth - margin, 14, { align: 'right' });
    pdf.text(`${periodLabel.value} · Generated ${new Date().toLocaleDateString()}`, margin, 21);
    y = 30;
  }

  function ensureSpace(height: number): void {
    if (y + height <= pageBottom) return;
    pdf.addPage();
    drawPageHeader();
  }

  function drawSectionTitle(title: string): void {
    ensureSpace(13);
    y += 3;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(25, 117, 104);
    pdf.text(title, margin, y);
    y += 3;
    pdf.setDrawColor(220, 228, 226);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  function drawTextLines(lines: string[], x: number, lineHeight: number): void {
    pdf.text(lines, x, y);
    y += lines.length * lineHeight;
  }

  drawPageHeader();
  pdf.setTextColor(70, 76, 76);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const shopDetails = [
    `${store.value.address}, ${store.value.municipality}`,
    store.value.phone ? `Phone: ${store.value.phone}` : '',
    authStore.profile?.displayName ? `Prepared for ${authStore.profile.displayName}` : '',
  ].filter(Boolean);
  for (const detail of shopDetails) {
    const lines = pdf.splitTextToSize(detail, contentWidth);
    ensureSpace(lines.length * 5);
    drawTextLines(lines, margin, 5);
  }

  drawSectionTitle('Sales summary');
  const summary = [
    ['Total sales', formatCurrency(totalSales.value)],
    ['Confirmed orders', String(salesOrders.value.length)],
    ['Items sold', String(itemsSold.value)],
    ['Average order', formatCurrency(averageOrder.value)],
  ];
  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 19;
  ensureSpace(cardHeight + 4);
  summary.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + cardGap);
    pdf.setFillColor(244, 248, 247);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
    pdf.setTextColor(90, 100, 98);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(label, x + 3, y + 6);
    pdf.setTextColor(35, 44, 43);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(pdf.splitTextToSize(value, cardWidth - 6), x + 3, y + 13);
  });
  y += cardHeight + 5;

  drawSectionTitle('Best-selling products');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.setFillColor(25, 117, 104);
  pdf.rect(margin, y - 4, contentWidth, 8, 'F');
  pdf.text('Product', margin + 2, y + 1);
  pdf.text('Qty sold', pageWidth - margin - 42, y + 1, { align: 'right' });
  pdf.text('Sales', pageWidth - margin - 2, y + 1, { align: 'right' });
  y += 9;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 56, 55);
  if (!topProducts.value.length) {
    ensureSpace(7);
    pdf.text('No confirmed product sales in this period.', margin + 2, y);
    y += 7;
  } else {
    for (const product of topProducts.value) {
      const nameLines = pdf.splitTextToSize(product.name, contentWidth - 70);
      const rowHeight = Math.max(7, nameLines.length * 4.5);
      ensureSpace(rowHeight);
      pdf.text(nameLines, margin + 2, y);
      pdf.text(String(product.quantity), pageWidth - margin - 42, y, { align: 'right' });
      pdf.text(formatCurrency(product.sales), pageWidth - margin - 2, y, { align: 'right' });
      y += rowHeight;
      pdf.setDrawColor(235, 239, 238);
      pdf.line(margin, y - 1, pageWidth - margin, y - 1);
    }
  }

  drawSectionTitle('Order details');
  if (!salesOrders.value.length) {
    ensureSpace(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(70, 76, 76);
    pdf.text('No confirmed orders in this period.', margin, y);
    y += 7;
  } else {
    for (const order of salesOrders.value) {
      const saleDate = (order.confirmedAt ?? order.completedAt ?? order.createdAt)
        ?.toDate?.().toLocaleDateString() ?? 'Date unavailable';
      const itemLines = pdf.splitTextToSize(
        order.items.map((item) => `${item.quantity} x ${item.name}`).join(' · '),
        contentWidth - 4,
      );
      const blockHeight = 12 + itemLines.length * 4.5;
      ensureSpace(blockHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(40, 48, 47);
      pdf.text(`Order #${order.id.slice(0, 8).toUpperCase()} · ${saleDate} · ${order.status}`, margin, y);
      pdf.text(formatCurrency(order.total), pageWidth - margin, y, { align: 'right' });
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(90, 96, 95);
      pdf.setFontSize(8);
      pdf.text(itemLines, margin + 2, y);
      y += itemLines.length * 4.5 + 3;
      pdf.setDrawColor(235, 239, 238);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
    }
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(125, 132, 131);
    pdf.text(
      `${store.value.name} · ${periodLabel.value}`,
      margin,
      pageHeight - 7,
    );
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const shopSlug = store.value.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shop';
  pdf.save(`${shopSlug}-sales-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

onIonViewWillEnter(loadOrders);
</script>

<style scoped>
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.report-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.045em;
}

.report-heading p {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.shop-identity {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0.9rem 0 1.1rem;
  padding: 0.75rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.9rem;
  background: var(--ion-card-background);
}

.shop-identity img {
  width: 3.2rem;
  height: 3.2rem;
  flex: none;
  border-radius: 0.7rem;
  object-fit: cover;
}

.shop-copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.shop-copy span {
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.shop-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-copy small {
  overflow-wrap: anywhere;
  color: var(--ion-color-medium);
  font-size: 0.7rem;
}

.download-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
  padding: 1rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.9rem;
  background: var(--ion-card-background);
}

.download-panel strong {
  font-size: 0.9rem;
}

.download-panel p {
  margin: 0.3rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.75rem;
  line-height: 1.4;
}

.download-report-button {
  flex: none;
}

.report-heading ion-select {
  flex: none;
  max-width: 9rem;
  padding: 0.6rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 0.75rem;
  background: var(--ion-item-background);
  font-size: 0.78rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.metric-card {
  margin: 0;
  border-radius: 1rem;
}

.metric-card ion-card-content {
  display: grid;
  min-height: 7.2rem;
  align-content: space-between;
  gap: 0.55rem;
  padding: 1rem;
}

.revenue-card {
  border: 0;
  background: linear-gradient(135deg, var(--app-hero-start), var(--app-hero-end));
  color: white;
}

.metric-label {
  color: var(--ion-color-medium);
  font-size: 0.6rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.revenue-card .metric-label,
.revenue-card .metric-footnote {
  color: rgba(255, 255, 255, 0.82);
}

.metric-card strong {
  overflow-wrap: anywhere;
  font-size: clamp(1.15rem, 5vw, 1.65rem);
  letter-spacing: -0.045em;
}

.metric-footnote {
  color: var(--ion-color-medium);
  font-size: 0.7rem;
}

.products-section {
  margin-top: 1.8rem;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.2rem;
}

.section-heading > span {
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

.products-card {
  overflow: hidden;
  padding: 0 1rem;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.95rem 0;
}

.product-row + .product-row {
  border-top: 1px solid var(--ion-color-light);
}

.product-rank {
  display: grid;
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.7rem;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 0.72rem;
  font-weight: 750;
}

.product-details {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 0.2rem;
}

.product-details strong {
  overflow: hidden;
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-details span {
  color: var(--ion-color-medium);
  font-size: 0.75rem;
}

.product-sales {
  flex: none;
  font-size: 0.85rem;
}

.loading-state,
.empty-state {
  display: grid;
  min-height: 12rem;
  place-items: center;
  align-content: center;
  text-align: center;
}

.empty-state ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.7rem;
}

.empty-state h2 {
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.empty-state p,
.report-note {
  color: var(--ion-color-medium);
  font-size: 0.82rem;
  line-height: 1.5;
}

.report-note {
  margin: 1.1rem 0 0;
}

@media (min-width: 680px) {
  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .download-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .download-report-button {
    width: 100%;
    margin: 0;
  }
}
</style>
