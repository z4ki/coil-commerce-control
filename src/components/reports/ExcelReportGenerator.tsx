import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateInput } from '../../utils/format';
import {
  generateSalesReport,
  generateInventoryReport,
  generateProductPerformanceReport,
  generateCustomerAnalyticsReport
} from '../../utils/excelService';
import { FileSpreadsheet, Download } from 'lucide-react';

type ReportType = 'sales' | 'inventory' | 'product' | 'customer';

interface ReportOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeColumns: string[];
}

interface ExcelReportGeneratorProps {
  onClose?: () => void;
}

const ExcelReportGenerator: React.FC<ExcelReportGeneratorProps> = ({ onClose }) => {
  const { sales, clients } = useApp();
  const { t } = useLanguage();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1), // Start of current year
      end: new Date(),
    },
    includeColumns: []
  });

  // Available columns for each report type
  const columnOptions = {
    sales: [
      'Date',
      'Client',
      'Company',
      'Invoice Number',
      'Total HT',
      'TVA',
      'Total TTC',
      'Payment Method',
      'Status'
    ],
    inventory: [
      'Coil Reference',
      'Thickness',
      'Width',
      'Top Coat RAL',
      'Back Coat RAL',
      'Total Weight (kg)',
      'Total Quantity',
      'Last Price'
    ],
    product: [
      'Product',
      'Total Quantity',
      'Total Revenue',
      'Average Price',
      'Number of Sales'
    ],
    customer: [
      'Client Name',
      'Company',
      'Total Purchases',
      'Total Revenue',
      'Average Order Value',
      'Last Purchase Date'
    ]
  };

  // Sort options for each report type
  const sortOptions = {
    sales: ['Date', 'Total HT', 'Total TTC'],
    inventory: ['Coil Reference', 'Total Weight (kg)', 'Total Quantity', 'Last Price'],
    product: ['Total Quantity', 'Total Revenue', 'Average Price', 'Number of Sales'],
    customer: ['Total Purchases', 'Total Revenue', 'Average Order Value', 'Last Purchase Date']
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      let blob: Blob;
      const reportOptions = {
        dateRange: options.dateRange,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        columns: options.includeColumns
      };

      switch (reportType) {
        case 'sales':
          blob = generateSalesReport(sales, clients, reportOptions);
          break;
        case 'inventory':
          blob = generateInventoryReport(sales);
          break;
        case 'product':
          blob = generateProductPerformanceReport(sales);
          break;
        case 'customer':
          blob = generateCustomerAnalyticsReport(sales, clients);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${formatDateInput(new Date())}.xlsx`;      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Close the dialog after successful generation
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <FileSpreadsheet className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">{t('reports.title')}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label>{t('reports.type')}</Label>
          <Select
            value={reportType}
            onValueChange={(value: ReportType) => setReportType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('reports.selectType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">{t('reports.types.sales')}</SelectItem>
              <SelectItem value="inventory">{t('reports.types.inventory')}</SelectItem>
              <SelectItem value="product">{t('reports.types.product')}</SelectItem>
              <SelectItem value="customer">{t('reports.types.customer')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('reports.startDate')}</Label>
            <Input
              type="date"
              value={formatDateInput(options.dateRange.start)}
              onChange={(e) => setOptions({
                ...options,
                dateRange: {
                  ...options.dateRange,
                  start: new Date(e.target.value)
                }
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('reports.endDate')}</Label>
            <Input
              type="date"
              value={formatDateInput(options.dateRange.end)}
              onChange={(e) => setOptions({
                ...options,
                dateRange: {
                  ...options.dateRange,
                  end: new Date(e.target.value)
                }
              })}
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <Label>{t('reports.sortBy')}</Label>
          <Select
            value={options.sortBy}
            onValueChange={(value) => setOptions({ ...options, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('reports.selectSortField')} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions[reportType].map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('reports.sortOrder')}</Label>
          <Select
            value={options.sortOrder}
            onValueChange={(value: 'asc' | 'desc') => setOptions({ ...options, sortOrder: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('reports.selectSortOrder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t('reports.ascending')}</SelectItem>
              <SelectItem value="desc">{t('reports.descending')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Column Selection */}
      <div className="space-y-2">
        <Label>{t('reports.columns')}</Label>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {columnOptions[reportType].map((column) => (
            <div key={column} className="flex items-center space-x-2">
              <Checkbox
                id={column}
                checked={options.includeColumns.includes(column)}
                onCheckedChange={(checked) => {
                  setOptions({
                    ...options,
                    includeColumns: checked
                      ? [...options.includeColumns, column]
                      : options.includeColumns.filter((col) => col !== column)
                  });
                }}
              />
              <label
                htmlFor={column}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateReport}
        disabled={isGenerating}
        className="w-full sm:w-auto"
      >
        <Download className="mr-2 h-4 w-4" />
        {isGenerating ? t('reports.generating') : t('reports.generate')}
      </Button>
    </div>
  );
};

export default ExcelReportGenerator; 