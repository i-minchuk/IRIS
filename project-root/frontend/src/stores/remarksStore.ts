/** Zustand store for remarks management */
import { create } from 'zustand';
import {
  Remark,
  RemarkListItem,
  RemarkFilter,
  RemarkStatistics,
  RemarkTag,
  RemarkCreateInput,
  RemarkUpdateInput,
  RemarkActionInput,
} from '@/types/remarks';
import {
  createRemark as apiCreateRemark,
  getRemarks as apiGetRemarks,
  getRemark as apiGetRemark,
  updateRemark as apiUpdateRemark,
  deleteRemark as apiDeleteRemark,
  addComment as apiAddComment,
  deleteComment as apiDeleteComment,
  performAction as apiPerformAction,
  linkRemarks as apiLinkRemarks,
  getStatistics as apiGetStatistics,
  getTags as apiGetTags,
  createTag as apiCreateTag,
  deleteTag as apiDeleteTag,
} from '@/api/remarks';

interface RemarksState {
  // State
  remarks: RemarkListItem[];
  currentRemark: Remark | null;
  statistics: RemarkStatistics | null;
  tags: RemarkTag[];
  filters: RemarkFilter;
  isLoading: boolean;
  error: string | null;
  total: number;

  // Actions - Remarks
  fetchRemarks: (filters?: Partial<RemarkFilter>) => Promise<void>;
  createRemark: (data: RemarkCreateInput) => Promise<Remark>;
  updateRemark: (id: string, data: RemarkUpdateInput) => Promise<Remark>;
  deleteRemark: (id: string) => Promise<void>;
  loadRemark: (id: string) => Promise<void>;
  setCurrentRemark: (remark: Remark | null) => void;

  // Actions - Comments
  addComment: (remarkId: string, text: string, isInternal?: boolean) => Promise<void>;
  deleteComment: (remarkId: string, commentId: number) => Promise<void>;

  // Actions - Actions
  performAction: (remarkId: string, action: RemarkActionInput) => Promise<void>;
  linkRemarks: (remarkId: string, relatedId: string) => Promise<void>;

  // Actions - Statistics
  fetchStatistics: (projectId?: number, documentId?: number) => Promise<void>;

  // Actions - Tags
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<RemarkTag>;
  deleteTag: (tagId: number) => Promise<void>;

  // Actions - Filters
  setFilters: (filters: Partial<RemarkFilter>) => void;
  resetFilters: () => void;

  // Actions - UI
  clearError: () => void;
}

const defaultFilters: RemarkFilter = {
  page: 1,
  page_size: 20,
  sort_by: 'priority',
  sort_order: 'desc',
};

export const useRemarksStore = create<RemarksState>((set, get) => ({
  // Initial state
  remarks: [],
  currentRemark: null,
  statistics: null,
  tags: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,
  total: 0,

  // Fetch remarks list
  fetchRemarks: async (additionalFilters) => {
    set({ isLoading: true, error: null });
    try {
      const filters = { ...get().filters, ...additionalFilters };
      const response = await apiGetRemarks(filters);
      set({
        remarks: response.items,
        total: response.total,
        filters: { ...filters },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch remarks',
        isLoading: false,
      });
    }
  },

  // Create remark
  createRemark: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const remark = await apiCreateRemark(data);
      await get().fetchRemarks();
      set({ isLoading: false });
      return remark;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create remark',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update remark
  updateRemark: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const remark = await apiUpdateRemark(id, data);
      await get().fetchRemarks();
      set({ isLoading: false });
      return remark;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update remark',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete remark
  deleteRemark: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteRemark(id);
      await get().fetchRemarks();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete remark',
        isLoading: false,
      });
      throw error;
    }
  },

  // Load single remark
  loadRemark: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const remark = await apiGetRemark(id);
      set({ currentRemark: remark, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load remark',
        isLoading: false,
      });
    }
  },

  setCurrentRemark: (remark) => set({ currentRemark: remark }),

  // Add comment
  addComment: async (remarkId, text, isInternal = true) => {
    set({ isLoading: true, error: null });
    try {
      await apiAddComment(remarkId, { text, is_internal: isInternal });
      await get().loadRemark(remarkId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add comment',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (remarkId, commentId) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteComment(remarkId, commentId);
      await get().loadRemark(remarkId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete comment',
        isLoading: false,
      });
      throw error;
    }
  },

  // Perform action
  performAction: async (remarkId, action) => {
    set({ isLoading: true, error: null });
    try {
      await apiPerformAction(remarkId, action);
      await get().loadRemark(remarkId);
      await get().fetchRemarks();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to perform action',
        isLoading: false,
      });
      throw error;
    }
  },

  // Link remarks
  linkRemarks: async (remarkId, relatedId) => {
    set({ isLoading: true, error: null });
    try {
      await apiLinkRemarks(remarkId, relatedId);
      await get().loadRemark(remarkId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to link remarks',
        isLoading: false,
      });
      throw error;
    }
  },

  // Fetch statistics
  fetchStatistics: async (projectId, documentId) => {
    set({ isLoading: true, error: null });
    try {
      const statistics = await apiGetStatistics(projectId, documentId);
      set({ statistics, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
        isLoading: false,
      });
    }
  },

  // Fetch tags
  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await apiGetTags();
      set({ tags, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
        isLoading: false,
      });
    }
  },

  // Create tag
  createTag: async (name, color) => {
    set({ isLoading: true, error: null });
    try {
      const tag = await apiCreateTag({ name, color });
      await get().fetchTags();
      set({ isLoading: false });
      return tag;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create tag',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete tag
  deleteTag: async (tagId) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteTag(tagId);
      await get().fetchTags();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete tag',
        isLoading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    const newFilters = { ...get().filters, ...filters };
    set({ filters: newFilters });
    get().fetchRemarks();
  },

  // Reset filters
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().fetchRemarks();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
