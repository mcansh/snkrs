export interface StockXResponse {
  ProductActivity: ProductActivity[];
  Pagination: Pagination;
}

export interface Pagination {
  limit: number;
  page: number;
  total: number;
  sort: string[];
  order: string[];
  lastPage: string;
  currentPage: string;
  nextPage: string;
  prevPage: undefined;
}

export interface ProductActivity {
  chainId: string;
  amount: number;
  createdAt: string;
  shoeSize: string;
  productId: undefined;
  skuUuid: string;
  state: string;
  customerId: undefined;
  localAmount: number;
  localCurrency: string;
}
