// Type for Archive Category
export type ArchiveCategoryItem = {
  id?: number;
  name?: string;
  url?: string[];
  description?: string;
  category_name?: string;
};

export type ArchiveCategoryPagination = {
  page: number;
  limit: number;
  total: number;
  data: ArchiveCategoryItem[];
};

export type ArchiveCategoryResponse = {
  status: string;
  data: ArchiveCategoryPagination;
};

// Type for Category data
export type CategoryItem = {
  id_category: number;
  name: string;
  created_at: string;
  updated_at: string;
};

// ===== Category Pagination (ใช้กับ /archive/category) =====
export type CategoryPagination = {
  page: number;
  limit: number;
  total: number;
  data: CategoryItem[];
};

export type CategoryPaginationResponse = {
  status: string;
  data: CategoryPagination;
};

// ===== Props for Edit Achievement Component =====
export interface EditAchievProps {
  editingItem: ArchiveCategoryItem | null;
  originalItem: ArchiveCategoryItem | null;
  categories: CategoryItem[];
  API_URL: string;
  fetchData: () => Promise<void>;
  onClose: () => void;
}

// ===== Props for Manage Category Component =====
export interface ManageCategoryProps {
  API_URL: string;
  categories: CategoryItem[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  onClose: () => void;
}

// ===== Props for Create Category Component =====
export interface CreateCategoryProps {
  API_URL: string;
  onSuccess: (newCategory: CategoryItem) => void;
  onClose: () => void;
}

// ===== Props for Upload Achievement Component =====
export interface UploadAchievProps {
  isModalOpen: boolean;
  toggleModal: () => void;
  handleUpload: (
    title: string,
    description: string,
    category: string,
    images: File[],
  ) => void;
  categories: CategoryItem[];
}