import React, { useState } from 'react';
import { ProductTemplate, ProductType } from '../../types/products';
import { v4 as uuidv4 } from 'uuid';

interface TemplateManagerProps {
  templates: ProductTemplate[];
  onAddTemplate: (template: ProductTemplate) => void;
  onUpdateTemplate: (template: ProductTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyTemplate: (template: ProductTemplate) => void;
}

export function TemplateManager({
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onApplyTemplate,
}: TemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<ProductTemplate>>({
    name: '',
    productType: 'coil',
    descriptionTemplate: '',
    defaultPrice: 0,
    templateData: {},
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template: ProductTemplate = {
      id: editingTemplate?.id || uuidv4(),
      name: formData.name!,
      productType: formData.productType!,
      descriptionTemplate: formData.descriptionTemplate!,
      defaultPrice: formData.defaultPrice!,
      templateData: formData.templateData!,
      isActive: formData.isActive!,
      createdAt: editingTemplate?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingTemplate) {
      onUpdateTemplate(template);
    } else {
      onAddTemplate(template);
    }

    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      productType: 'coil',
      descriptionTemplate: '',
      defaultPrice: 0,
      templateData: {},
      isActive: true,
    });
  };

  const handleEdit = (template: ProductTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Product Templates</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Template
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
            <h4 className="text-xl font-semibold mb-4">
              {editingTemplate ? 'Edit Template' : 'Add Template'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Product Type</label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value as ProductType })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="coil">Coil</option>
                  <option value="sheet">Sheet</option>
                  <option value="slitting">Slitting</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description Template</label>
                <input
                  type="text"
                  value={formData.descriptionTemplate}
                  onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default Price</label>
                <input
                  type="number"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white shadow rounded-lg p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{template.name}</h4>
                <p className="text-sm text-gray-500">{template.productType}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{template.descriptionTemplate}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {template.defaultPrice.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </span>
              <button
                onClick={() => onApplyTemplate(template)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 