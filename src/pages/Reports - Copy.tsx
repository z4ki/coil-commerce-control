import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import ExcelReportGenerator from '../components/reports/ExcelReportGenerator';

const Reports = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">{t('reports.pageTitle')}</h1>
      <ExcelReportGenerator />
      </div>
  );
};

export default Reports;
