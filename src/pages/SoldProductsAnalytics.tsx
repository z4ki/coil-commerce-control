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
import { useLanguage } from '@/context/LanguageContext';
import { getUniqueThicknessWidth } from '@/services/soldProductsService';
import { useInfiniteSoldProducts } from "@/hooks/useInfiniteSoldProducts";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { getClientsPaginated } from '@/services/clientService';
import Spinner from '@/components/ui/Spinner';

const Chip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    className={`px-3 py-1 rounded-full border text-xs mr-2 mb-2 transition-colors ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200'}`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Add date formatting helpers
function formatDateToInput(dateStr?: string) {
  if (!dateStr) return '';
  // from dd/mm/yyyy to yyyy-mm-dd
  const [d, m, y] = dateStr.split('/');
  return y && m && d ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : '';
}
function formatDateToDisplay(dateStr?: string) {
  if (!dateStr) return '';
  // from yyyy-mm-dd to dd/mm/yyyy
  const [y, m, d] = dateStr.split('-');
  return y && m && d ? `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}` : '';
}

// Helper to format sale date as date only (no time)
function formatSaleDate(dateStr?: string) {
  if (!dateStr) return '-';
  // Try to handle ISO or yyyy-mm-ddTHH:mm:ss or yyyy-mm-dd HH:mm:ss
  const dateOnly = dateStr.split('T')[0]?.split(' ')[0] || dateStr;
  // Optionally, format as dd/mm/yyyy for display
  const [y, m, d] = dateOnly.split('-');
  if (y && m && d) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  return dateOnly;
}

const FilterPanel = ({ filters, setFilters, t, onExport }: {
  filters: SoldProductsFilter;
  setFilters: React.Dispatch<React.SetStateAction<SoldProductsFilter>>;
  t: (key: string) => string;
  onExport: () => void;
}) => {
  const [clientQuery, setClientQuery] = React.useState('');
  const [clientOptions, setClientOptions] = React.useState<{ id: string; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [thicknessOptions, setThicknessOptions] = React.useState<number[] | null>(null);
  const [widthOptions, setWidthOptions] = React.useState<number[] | null>(null);
  React.useEffect(() => {
    getClientsPaginated(1, 1000).then(({ rows: clients }) => {
      setClientOptions(clients.map((c: any) => ({ id: c.id, name: c.name })));
    });
  }, []);
  React.useEffect(() => {
    getUniqueThicknessWidth().then(({ thicknesses, widths }) => {
      setThicknessOptions(thicknesses);
      setWidthOptions(widths);
    });
  }, []);
  const filteredClients = clientQuery
    ? clientOptions.filter(c => c.name.toLowerCase().includes(clientQuery.toLowerCase()))
    : clientOptions;
  const selectedClient = clientOptions.find(c => c.id === filters.clientId);
  return (
    <div className="bg-muted/50 p-4 rounded-md mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium mb-1">{t('analytics.dateRange')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={formatDateToDisplay(filters.startDate)}
              onChange={e => {
                const val = e.target.value;
                // Only allow dd/mm/yyyy or empty
                if (/^\d{0,2}(\/\d{0,2}(\/\d{0,4})?)?$/.test(val)) {
                  setFilters(f => ({ ...f, startDate: val.length === 10 ? formatDateToInput(val) : '' }));
                }
              }}
              className="input input-sm w-28"
              maxLength={10}
            />
            <span>-</span>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={formatDateToDisplay(filters.endDate)}
              onChange={e => {
                const val = e.target.value;
                if (/^\d{0,2}(\/\d{0,2}(\/\d{0,4})?)?$/.test(val)) {
                  setFilters(f => ({ ...f, endDate: val.length === 10 ? formatDateToInput(val) : '' }));
                }
              }}
              className="input input-sm w-28"
              maxLength={10}
            />
          </div>
        </div>
        {/* Product Type */}
        <div>
          <label className="block text-xs font-medium mb-1">{t('analytics.productType')}</label>
          <select value={filters.productType || ''} onChange={e => setFilters(f => ({ ...f, productType: e.target.value }))} className="input input-sm">
            <option value="">{t('general.all')}</option>
            <option value="coil">{t('productTypes.coil')}</option>
            <option value="corrugated_sheet">{t('productTypes.corrugatedSheet')}</option>
            <option value="steel_slitting">{t('productTypes.steelSlitting')}</option>
          </select>
        </div>
        {/* Client Search Bar */}
        <div style={{ position: 'relative' }}>
          <label className="block text-xs font-medium mb-1">{t('analytics.client')}</label>
          <input
            type="text"
            className="input input-sm"
            placeholder={t('general.search')}
            value={selectedClient ? selectedClient.name : clientQuery}
            onChange={e => {
              setClientQuery(e.target.value);
              setFilters(f => ({ ...f, clientId: undefined }));
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
          />
          {showDropdown && filteredClients.length > 0 && (
            <div className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow w-full max-h-40 overflow-y-auto">
              <div
                className="px-3 py-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onMouseDown={() => {
                  setClientQuery('');
                  setFilters(f => ({ ...f, clientId: undefined }));
                }}
              >
                {t('general.all')}
              </div>
              {filteredClients.map(c => (
                <div
                  key={c.id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onMouseDown={() => {
                    setFilters(f => ({ ...f, clientId: c.id }));
                    setClientQuery('');
                    setShowDropdown(false);
                  }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Thickness Chips */}
      <div className="mt-4">
        <label className="block text-xs font-medium mb-1">{t('analytics.thickness')}</label>
        <div className="flex flex-wrap">
          {thicknessOptions === null ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : thicknessOptions.length === 0 ? (
            <span className="text-xs text-gray-400">-</span>
          ) : thicknessOptions.map(val => (
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
        <label className="block text-xs font-medium mb-1">{t('analytics.width')}</label>
        <div className="flex flex-wrap">
          {widthOptions === null ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : widthOptions.length === 0 ? (
            <span className="text-xs text-gray-400">-</span>
          ) : widthOptions.map(val => (
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
          <label className="block text-xs font-medium mb-1">{t('analytics.unitPriceMin')}</label>
          <input
            type="number"
            min={0}
            step={1}
            value={filters.unitPriceMin ?? ''}
            onChange={e => setFilters(f => ({ ...f, unitPriceMin: e.target.value === '' ? undefined : Number(e.target.value) }))}
            className="input input-sm w-24"
            placeholder="min"
          />
        </div>
        <span className="mb-2">-</span>
        <div>
          <label className="block text-xs font-medium mb-1">{t('analytics.unitPriceMax')}</label>
          <input
            type="number"
            min={0}
            step={1}
            value={filters.unitPriceMax ?? ''}
            onChange={e => setFilters(f => ({ ...f, unitPriceMax: e.target.value === '' ? undefined : Number(e.target.value) }))}
            className="input input-sm w-24"
            placeholder="max"
          />
        </div>
      </div>
      {/* Payment Status Filter and Export Button Row */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <label className="block text-xs font-medium mb-1">{t('analytics.paymentStatus')}</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: t('general.all'), color: 'bg-gray-300 dark:bg-gray-700' },
              { value: 'paid', label: t('status.paid'), color: 'bg-green-500' },
              { value: 'unpaid', label: t('status.unpaid'), color: 'bg-red-500' },
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
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={onExport}
        >
          {t('general.export') || 'Exporter en Excel'}
        </button>
      </div>
    </div>
  );
};

const ProductsTable = ({ rows, loading, error, t }: {
  rows: SoldProduct[];
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
}) => (
  <div className="rounded-md border p-4 overflow-x-auto">
    {loading ? (
      <div className="text-center py-8">{t('general.loadingData')}</div>
    ) : error ? (
      <div className="text-center text-red-600 py-8">{error}</div>
    ) : (
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="px-3 py-2 text-left">{t('analytics.productName')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.clientName')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.thickness')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.width')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.quantitySold')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.weight')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.unitPrice')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.totalPrice')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.invoiceNumber')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.saleDate')}</th>
            <th className="px-3 py-2 text-left">{t('analytics.paymentStatus')}</th>
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
              <td className="px-3 py-2">{formatSaleDate(row.saleDate)}</td>
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
    [headers.saleDate]: formatSaleDate(row.saleDate),
    [headers.paymentStatus]: row.paymentStatus,
  }));
  // French summary labels
  const totalLabel = productType === "corrugated_sheet"
    ? "Quantité totale vendue (m)"
    : "Poids total vendu (tonne)";
  const totalValue = productType === "corrugated_sheet"
    ? (summary?.totalQuantity ?? 0).toLocaleString() + " m"
    : (summary?.totalWeight ?? 0).toLocaleString() + " tonne";
  const revenueLabel = "Chiffre d'affaires total (produits)";
  const revenueValue = (summary?.itemTotalRevenue ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' });
  const officialRevenueLabel = "Chiffre d'affaires officiel (ventes TTC)";
  const officialRevenueValue = (summary?.officialTotalRevenue ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' });
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
    },
    {
      [headers.productName]: officialRevenueLabel,
      [headers.clientName]: officialRevenueValue,
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
  const { t } = useLanguage();
  const [filters, setFilters] = useState<SoldProductsFilter>({});
  const [summary, setSummary] = useState<SoldProductsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Infinite scroll for all cases
  const {
    rows,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
  } = useInfiniteSoldProducts(filters);

  // Intersection observer for infinite scroll
  const sentinelRef = useIntersectionObserver(() => {
    if (hasMore && !loading) loadMore();
  });

  // Summary logic remains unchanged
  useEffect(() => {
    setSummaryLoading(true);
    setSummaryError(null);
    getSoldProductsSummary(filters)
      .then(setSummary)
      .catch(e => setSummaryError(e?.message || 'Failed to load summary'))
      .finally(() => setSummaryLoading(false));
  }, [filters]);

  // Add summaryConfig for both official and item-level total revenue
  const summaryConfig = [
    {
      label: (productType: string | undefined) =>
        productType === "corrugated_sheet" ? t('analytics.totalQuantitySold') : t('analytics.totalWeightSold'),
      value: (summary: SoldProductsSummary, productType: string | undefined) =>
        productType === "corrugated_sheet"
          ? (summary.totalQuantity ?? 0).toLocaleString() + " m"
          : (summary.totalWeight ?? 0).toLocaleString() + " Ton",
      bg: "bg-blue-50",
    },
    {
      label: () => t('analytics.officialTotalRevenue') || "Chiffre d'affaires officiel",
      value: (summary: SoldProductsSummary) =>
        (summary.officialTotalRevenue ?? 0).toLocaleString("fr-FR") + " DA",
      bg: "bg-green-100",
      tooltip: t('analytics.officialTotalRevenueTooltip') || "Somme des ventes TTC (factures officielles)",
    },
    {
      label: () => t('analytics.itemTotalRevenue') || "Chiffre d'affaires produits",
      value: (summary: SoldProductsSummary) =>
        (summary.itemTotalRevenue ?? 0).toLocaleString("fr-FR") + " DA",
      bg: "bg-green-50",
      tooltip: t('analytics.itemTotalRevenueTooltip') || "Somme des montants des produits vendus (avec TVA)",
    },
    {
      label: () => t('analytics.uniqueClients'),
      value: (summary: SoldProductsSummary) =>
        (summary.uniqueClients ?? 0).toLocaleString(),
      bg: "bg-pink-50",
    },
  ];

  return (
    <MainLayout title={t('analytics.title') || 'Sold Products Analytics'}>
      <div className="space-y-6">
        <FilterPanel filters={filters} setFilters={setFilters} t={t} onExport={() => exportToExcel(rows, summary, filters.productType)} />
        <SummaryCards summary={summary} loading={summaryLoading} error={summaryError} productType={filters.productType} t={t} summaryConfig={summaryConfig} />
        <div className="rounded-md border p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-3 py-2 text-left">{t('analytics.productName')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.clientName')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.thickness')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.width')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.quantitySold')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.weight')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.unitPrice')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.totalPrice')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.invoiceNumber')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.saleDate')}</th>
                <th className="px-3 py-2 text-left">{t('analytics.paymentStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    {t('general.noResults')}
                  </td>
                </tr>
              )}
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
                  <td className="px-3 py-2">{formatSaleDate(row.saleDate)}</td>
                  <td className="px-3 py-2">{row.paymentStatus || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div ref={sentinelRef} />
          {loading && hasMore && (
            <div className="flex justify-center items-center py-4">
              <Spinner size={24} />
              <span className="ml-2">{t('general.loading')}</span>
            </div>
          )}
          {!hasMore && rows.length > 0 && !loading && (
            <div className="text-center py-4 text-gray-400">
              {t('general.allDataLoaded')}
            </div>
          )}
          {error && (
            <div className="text-center py-4 text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

// Update SummaryCards to show tooltips if present
const SummaryCards = ({ summary, loading, error, productType, t, summaryConfig }: {
  summary: SoldProductsSummary | null;
  loading: boolean;
  error: string | null;
  productType: string | undefined;
  t: (key: string) => string;
  summaryConfig: any[];
}) => (
  <div className="w-full flex justify-center">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 w-full max-w-6xl">
      {loading ? (
        <div className="col-span-4 text-center py-8">{t('general.loadingSummary')}</div>
      ) : error ? (
        <div className="col-span-4 text-center text-red-600 py-8">{error}</div>
      ) : summary ? (
        summaryConfig.map((conf, idx) => (
          <div
            key={idx}
            className={`rounded-xl shadow-md p-3 flex flex-col items-center ${conf.bg} border border-gray-100 transition-all duration-200`}
            title={conf.tooltip || ''}
          >
            <span className="text-sm text-gray-500 mb-1 text-center font-medium tracking-wide">{conf.label(productType)}</span>
            <span className="text-xl font-extrabold text-gray-900 text-center">{conf.value(summary, productType)}</span>
          </div>
        ))
      ) : null}
    </div>
  </div>
);

export default SoldProductsAnalytics; 