import React, { useState } from 'react';
import { ProductRecord } from '../../types/knowledge';
import {
  Package,
  Plus,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Tag,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

interface ProductCatalogueViewProps {
  products: ProductRecord[];
  onAddProduct: (newProduct: Omit<ProductRecord, 'id'>) => void;
  onUpdateProduct: (updatedProduct: ProductRecord) => void;
  onDeleteProduct: (id: string) => void;
  onImportCsv: (importedCount: number) => void;
}

export const ProductCatalogueView: React.FC<ProductCatalogueViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onImportCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [variantsText, setVariantsText] = useState('');
  const [price, setPrice] = useState('৳ 1,950');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock' | 'Live API Verified'>('In Stock');
  const [stockCount, setStockCount] = useState(25);
  const [imageUrl, setImageUrl] = useState('');
  const [shippingRestrictions, setShippingRestrictions] = useState('Standard courier nationwide');
  const [warrantyInfo, setWarrantyInfo] = useState('6 Months Brand Warranty');
  const [productUrl, setProductUrl] = useState('');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku(`SKU-${Math.floor(Math.random() * 9000) + 1000}`);
    setName('');
    setDescription('');
    setCategory('Electronics');
    setVariantsText('Black, Silver');
    setPrice('৳ 1,950');
    setDiscountedPrice('');
    setInventoryStatus('In Stock');
    setStockCount(30);
    setImageUrl('');
    setShippingRestrictions('Standard courier delivery across all 64 districts.');
    setWarrantyInfo('6 Months Replacement Guarantee.');
    setProductUrl('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: ProductRecord) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setDescription(p.description);
    setCategory(p.category);
    setVariantsText(p.variants.join(', '));
    setPrice(p.price);
    setDiscountedPrice(p.discountedPrice || '');
    setInventoryStatus(p.inventoryStatus);
    setStockCount(p.stockCount);
    setImageUrl(p.imageUrl || '');
    setShippingRestrictions(p.shippingRestrictions || '');
    setWarrantyInfo(p.warrantyInfo || '');
    setProductUrl(p.productUrl || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    const variants = variantsText.split(',').map((v) => v.trim()).filter(Boolean);

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        sku,
        name,
        description,
        category,
        variants,
        price,
        discountedPrice: discountedPrice || undefined,
        inventoryStatus,
        stockCount: Number(stockCount),
        imageUrl: imageUrl || undefined,
        shippingRestrictions,
        warrantyInfo,
        productUrl: productUrl || undefined,
      });
    } else {
      onAddProduct({
        sku,
        name,
        description,
        category,
        variants,
        price,
        currency: 'BDT',
        discountedPrice: discountedPrice || undefined,
        inventoryStatus,
        stockCount: Number(stockCount),
        imageUrl: imageUrl || undefined,
        shippingRestrictions,
        warrantyInfo,
        productUrl: productUrl || undefined,
        isActive: true,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleSimulateCsvUpload = () => {
    onImportCsv(12);
    setIsCsvModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by SKU, name or spec..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700 shrink-0"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No products match your search or filter.
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start gap-3.5">
                {/* Product Thumbnail */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Package className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">
                      {prod.sku}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        prod.inventoryStatus === 'In Stock'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : prod.inventoryStatus === 'Low Stock'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {prod.inventoryStatus} ({prod.stockCount} left)
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {prod.name}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>
              </div>

              {/* Price & Variants Strip */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {prod.discountedPrice || prod.price}
                  </span>
                  {prod.discountedPrice && (
                    <span className="text-xs line-through text-slate-400 font-mono">
                      {prod.price}
                    </span>
                  )}
                </div>

                {prod.variants.length > 0 && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-[10px] text-slate-400">Options:</span>
                    <span className="text-[11px] font-medium text-slate-700 truncate max-w-[140px]">
                      {prod.variants.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Specs & Warranties */}
              <div className="text-[11px] text-slate-400 space-y-1">
                {prod.warrantyInfo && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{prod.warrantyInfo}</span>
                  </div>
                )}
                {prod.shippingRestrictions && (
                  <div className="text-slate-400 line-clamp-1">
                    Shipping: {prod.shippingRestrictions}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  Category: <strong className="text-slate-700">{prod.category}</strong>
                </div>

                <div className="flex items-center gap-1">
                  {prod.productUrl && (
                    <a
                      href={prod.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Open storefront product link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(prod)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(prod.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Edit Product Item' : 'Add Product to Knowledge'}
                </h3>
                <p className="text-xs text-slate-500">
                  Allow the AI to accurately check specs, variants and pricing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Wearables & Electronics"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smart Fitness Tracker v2 (Black)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Key Specs</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Battery life, material, dimensions, compatibility..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (Regular)</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="৳ 2,450"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discounted Price (Optional)</label>
                  <input
                    type="text"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(e.target.value)}
                    placeholder="৳ 2,150"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Status</label>
                  <select
                    value={inventoryStatus}
                    onChange={(e) => setInventoryStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Live API Verified">Live API Tool Fetch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inventory Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={stockCount}
                    onChange={(e) => setStockCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Variants (Comma separated)</label>
                <input
                  type="text"
                  value={variantsText}
                  onChange={(e) => setVariantsText(e.target.value)}
                  placeholder="Midnight Black, Ocean Blue, Rose Pink"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image Thumbnail URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-xs"
                >
                  {editingProduct ? 'Save Product' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Import Product Catalogue CSV</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-800">
                Upload products.csv or inventory.xlsx
              </div>
              <p className="text-[10px] text-slate-400">
                Supported columns: SKU, Name, Category, Price, Stock, Variants
              </p>
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="font-semibold text-slate-700">Auto Field Mapping:</div>
              <div className="text-[11px] text-slate-500">
                ✓ Duplicate SKU detection enabled<br />
                ✓ Prices will be converted to local currency (BDT)<br />
                ✓ Images will be cached for faster visual recognition
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateCsvUpload}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Parse & Sync 12 Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
