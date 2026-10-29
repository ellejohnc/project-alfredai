import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'alfred_bookmarked_articles';

export interface BookmarkedItem {
  id: string;
  type: 'blog' | 'guide' | 'webinar';
  title: string;
  savedAt: string;
}

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedItem[]>([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  const saveBookmarks = useCallback((items: BookmarkedItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setBookmarks(items);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  const addBookmark = useCallback((item: Omit<BookmarkedItem, 'savedAt'>) => {
    const newItem: BookmarkedItem = {
      ...item,
      savedAt: new Date().toISOString(),
    };
    const updated = [...bookmarks.filter(b => b.id !== item.id), newItem];
    saveBookmarks(updated);
    return true;
  }, [bookmarks, saveBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    saveBookmarks(updated);
  }, [bookmarks, saveBookmarks]);

  const isBookmarked = useCallback((id: string) => {
    return bookmarks.some(b => b.id === id);
  }, [bookmarks]);

  const toggleBookmark = useCallback((item: Omit<BookmarkedItem, 'savedAt'>) => {
    if (isBookmarked(item.id)) {
      removeBookmark(item.id);
      return false;
    } else {
      addBookmark(item);
      return true;
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  const getBookmarksByType = useCallback((type: BookmarkedItem['type']) => {
    return bookmarks.filter(b => b.type === type);
  }, [bookmarks]);

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
    getBookmarksByType,
  };
};
