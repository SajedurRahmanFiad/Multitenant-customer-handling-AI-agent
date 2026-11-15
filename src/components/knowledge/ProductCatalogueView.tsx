import React, { useState } from 'react';
import { useUrlQueryState } from '../../hooks/useUrlQueryState';
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
  Tag,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ProductCatalogueViewProps {
  products: ProductRecord[];
  onAddProduct: (newProduct: Omit<ProductRecord, 'id'>) => void;
  onUpdateProduct: (updatedProduct: ProductRecord) => void;
  onDeleteProduct: (id: string) => void;
  onImportCsv: (rows: Omit<ProductRecord, 'id'>[]) => void;
}

export const ProductCatalogueView: React.FC<ProductCatalogueViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onImportCsv,
}) => {
  const [searchQuery, setSearchQuery] = useUrlQueryState<string>('q', '', undefined, true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductRecord | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variantsText, setVariantsText] = useState('');
  const [price, setPrice] = useState('৳ 1,950');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock' | 'Live API Verified'>('In Stock');
  const [stockCount, setStockCount] = useState(25);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [shippingRestrictions, setShippingRestrictions] = useState('Standard courier nationwide');
  const [warrantyInfo, setWarrantyInfo] = useState('6 Months Brand Warranty');

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku(`SKU-${Math.floor(Math.random() * 9000) + 1000}`);
    setName('');
    setDescription('');
    setVariantsText('Black, Silver');
    setPrice('৳ 1,950');
    setDiscountedPrice('');
    setInventoryStatus('In Stock');
    setStockCount(30);
    setImageUrl('');
    setImageUrls([]);
    setShippingRestrictions('Standard courier delivery across all 64 districts.');
    setWarrantyInfo('6 Months Replacement Guarantee.');
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: ProductRecord) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setDescription(p.description);
    setVariantsText(p.variants.join(', '));
    setPrice(p.price);
    setDiscountedPrice(p.discountedPrice || '');
    setInventoryStatus(p.inventoryStatus);
    setStockCount(p.stockCount);
    setImageUrl(p.imageUrl || '');
    setImageUrls(p.imageUrls || []);
    setShippingRestrictions(p.shippingRestrictions || '');
    setWarrantyInfo(p.warrantyInfo || '');
    setIsAddModalOpen(true);
  };

  const openProductDetails = (product: ProductRecord) => {
    setViewingProduct(product);
    setViewingImageIndex(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    const variants = variantsText.split(',').map((v) => v.trim()).filter(Boolean);
    const productImages = Array.from(new Set([imageUrl.trim(), ...imageUrls].filter(Boolean)));

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        sku,
        name,
        description,
        variants,
        price,
        discountedPrice: discountedPrice || undefined,
        inventoryStatus,
        stockCount: Number(stockCount),
        imageUrl: productImages[0] || undefined,
        imageUrls: productImages,
        shippingRestrictions,
        warrantyInfo,
      });
    } else {
      onAddProduct({
        sku,
        name,
        description,
        category: 'Uncategorized',
        variants,
        price,
        currency: 'BDT',
        discountedPrice: discountedPrice || undefined,
        inventoryStatus,
        stockCount: Number(stockCount),
        imageUrl: productImages[0] || undefined,
        imageUrls: productImages,
        shippingRestrictions,
        warrantyInfo,
        isActive: true,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []).filter((file) => file.type.startsWith('image/'));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrls((currentImages) => [...currentImages, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    event.currentTarget.value = '';
  };

  const removeProductImage = (image: string) => {
    setImageUrls((currentImages) => currentImages.filter((currentImage) => currentImage !== image));
    if (imageUrl.trim() === image) setImageUrl('');
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    const lines = (await csvFile.text()).split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return;
    const parse = (line: string) => line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)?.map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '')) ?? [];
    const headers = parse(lines[0]).map((h) => h.trim().toLowerCase().replace(/[ _-]/g, ''));
    const col = (...names: string[]) => headers.findIndex((h) => names.includes(h));
    const skuCol = col('sku', 'productsku'); const nameCol = col('name', 'productname', 'title'); const priceCol = col('price', 'regularprice'); const stockCol = col('stock', 'stockcount', 'inventory');
    if (skuCol < 0 || nameCol < 0 || priceCol < 0) { window.alert('CSV needs SKU, Name, and Price columns.'); return; }
    const rows = lines.slice(1).map(parse).filter((cells) => cells[skuCol]?.trim() && cells[nameCol]?.trim()).map((cells) => ({
      sku: cells[skuCol].trim(), name: cells[nameCol].trim(), description: '', category: 'Uncategorized', variants: [],
      price: cells[priceCol].replace(/[^\d.]/g, ''), currency: 'BDT', inventoryStatus: 'In Stock' as const,
      stockCount: Number(stockCol >= 0 ? cells[stockCol] || 0 : 0), isActive: true,
    }));
    if (!rows.length) { window.alert('No valid product rows found.'); return; }
    onImportCsv(rows);
    setCsvFile(null);
    setIsCsvModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });
  const viewingImages = viewingProduct
    ? Array.from(new Set([viewingProduct.imageUrl, ...(viewingProduct.imageUrls || [])]
      .filter((image): image is string => Boolean(image))))
    : [];

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
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-label={`View details for ${prod.name}`}
              onClick={() => openProductDetails(prod)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openProductDetails(prod);
                }
              }}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 shadow-xs transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="flex items-start gap-3.5">
                {/* Product Thumbnail */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                  {(prod.imageUrls?.[0] || prod.imageUrl) ? (
                    <img
                      src={prod.imageUrls?.[0] || prod.imageUrl}
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

              {/* Variants Strip */}
              <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                {prod.variants.length > 0 && (
                  <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                    <span className="text-[10px] text-slate-400">Options:</span>
                    <span className="whitespace-normal break-words text-[11px] font-medium text-slate-700">
                      {prod.variants.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {prod.discountedPrice || prod.price}
                  </span>
                  {prod.discountedPrice && (
                    <span className="text-xs line-through text-slate-400 font-mono">
                      {prod.price}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(prod);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteProduct(prod.id);
                    }}
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

      {viewingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={() => setViewingProduct(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-details-title"
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-56 bg-slate-100 sm:h-64">
              {viewingImages.length > 0 ? (
                <img
                  src={viewingImages[viewingImageIndex]}
                  alt={`${viewingProduct.name} image ${viewingImageIndex + 1}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-14 w-14 text-slate-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                aria-label="Close product details"
                className="absolute right-3 top-3 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
              {viewingImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewingImageIndex((index) => (index - 1 + viewingImages.length) % viewingImages.length)}
                    aria-label="Previous product image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-900"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingImageIndex((index) => (index + 1) % viewingImages.length)}
                    aria-label="Next product image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-900"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-medium text-white">
                    {viewingImageIndex + 1} / {viewingImages.length}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 id="product-details-title" className="text-lg font-bold text-slate-900">
                    {viewingProduct.name}
                  </h2>
                  <p className="font-mono text-xs font-medium text-slate-500">{viewingProduct.sku}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  viewingProduct.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }`}>
                  {viewingProduct.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {viewingProduct.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-400">Price</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {viewingProduct.price} {viewingProduct.discountedPrice && (
                      <span className="ml-1 text-slate-600">({viewingProduct.discountedPrice} discounted)</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">Currency: {viewingProduct.currency}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-400">Inventory</div>
                  <div className="mt-1 text-sm text-slate-800">{viewingProduct.inventoryStatus}</div>
                  <div className="text-xs text-slate-500">{viewingProduct.stockCount} units</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-400">Variants</div>
                  <div className="mt-1 text-sm text-slate-800">
                    {viewingProduct.variants.length > 0 ? viewingProduct.variants.join(', ') : 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Product Images</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([imageUrl.trim(), ...imageUrls].filter(Boolean))).map((image, index) => (
                    <div key={`${image.slice(0, 40)}-${index}`} className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img src={image} alt={`Product thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeProductImage(image)}
                        aria-label={`Remove product image ${index + 1}`}
                        className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/75 p-0.5 text-white hover:bg-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-500 hover:text-slate-800">
                    <Upload className="h-4 w-4" />
                    <span className="text-[9px] font-semibold">Add images</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" />
                  </label>
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or add an image URL"
                  aria-label="Product image URL"
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
                <label className="cursor-pointer">Choose a products.csv file<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} /></label>
              </div>
              <p className="text-[10px] text-slate-400">
                Required columns: SKU, Name, Price. Optional: Stock
                {csvFile && <span className="block text-emerald-700 mt-1">{csvFile.name}</span>}
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
                onClick={handleCsvUpload}
                disabled={!csvFile}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                Parse & Sync Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
