import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Product,
  ProductType,
  coilProductSchema,
  sheetProductSchema,
  slittingProductSchema,
  customProductSchema,
} from '../../types/products';
import { calculateProductValues } from '../../utils/product-calculations';

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [productType, setProductType] = React.useState<ProductType>(
    initialData?.productType || 'coil'
  );

  // Get the appropriate schema based on product type
  const getSchema = () => {
    switch (productType) {
      case 'coil':
        return coilProductSchema;
      case 'sheet':
        return sheetProductSchema;
      case 'slitting':
        return slittingProductSchema;
      case 'custom':
        return customProductSchema;
      default:
        return coilProductSchema;
    }
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Product>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      productType,
      ...initialData,
    },
  });

  // Watch values for real-time calculations
  const watchedValues = watch();

  // Calculate values based on product type
  const calculatedValues = React.useMemo(() => {
    if (!watchedValues.productType) return null;
    return calculateProductValues(watchedValues as any);
  }, [watchedValues]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Product Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Type
        </label>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value as ProductType)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="coil">Coil</option>
          <option value="sheet">Sheet</option>
          <option value="slitting">Slitting</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Common Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            )}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price per Ton
          </label>
          <Controller
            name="pricePerTon"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            )}
          />
          {errors.pricePerTon && (
            <p className="mt-1 text-sm text-red-600">{errors.pricePerTon.message}</p>
          )}
        </div>
      </div>

      {/* Product Type Specific Fields */}
      {productType === 'coil' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thickness (mm)
            </label>
            <Controller
              name="thickness"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Width (mm)
            </label>
            <Controller
              name="width"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weight (tons)
            </label>
            <Controller
              name="weight"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
        </div>
      )}

      {productType === 'sheet' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Length (mm)
            </label>
            <Controller
              name="length"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Width (mm)
            </label>
            <Controller
              name="width"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thickness (mm)
            </label>
            <Controller
              name="thickness"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sheet Count
            </label>
            <Controller
              name="sheetCount"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
        </div>
      )}

      {productType === 'slitting' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Original Width (mm)
            </label>
            <Controller
              name="originalWidth"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Width (mm)
            </label>
            <Controller
              name="targetWidth"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thickness (mm)
            </label>
            <Controller
              name="thickness"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Meters Length
            </label>
            <Controller
              name="metersLength"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Waste Percentage (%)
            </label>
            <Controller
              name="wastePercentage"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
        </div>
      )}

      {/* Calculated Values Display */}
      {calculatedValues && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900">Calculated Values</h3>
          <dl className="mt-2 grid grid-cols-2 gap-4">
            {calculatedValues.weight !== undefined && (
              <>
                <dt className="text-sm font-medium text-gray-500">Weight</dt>
                <dd className="text-sm text-gray-900">{calculatedValues.weight} tons</dd>
              </>
            )}
            {calculatedValues.stripsCount !== undefined && (
              <>
                <dt className="text-sm font-medium text-gray-500">Strips Count</dt>
                <dd className="text-sm text-gray-900">{calculatedValues.stripsCount}</dd>
              </>
            )}
            {calculatedValues.yield !== undefined && (
              <>
                <dt className="text-sm font-medium text-gray-500">Yield</dt>
                <dd className="text-sm text-gray-900">{calculatedValues.yield}%</dd>
              </>
            )}
            <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
            <dd className="text-sm text-gray-900">{calculatedValues.totalAmount}</dd>
          </dl>
        </div>
      )}

      {/* Form Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save
        </button>
      </div>
    </form>
  );
} 