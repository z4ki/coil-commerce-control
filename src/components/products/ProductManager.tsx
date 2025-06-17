import React, { useState } from 'react';
import { Product, ProductType, ProductTemplate } from '../../types/products';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { TemplateManager } from './TemplateManager';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';

export function ProductManager() {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [templates, setTemplates] = useLocalStorage<ProductTemplate[]>('product-templates', []);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormMode('add');
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleFormSubmit = (data: Product) => {
    if (formMode === 'add') {
      setProducts((prev) => [
        ...prev,
        { ...data, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() },
      ]);
    } else if (formMode === 'edit' && editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...data, id: editingProduct.id, updatedAt: new Date() } : p
        )
      );
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleAddTemplate = (template: ProductTemplate) => {
    setTemplates((prev) => [...prev, template]);
  };

  const handleUpdateTemplate = (template: ProductTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...template, updatedAt: new Date() } : t))
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleApplyTemplate = (template: ProductTemplate) => {
    const baseProduct = {
      id: uuidv4(),
      saleId: '', // This will be set when added to a sale
      description: template.descriptionTemplate,
      quantity: 1,
      pricePerTon: template.defaultPrice,
      totalAmount: template.defaultPrice,
      itemOrder: products.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let newProduct: Product;
    switch (template.productType) {
      case 'coil':
        newProduct = {
          ...baseProduct,
          productType: 'coil',
          thickness: template.templateData.thickness || 0,
          width: template.templateData.width || 0,
          weight: template.templateData.weight || 0,
          topCoatRal: template.templateData.topCoatRal,
          backCoatRal: template.templateData.backCoatRal,
        } as const;
        break;
      case 'sheet':
        newProduct = {
          ...baseProduct,
          productType: 'sheet',
          length: template.templateData.length || 0,
          width: template.templateData.width || 0,
          thickness: template.templateData.thickness || 0,
          ralColor: template.templateData.ralColor,
          sheetCount: template.templateData.sheetCount || 1,
        } as const;
        break;
      case 'slitting':
        newProduct = {
          ...baseProduct,
          productType: 'slitting',
          originalWidth: template.templateData.originalWidth || 0,
          targetWidth: template.templateData.targetWidth || 0,
          thickness: template.templateData.thickness || 0,
          metersLength: template.templateData.metersLength || 0,
          stripsCount: template.templateData.stripsCount || 0,
          wastePercentage: template.templateData.wastePercentage || 0,
        } as const;
        break;
      case 'custom':
        newProduct = {
          ...baseProduct,
          productType: 'custom',
          customAttributes: template.templateData.customAttributes || {},
          unitType: template.templateData.unitType || 'ton',
        } as const;
        break;
    }

    setProducts((prev) => [...prev, newProduct]);
    setShowTemplates(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Templates
          </button>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Product
          </button>
        </div>
      </div>

      <ProductList products={products} onEdit={handleEdit} onDelete={handleDelete} />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
            <button
              onClick={handleFormCancel}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <ProductForm
              initialData={editingProduct || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-4xl relative">
            <button
              onClick={() => setShowTemplates(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <TemplateManager
              templates={templates}
              onAddTemplate={handleAddTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
        </div>
      )}
    </div>
  );
} 