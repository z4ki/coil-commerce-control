import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  getSoldProductsAnalytics,
  getSoldProductsSummary,
  SoldProduct,
  SoldProductsSummary,
  SoldProductsFilter,
} from '@/services/soldProductsService';
import * as XLSX from 'xlsx';

const THICKNESS_OPTIONS = [0.33, 0.40, 0.45, 0.50, 0.60, 0.70, 0.80, 0.90];
const WIDTH_OPTIONS = [800, 900, 1000, 1200, 1250];

const Chip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    className={`px-3 py-1 rounded-full border text-xs mr-2 mb-2 transition-colors ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200'}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const FilterPanel = ({ filters, setFilters }: {
  filters: SoldProductsFilter;
  setFilters: React.Dispatch<React.SetStateAction<SoldProductsFilter>>;
}) => (
  <div className="bg-muted/50 p-4 rounded-md mb-4">
    <div className="flex flex-col md:flex-row gap-4">
      {/* Date Range */}
      <div>
        <label className="block text-xs font-medium mb-1">Date Range</label>
        <div className="flex gap-2">
          <input type="date" value={filters.startDate || ''} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="input input-sm" />
          <span>-</span>
          <input type="date" value={filters.endDate || ''} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="input input-sm" />
        </div>
      </div>
      {/* Product Type */}
      <div>
        <label className="block text-xs font-medium mb-1">Product Type</label>
        <select value={filters.productType || ''} onChange={e => setFilters(f => ({ ...f, productType: e.target.value }))} className="input input-sm">
          <option value="">All</option>
          <option value="coil">Coil</option>
          <option value="corrugated_sheet">Corrugated Sheet</option>
          <option value="steel_slitting">Steel Slitting</option>
        </select>
      </div>
      {/* Client */}
      <div>
        <label className="block text-xs font-medium mb-1">Client</label>
        <select value={filters.clientId || ''} onChange={e => setFilters(f => ({ ...f, clientId: e.target.value }))} className="input input-sm">
          <option value="">All</option>
          <option value="client1">Client 1</option>
          <option value="client2">Client 2</option>
        </select>
      </div>
    </div>
    {/* Thickness Chips */}
    <div className="mt-4">
      <label className="block text-xs font-medium mb-1">Thickness (mm)</label>
      <div className="flex flex-wrap">
        {THICKNESS_OPTIONS.map(val => (
          <Chip
            key={val}
            selected={Array.isArray(filters.thickness) && filters.thickness.includes(val)}
            onClick={() => setFilters(f => {
              const arr = Array.isArray(f.thickness) ? f.thickness : [];
              return {
                ...f,
                thickness: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
              };
            })}
          >
            {val}
          </Chip>
        ))}
      </div>
    </div>
    {/* Width Chips */}
    <div className="mt-2">
      <label className="block text-xs font-medium mb-1">Width (mm)</label>
      <div className="flex flex-wrap">
        {WIDTH_OPTIONS.map(val => (
          <Chip
            key={val}
            selected={Array.isArray(filters.width) && filters.width.includes(val)}
            onClick={() => setFilters(f => {
              const arr = Array.isArray(f.width) ? f.width : [];
              return {
                ...f,
                width: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val],
              };
            })}
          >
            {val}
          </Chip>
        ))}
      </div>
    </div>
    {/* Unit Price Range */}
    <div className="mt-2 flex gap-2 items-end">
      <div>
        <label className="block text-xs font-medium mb-1">Unit Price Min</label>
        <input
          type="number"
          min={0}
          step={1}
          value={filters.unitPriceMin ?? ''}
          onChange={e => setFilters(f => ({ ...f, unitPriceMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
          className="input input-sm w-24"
          placeholder="Min"
        />
      </div>
      <span className="mb-2">-</span>
      <div>
        <label className="block text-xs font-medium mb-1">Unit Price Max</label>
        <input
          type="number"
          min={0}
          step={1}
          value={filters.unitPriceMax ?? ''}
          onChange={e => setFilters(f => ({ ...f, unitPriceMax: e.target.value === '' ? undefined : Number(e.target.value) }))}
          className="input input-sm w-24"
          placeholder="Max"
        />
      </div>
    </div>
    {/* Payment Status Filter */}
    <div className="mt-4">
      <label className="block text-xs font-medium mb-1">Payment Status</label>
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All', color: 'bg-gray-300 dark:bg-gray-700' },
          { value: 'paid', label: 'Paid', color: 'bg-green-500' },
          { value: 'unpaid', label: 'Unpaid', color: 'bg-red-500' },
        ].map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${filters.paymentStatus === opt.value || (!filters.paymentStatus && opt.value === 'all') ? `${opt.color} text-white border-transparent` : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200'}`}
            onClick={() => setFilters(f => ({ ...f, paymentStatus: opt.value as 'all' | 'paid' | 'unpaid' }))}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const SummaryCards = ({ summary, loading, error, productType }: {
  summary: SoldProductsSummary | null;
  loading: boolean;
  error: string | null;
  productType: string | undefined;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
    {loading ? (
      <div className="col-span-6 text-center py-8">Loading summary...</div>
    ) : error ? (
      <div className="col-span-6 text-center text-red-600 py-8">{error}</div>
    ) : summary ? (
      <>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">
            {productType === "corrugated_sheet" ? "Total Quantity Sold" : "Total Weight Sold"}
          </span>
          <span className="text-2xl font-bold">
            {productType === "corrugated_sheet"
              ? (summary.totalQuantity ?? 0).toLocaleString() + " m"
              : (summary.totalWeight ?? 0).toLocaleString() + " Ton"}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Total Revenue</span>
          <span className="text-2xl font-bold">{(summary.totalRevenue ?? 0).toLocaleString()} DA</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Total Quantity Sold</span>
          <span className="text-2xl font-bold">{(summary.totalQuantity ?? 0).toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Unique Products</span>
          <span className="text-2xl font-bold">{(summary.uniqueProducts ?? 0).toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Unique Clients</span>
          <span className="text-2xl font-bold">{(summary.uniqueClients ?? 0).toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">Avg. Order Value</span>
          <span className="text-2xl font-bold">{(summary.averageOrderValue ?? 0).toLocaleString()} DA </span>
        </div>
      </>
    ) : null}
  </div>
);

const ProductsTable = ({ rows, loading, error }: {
  rows: SoldProduct[];
  loading: boolean;
  error: string | null;
}) => (
  <div className="rounded-md border p-4 overflow-x-auto">
    {loading ? (
      <div className="text-center py-8">Loading data...</div>
    ) : error ? (
      <div className="text-center text-red-600 py-8">{error}</div>
    ) : (
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="px-3 py-2 text-left">Product Name</th>
            <th className="px-3 py-2 text-left">Client Name</th>
            <th className="px-3 py-2 text-left">Thickness (mm)</th>
            <th className="px-3 py-2 text-left">Width (mm)</th>
            <th className="px-3 py-2 text-left">Quantity Sold</th>
            <th className="px-3 py-2 text-left">Weight (ton)</th>
            <th className="px-3 py-2 text-left">Unit Price</th>
            <th className="px-3 py-2 text-left">Total Price</th>
            <th className="px-3 py-2 text-left">Invoice Number</th>
            <th className="px-3 py-2 text-left">Sale Date</th>
            <th className="px-3 py-2 text-left">Payment Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="px-3 py-2">{row.productName || '-'}</td>
              <td className="px-3 py-2">{row.clientName || '-'}</td>
              <td className="px-3 py-2">{row.thickness ?? 0}</td>
              <td className="px-3 py-2">{row.width ?? 0}</td>
              <td className="px-3 py-2">{row.quantity ?? 0}</td>
              <td className="px-3 py-2">{row.weight ?? 0}</td>
              <td className="px-3 py-2">{row.unitPrice ?? 0}</td>
              <td className="px-3 py-2">{row.totalPrice ?? 0}</td>
              <td className="px-3 py-2">{row.invoiceNumber || '-'}</td>
              <td className="px-3 py-2">{row.saleDate || '-'}</td>
              <td className="px-3 py-2">{row.paymentStatus || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

function exportToExcel(rows: SoldProduct[], summary: SoldProductsSummary | null, productType: string | undefined) {
  // French column headers
  const headers = {
    productName: 'Nom du produit',
    clientName: 'Nom du client',
    thickness: 'Épaisseur (mm)',
    width: 'Largeur (mm)',
    quantity: 'Quantité vendue',
    weight: 'Poids (tonne)',
    unitPrice: 'Prix unitaire',
    totalPrice: 'Prix total',
    invoiceNumber: 'Numéro de facture',
    saleDate: 'Date de vente',
    paymentStatus: 'Statut de paiement',
  };
  // Prepare data for export (French keys)
  const data = rows.map(row => ({
    [headers.productName]: row.productName,
    [headers.clientName]: row.clientName,
    [headers.thickness]: row.thickness,
    [headers.width]: row.width,
    [headers.quantity]: row.quantity,
    [headers.weight]: row.weight,
    [headers.unitPrice]: row.unitPrice,
    [headers.totalPrice]: row.totalPrice,
    [headers.invoiceNumber]: row.invoiceNumber,
    [headers.saleDate]: row.saleDate,
    [headers.paymentStatus]: row.paymentStatus,
  }));
  // French summary labels
  const totalLabel = productType === "corrugated_sheet"
    ? "Quantité totale vendue (m)"
    : "Poids total vendu (tonne)";
  const totalValue = productType === "corrugated_sheet"
    ? (summary?.totalQuantity ?? 0).toLocaleString() + " m"
    : (summary?.totalWeight ?? 0).toLocaleString() + " tonne";
  const revenueLabel = "Chiffre d'affaires total";
  const revenueValue = (summary?.totalRevenue ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' });
  // Add summary rows at the bottom
  const summaryRows = [
    {
      [headers.productName]: totalLabel,
      [headers.clientName]: totalValue,
      [headers.thickness]: '',
      [headers.width]: '',
      [headers.quantity]: '',
      [headers.weight]: '',
      [headers.unitPrice]: '',
      [headers.totalPrice]: '',
      [headers.invoiceNumber]: '',
      [headers.saleDate]: '',
      [headers.paymentStatus]: ''
    },
    {
      [headers.productName]: revenueLabel,
      [headers.clientName]: revenueValue,
      [headers.thickness]: '',
      [headers.width]: '',
      [headers.quantity]: '',
      [headers.weight]: '',
      [headers.unitPrice]: '',
      [headers.totalPrice]: '',
      [headers.invoiceNumber]: '',
      [headers.saleDate]: '',
      [headers.paymentStatus]: ''
    }
  ];
  const exportData = [...data, {}, ...summaryRows];
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyse des produits vendus');
  XLSX.writeFile(workbook, 'produits_vendus_analytics.xlsx');
}

const SoldProductsAnalytics = () => {
  const [filters, setFilters] = useState<SoldProductsFilter>({});
  const [summary, setSummary] = useState<SoldProductsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [rows, setRows] = useState<SoldProduct[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);

  useEffect(() => {
    setSummaryLoading(true);
    setSummaryError(null);
    getSoldProductsSummary(filters)
      .then(setSummary)
      .catch(e => setSummaryError(e?.message || 'Failed to load summary'))
      .finally(() => setSummaryLoading(false));
  }, [filters]);

  useEffect(() => {
    setRowsLoading(true);
    setRowsError(null);
    getSoldProductsAnalytics(filters)
      .then(setRows)
      .catch(e => setRowsError(e?.message || 'Failed to load data'))
      .finally(() => setRowsLoading(false));
  }, [filters]);

  return (
    <MainLayout title="Sold Products Analytics">
      <div className="space-y-6">
        <div className="flex justify-end items-center mb-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => exportToExcel(rows, summary, filters.productType)}
          >
            Exporter en Excel
          </button>
        </div>
        <FilterPanel filters={filters} setFilters={setFilters} />
        <SummaryCards summary={summary} loading={summaryLoading} error={summaryError} productType={filters.productType} />
        <ProductsTable rows={rows} loading={rowsLoading} error={rowsError} />
      </div>
    </MainLayout>
  );
};

export default SoldProductsAnalytics; 