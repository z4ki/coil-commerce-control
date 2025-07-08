import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useTheme } from 'next-themes';
import { PlusCircle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import * as settingsService from '@/services/settingsService';
import type { AppSettings, CompanyProfile } from '@/types/index';
import { useInvoiceSettings } from '@/context/InvoiceSettingsContext';
import { exportDb, importDb } from '@/services/settingsService';
import { core } from '@tauri-apps/api';

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { settings: invoiceSettings, updateSettings, addPrefix, removePrefix, setDefaultPrefix } = useInvoiceSettings();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyProfileUpdate = async (updates: Partial<CompanyProfile>) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      company: {
        ...settings.company,
        ...updates
      }
    };
    
    setSettings(updatedSettings);
  };
  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      const updateData: UpdateSettingsInput = {
        company: settings.company,
        currency: settings.currency
      };
      await settingsService.updateSettings(updateData);
      toast.success('Settings saved successfully');
      await loadSettings(); // Reload settings to get server state
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleImportData = () => {
    toast.info('Data import feature will be available in the next update');
  };

  const handleExportData = () => {
    toast.info('Data export feature will be available in the next update');
  };

  const handleExportDb = async () => {
    try {
      let exportPath: string | undefined = undefined;
      // Only show dialog if running in Tauri
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;
        const defaultFileName = `salesmanager-db-${dateStr}.sqlite`;
        exportPath = await core.invoke('plugin:dialog|save', {
          title: 'Exporter la base de données',
          defaultPath: defaultFileName,
          filters: [
            { name: 'SQLite Database', extensions: ['sqlite', 'db'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        }) as string;
        if (!exportPath) {
          toast.info('Export annulé');
          return;
        }
      }
      const result = await exportDb(exportPath);
      toast.success(result);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleExportDbWithDialog = async () => {
    try {
      let exportPath: string | undefined = undefined;
      // Only show dialog if running in Tauri
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        exportPath = await core.invoke('plugin:dialog|save', {
          title: 'Exporter la base de données',
          defaultPath: 'exported_db.sqlite',
          filters: [
            { name: 'SQLite Database', extensions: ['sqlite', 'db'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        }) as string;
        if (!exportPath) {
          toast.info('Export annulé');
          return;
        }
      }
      const result = await exportDb(exportPath);
      toast.success(result);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImportDb = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }
    try {
      // Read the file path (Tauri only allows file path, not File object)
      // @ts-ignore
      const filePath = importFile.path || importFile.name;
      const result = await importDb({ import_path: filePath });
      toast.success(result);
      await loadSettings();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImportFile(e.dataTransfer.files[0]);
      handleImportDb();
    }
  };

  if (loading || !settings || !settings.company) {
    return (
      <MainLayout title="Settings">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="company">Société</TabsTrigger>
            <TabsTrigger value="invoice">Facture</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>
                  Paramètres généraux de l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="darkMode" 
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => {
                      setTheme(checked ? 'dark' : 'light');
                      if (settings) {
                        setSettings({
                          ...settings,
                          theme: checked ? 'dark' : 'light'
                        });
                      }
                    }}
                  />
                  <Label htmlFor="darkMode">Mode sombre</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Enregistrer</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de la société</CardTitle>
                <CardDescription>
                  Informations sur votre société
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de la société</Label>
                  <Input
                    id="companyName"
                    value={settings?.company.name || ''}
                    onChange={(e) => handleCompanyProfileUpdate({ name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings?.company.email || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={settings?.company.phone || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={settings?.company.address || ''}
                    onChange={(e) => handleCompanyProfileUpdate({ address: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nif">NIF</Label>
                    <Input
                      id="nif"
                      value={settings?.company.nif || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ nif: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input
                      id="nis"
                      value={settings?.company.nis || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ nis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rc">RC</Label>
                    <Input
                      id="rc"
                      value={settings?.company.rc || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ rc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai">AI</Label>
                    <Input
                      id="ai"
                      value={settings?.company.ai || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ ai: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rib">RIB</Label>
                    <Input
                      id="rib"
                      value={settings?.company.rib || ''}
                      onChange={(e) => handleCompanyProfileUpdate({ rib: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Enregistrer</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de la facture</CardTitle>
                <CardDescription>
                  Personnalisez les paramètres de vos factures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invoice Prefixes */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Préfixes de facture</h3>
                      <p className="text-sm text-muted-foreground">
                        Personnalisez les préfixes de vos factures
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="newPrefix"
                        placeholder="Nouveau préfixe"
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
                        Ajouter un préfixe
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
                            title="Définir comme préfixe par défaut"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removePrefix(prefix.value)}
                          className="ml-1 hover:text-destructive"
                          title="Supprimer le préfixe"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>                <div className="space-y-2">
                  <Label htmlFor="nextInvoiceNumber">Numéro de prochaine facture</Label>
                  <Input
                    id="nextInvoiceNumber"
                    type="number"                    value={invoiceSettings?.nextNumber || 1}
                    onChange={(e) => updateSettings({ nextNumber: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                  <Input
                    id="paymentTerms"
                    type="number"                    value={invoiceSettings?.paymentTerms || 0}
                    onChange={(e) => updateSettings({ paymentTerms: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Remarques par défaut</Label>
                  <Textarea
                    id="notes"                    value={invoiceSettings?.defaultNotes || ''}
                    onChange={(e) => updateSettings({ defaultNotes: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoInvoiceNumber"
                    checked={!!invoiceSettings.autoInvoiceNumber}
                    onCheckedChange={(checked) => updateSettings({ autoInvoiceNumber: checked })}
                  />
                  <Label htmlFor="autoInvoiceNumber">
                    Numérotation automatique des factures
                  </Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Enregistrer</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="import-export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import/Export Base de Données</CardTitle>
                <CardDescription>
                  Sauvegardez ou restaurez la base de données SQLite de l'application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportDb}>Exporter la base de données</Button>
                {/* <Button onClick={handleExportDbWithDialog} variant="outline">Exporter la base de données (dialogue)</Button> */}
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 mt-4 transition-colors ${isDragOver ? 'border-primary bg-primary/10' : 'border-muted'}`}
                  style={{ minHeight: 120 }}
                >
                  <span className="mb-2 text-muted-foreground">Glissez-déposez un fichier .sqlite ou .db ici pour l'importer</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".sqlite,.db"
                      onChange={e => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Button onClick={handleImportDb} variant="secondary">Importer la base de données</Button>
                  </div>
                  {importFile && <span className="mt-2 text-xs text-primary">Fichier sélectionné : {importFile.name}</span>}
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
