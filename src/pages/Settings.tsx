
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
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

const Settings = () => {
  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  const handleImportData = () => {
    toast.info('Data import feature will be available in the next update');
  };

  const handleExportData = () => {
    toast.info('Data export feature will be available in the next update');
  };

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="company">Company Profile</TabsTrigger>
            <TabsTrigger value="invoice">Invoice Settings</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general application settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded-md"
                    defaultValue="en"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="w-full p-2 border rounded-md"
                    defaultValue="usd"
                  >
                    <option value="usd">USD ($)</option>
                    
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" defaultChecked />
                  <Label htmlFor="notifications">
                    Enable email notifications
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="darkMode" />
                  <Label htmlFor="darkMode">Dark Mode</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Update your company information that appears on invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    defaultValue="PPGI Coils Manufacturing"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="contact@ppgicoils.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      defaultValue="+1 (555) 987-6543"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    defaultValue="123 Factory Road, Industrial Zone, Manufacturing City, 10001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input id="taxId" defaultValue="TAX-12345678" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Company Logo</Label>
                  <Input id="logo" type="file" />
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
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>
                  Configure how invoices are generated and numbered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                  <Input id="invoicePrefix" defaultValue="INV-" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                  <Input id="nextInvoiceNumber" defaultValue="10001" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Default Payment Terms (days)</Label>
                  <Input id="paymentTerms" type="number" defaultValue="30" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Default Invoice Notes</Label>
                  <Textarea
                    id="notes"
                    defaultValue="Thank you for your business. Please make payment within the specified terms."
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="autoPdfGeneration" defaultChecked />
                  <Label htmlFor="autoPdfGeneration">
                    Generate PDF automatically
                  </Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
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
