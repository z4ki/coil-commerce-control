import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { useInvoiceSettings } from '../context/InvoiceSettingsContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { settings, updateSettings, updateCompanyProfile, updateInvoiceSettings } = useAppSettings();
  const { settings: invoiceSettings, addPrefix, removePrefix, setDefaultPrefix } = useInvoiceSettings();

  const handleSaveSettings = () => {
    toast.success(t('general.saveSuccess'));
  };

  const handleImportData = () => {
    toast.info('Data import feature will be available in the next update');
  };

  const handleExportData = () => {
    toast.info('Data export feature will be available in the next update');
  };

  return (
    <MainLayout title={t('general.settings')}>
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">{t('general.settings')}</TabsTrigger>
            <TabsTrigger value="company">{t('company.title')}</TabsTrigger>
            <TabsTrigger value="invoice">{t('invoice.title')}</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('general.settings')}</CardTitle>
                <CardDescription>
                  {t('general.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">{t('general.language')}</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value: 'en' | 'fr') => {
                      updateSettings({ language: value });
                      setLanguage(value);
                    }}
                  >
                    <SelectTrigger id="language" aria-label={t('general.language')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('general.currency')}</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value: 'DZD') => updateSettings({ currency: value })}
                  >
                    <SelectTrigger id="currency" aria-label={t('general.currency')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DZD">DZD (DA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                  />
                  <Label htmlFor="notifications">
                    {t('general.notifications')}
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
                  />
                  <Label htmlFor="darkMode">{t('general.darkMode')}</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>{t('general.save')}</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('company.title')}</CardTitle>
                <CardDescription>
                  {t('company.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('company.name')}</Label>
                  <Input
                    id="companyName"
                    value={settings.company.name}
                    onChange={(e) => updateCompanyProfile({ name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('company.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.company.email}
                      onChange={(e) => updateCompanyProfile({ email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('company.phone')}</Label>
                    <Input
                      id="phone"
                      value={settings.company.phone}
                      onChange={(e) => updateCompanyProfile({ phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">{t('company.address')}</Label>
                  <Textarea
                    id="address"
                    value={settings.company.address}
                    onChange={(e) => updateCompanyProfile({ address: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">{t('company.taxId')}</Label>
                    <Input
                      id="taxId"
                      value={settings.company.taxId}
                      onChange={(e) => updateCompanyProfile({ taxId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input
                      id="nis"
                      value={settings.company.nis}
                      onChange={(e) => updateCompanyProfile({ nis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rc">RC</Label>
                    <Input
                      id="rc"
                      value={settings.company.rc}
                      onChange={(e) => updateCompanyProfile({ rc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai">AI</Label>
                    <Input
                      id="ai"
                      value={settings.company.ai}
                      onChange={(e) => updateCompanyProfile({ ai: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('invoice.title')}</CardTitle>
                <CardDescription>
                  {t('invoice.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invoice Prefixes */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{t('invoice.prefixes')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('invoice.prefixesDescription')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="newPrefix"
                        placeholder={t('invoice.prefixPlaceholder')}
                        className="w-32"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById('newPrefix') as HTMLInputElement;
                          if (input.value) {
                            addPrefix(input.value.toUpperCase());
                            input.value = '';
                          }
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        {t('invoice.addPrefix')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {invoiceSettings.prefixes.map((prefix) => (
                      <Badge
                        key={prefix.value}
                        variant={prefix.isDefault ? "default" : "secondary"}
                        className="flex items-center gap-1 text-sm"
                      >
                        {prefix.value}
                        {!prefix.isDefault && (
                          <button
                            onClick={() => setDefaultPrefix(prefix.value)}
                            className="ml-1 hover:text-primary"
                            title={t('invoice.defaultPrefix')}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removePrefix(prefix.value)}
                          className="ml-1 hover:text-destructive"
                          title={t('invoice.deletePrefix')}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextInvoiceNumber">{t('invoice.nextNumber')}</Label>
                  <Input
                    id="nextInvoiceNumber"
                    type="number"
                    value={settings.invoice.nextNumber}
                    onChange={(e) => updateInvoiceSettings({ nextNumber: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">{t('invoice.paymentTerms')}</Label>
                  <Input
                    id="paymentTerms"
                    type="number"
                    value={settings.invoice.paymentTerms}
                    onChange={(e) => updateInvoiceSettings({ paymentTerms: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('invoice.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={settings.invoice.defaultNotes}
                    onChange={(e) => updateInvoiceSettings({ defaultNotes: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoPdfGeneration"
                    checked={settings.invoice.autoPdfGeneration}
                    onCheckedChange={(checked) => updateInvoiceSettings({ autoPdfGeneration: checked })}
                  />
                  <Label htmlFor="autoPdfGeneration">
                    {t('invoice.autoPdf')}
                  </Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>{t('general.save')}</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="import-export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import / Export Data</CardTitle>
                <CardDescription>
                  Manage your system data through import and export functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Import Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import data from Excel files. This will add new records without affecting existing ones.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="importFile">Select File (Excel format)</Label>
                      <Input id="importFile" type="file" />
                    </div>
                    <Button onClick={handleImportData}>Import Data</Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Export Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export your data to Excel format for backup or reporting.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select what to export</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="exportClients" defaultChecked />
                          <Label htmlFor="exportClients">Clients</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="exportSales" defaultChecked />
                          <Label htmlFor="exportSales">Sales</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="exportInvoices" defaultChecked />
                          <Label htmlFor="exportInvoices">Invoices</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="exportReports" />
                          <Label htmlFor="exportReports">Reports</Label>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleExportData}>Export Data</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
