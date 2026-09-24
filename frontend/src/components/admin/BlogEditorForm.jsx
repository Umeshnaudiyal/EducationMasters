'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { getImageUrl } from '@/utils/image';
import { cleanHtmlContent } from '@/utils/cleanHtml';
import JoditEditorWrapper from '@/components/admin/JoditEditorWrapper';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import AdminLoader from '@/components/admin/AdminLoader';
import SearchableSelectPanel from '@/components/admin/SearchableSelectPanel';
import { getAuthToken } from '@/utils/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function BlogEditorForm({ slugOrId = null, isEdit = false }) {
  const router = useRouter();
  const { data: session } = useSession();

  // Input References for Smooth Scrolling on Validation Errors
  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const contentRef = useRef(null);
  const metaTitleRef = useRef(null);
  const metaDescriptionRef = useRef(null);
  const categoriesRef = useRef(null);

  // Field-specific validation errors: { title: '...', slug: '...', content: '...', metaTitle: '...', metaDescription: '...', categories: '...' }
  const [errors, setErrors] = useState({});

  // Clear a specific field error when user interacts with it
  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Smooth scroll and focus on invalid field
  const scrollToField = (field) => {
    if (field === 'title' && titleRef.current) {
      titleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = titleRef.current.querySelector('input') || titleRef.current;
      input?.focus?.();
    } else if (field === 'slug' && slugRef.current) {
      slugRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = slugRef.current.querySelector('input') || slugRef.current;
      input?.focus?.();
    } else if (field === 'content' && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (field === 'metaTitle' && metaTitleRef.current) {
      setCollapseSEO(false);
      metaTitleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = metaTitleRef.current.querySelector('input') || metaTitleRef.current;
      input?.focus?.();
    } else if (field === 'metaDescription' && metaDescriptionRef.current) {
      setCollapseSEO(false);
      metaDescriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const textarea = metaDescriptionRef.current.querySelector('textarea') || metaDescriptionRef.current;
      textarea?.focus?.();
    } else if (field === 'categories' && categoriesRef.current) {
      setCollapseCategories(false);
      categoriesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Client-side Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!title || !title.trim()) {
      newErrors.title = 'Blog post title is required. Please enter a title.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Blog title must be at least 3 characters long.';
    }

    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      newErrors.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens.';
    }

    const strippedContent = (content || '').replace(/<[^>]*>/g, '').trim();
    if (!content || !content.trim() || strippedContent === '') {
      newErrors.content = 'Article content is required. Please write your article content.';
    }

    if (!metaTitle || !metaTitle.trim()) {
      newErrors.metaTitle = 'SEO Meta Title is required.';
    }

    if (!metaDescription || !metaDescription.trim()) {
      newErrors.metaDescription = 'SEO Meta Description is required.';
    }

    if (!selectedCategories || selectedCategories.length === 0) {
      newErrors.categories = 'Please select at least one category for this post.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstField = Object.keys(newErrors)[0];
      scrollToField(firstField);
      return false;
    }
    return true;
  };

  // Form State
  const isAuthor = session?.user?.role?.toLowerCase() === 'author' || session?.user?.role?.toLowerCase() === 'writer';
  const [actualId, setActualId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(Boolean(slugOrId));
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('publish');

  // Sync default status for author
  useEffect(() => {
    if (isAuthor && status === 'publish') {
      setStatus('pending');
    }
  }, [isAuthor, status]);

  // Right Sidebar State
  const [featuredMedia, setFeaturedMedia] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('-- All India --');
  const [selectedCategories, setSelectedCategories] = useState(['Article']);

  // Dynamic lists from DB
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryTab, setCategoryTab] = useState('all');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catPage, setCatPage] = useState(1);
  const [catTotal, setCatTotal] = useState(0);
  const [hasMoreCats, setHasMoreCats] = useState(false);
  const [loadingMoreCats, setLoadingMoreCats] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchingCats, setSearchingCats] = useState(false);

  // SEO Fields
  const [allowIndexing, setAllowIndexing] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Accordion Toggles
  const [collapseSEO, setCollapseSEO] = useState(false);
  const [collapsePublish, setCollapsePublish] = useState(false);
  const [collapseFeatured, setCollapseFeatured] = useState(false);
  const [collapseCategories, setCollapseCategories] = useState(false);
  const [collapseCountry, setCollapseCountry] = useState(false);
  const [collapseState, setCollapseState] = useState(false);

  // Media Library Modal
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState('editor'); // 'editor' | 'featured'

  // Status & Notifications
  const [fetchingBlog, setFetchingBlog] = useState(Boolean(slugOrId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  // Fetch Categories, Countries & States
  useEffect(() => {
    fetch(`${BACKEND_URL}/apis/v1/categories?page=1&limit=15`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCategoryList(data.data);
          setCatPage(1);
          setCatTotal(data.total || data.count || 0);
          setHasMoreCats((data.page || 1) < (data.pages || 1));
        }
      })
      .catch((err) => console.error('Error fetching categories:', err));

    fetch(`${BACKEND_URL}/apis/v1/countries?all=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setCountryList(data.data);
        }
      })
      .catch((err) => console.error('Error fetching countries:', err));

    fetch(`${BACKEND_URL}/apis/v1/states`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setStateList(data.data);
        }
      })
      .catch((err) => console.error('Error fetching states:', err));
  }, []);

  // Search Categories with debounce
  useEffect(() => {
    const term = categorySearch.trim();
    if (!term) {
      setSearchResults(null);
      setSearchingCats(false);
      return;
    }

    setSearchingCats(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/apis/v1/categories?search=${encodeURIComponent(term)}&limit=50`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSearchResults(data.data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching categories:', err);
      } finally {
        setSearchingCats(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [categorySearch]);

  // Fetch Post if Editing
  useEffect(() => {
    if (slugOrId) {
      const fetchBlogData = async () => {
        try {
          setFetchingBlog(true);
          const endpoint = `${BACKEND_URL}/apis/v1/blogs/${slugOrId}`;
          const res = await fetch(endpoint);
          const data = await res.json();
          if (data.success && data.data) {
            const p = data.data;
            setActualId(p._id);
            setTitle(p.title || '');
            setSlug(p.slug || slugOrId || '');
            setIsCustomSlug(true);
            setContent(cleanHtmlContent(p.content || ''));
            setMetaTitle(p.metadata?.m_title || p.meta_title || p.title || '');
            setMetaKeywords(p.metadata?.m_keys || p.meta_keywords || '');
            setMetaDescription(p.metadata?.m_desc || p.meta_description || '');
            setAllowIndexing(p.metadata?.robots !== 0);
            const loadedStatus = p.status === 'publish' || p.status === 'published' ? 'publish' : p.status || 'draft';
            setStatus(isAuthor && loadedStatus === 'publish' ? 'pending' : loadedStatus);

            if (p.featured_media) {
              setFeaturedMedia(p.featured_media);
            }

            if (p.country) {
              setSelectedCountry(typeof p.country === 'object' ? p.country.name : p.country);
            }

            if (p.state) {
              setSelectedState(p.state);
            }

            if (p.categories && p.categories.length > 0) {
              const catNames = p.categories.map((c) => (typeof c === 'object' ? c.name : c)).filter(Boolean);
              setSelectedCategories(catNames);
              setCategoryList((prev) => {
                const existingNames = new Set(prev.map((c) => (typeof c === 'object' ? c.name : c)));
                const missing = catNames.filter((name) => !existingNames.has(name));
                if (missing.length === 0) return prev;
                return [
                  ...missing.map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })),
                  ...prev,
                ];
              });
            }
          }
        } catch (err) {
          console.error('Failed to load blog:', err);
        } finally {
          setFetchingBlog(false);
        }
      };
      fetchBlogData();
    } else {
      setFetchingBlog(false);
    }
  }, [slugOrId]);

  // Category Toggle
  const toggleCategory = (catName) => {
    clearError('categories');
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // Load More Categories
  const handleLoadMoreCategories = async () => {
    if (loadingMoreCats || !hasMoreCats) return;
    try {
      setLoadingMoreCats(true);
      const nextPage = catPage + 1;
      const res = await fetch(`${BACKEND_URL}/apis/v1/categories?page=${nextPage}&limit=15`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategoryList((prev) => {
          const existingKeys = new Set(
            prev.map((c) => (typeof c === 'object' ? c._id || c.slug || c.name : c))
          );
          const uniqueNew = data.data.filter(
            (c) => !existingKeys.has(typeof c === 'object' ? c._id || c.slug || c.name : c)
          );
          return [...prev, ...uniqueNew];
        });
        setCatPage(nextPage);
        setCatTotal(data.total || 0);
        setHasMoreCats(nextPage < (data.pages || 1));
      }
    } catch (err) {
      console.error('Error loading more categories:', err);
    } finally {
      setLoadingMoreCats(false);
    }
  };

  // Add Inline Category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const token = getAuthToken(session);
      const res = await fetch(`${BACKEND_URL}/apis/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      const addedObj = data.data || {
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
      };
      const addedName = addedObj.name || newCatName.trim();
      setCategoryList((prev) => [addedObj, ...prev]);
      setSelectedCategories((prev) => [...prev, addedName]);
      clearError('categories');
      setCatTotal((prev) => prev + 1);
      setNewCatName('');
      setShowAddCat(false);
    } catch {
      const fallbackCat = {
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
      };
      setCategoryList((prev) => [fallbackCat, ...prev]);
      setSelectedCategories((prev) => [...prev, newCatName.trim()]);
      clearError('categories');
      setCatTotal((prev) => prev + 1);
      setNewCatName('');
      setShowAddCat(false);
    }
  };

  // Handle Media Selection from Modal
  const handleMediaSelected = (mediaItem) => {
    if (mediaModalTarget === 'featured') {
      setFeaturedMedia(mediaItem);
    } else {
      const url = getImageUrl(mediaItem);
      const imgHtml = `<p><img src="${url}" alt="${mediaItem.alt || mediaItem.name || 'image'}" style="max-width:100%; height:auto; border-radius:4px;" /></p>`;
      setContent((prev) => (prev ? `${prev}${imgHtml}` : imgHtml));
    }
  };

  // Form Submission
  const handleSave = async (submitStatus = status) => {
    if (!validateForm()) {
      showToast('Please resolve highlighted errors before saving.', 'error');
      return;
    }

    // Coerce status for authors
    let finalStatus = submitStatus;
    if (isAuthor && (finalStatus === 'publish' || finalStatus === 'published')) {
      finalStatus = 'pending';
    }

    setIsSubmitting(true);
    try {
      const mappedCategories = selectedCategories.map((catName) => {
        const found = categoryList.find(
          (c) => (typeof c === 'object' ? c.name === catName || c.slug === catName : c === catName)
        );
        return found?._id || catName;
      });

      const targetId = actualId || slugOrId;
      const isEditing = Boolean(targetId);

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        content,
        status: finalStatus,
        featured_media: featuredMedia?._id || undefined,
        image: featuredMedia?.file || featuredMedia?.url || undefined,
        metadata: {
          m_title: metaTitle || title,
          m_keys: metaKeywords,
          m_desc: metaDescription,
          robots: allowIndexing ? 1 : 0,
        },
        country: selectedCountry || 'India',
        state: selectedState === '-- All India --' ? null : selectedState,
        categories: mappedCategories,
        ...(isEditing ? {} : { author: session?.user?.id || undefined }),
      };

      const endpoint = targetId
        ? `${BACKEND_URL}/apis/v1/blogs/${targetId}`
        : `${BACKEND_URL}/apis/v1/blogs`;

      const method = targetId ? 'PUT' : 'POST';
      const token = getAuthToken(session);

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setErrors({});
        showToast(`Blog post ${targetId ? 'updated' : 'created'} successfully!`, 'success');
        setTimeout(() => router.push('/edu-admin/blogs'), 1200);
      } else {
        const serverErrors = data.errors || {};
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
          const firstField = Object.keys(serverErrors)[0];
          scrollToField(firstField);
          showToast(data.message || 'Please fix the highlighted errors.', 'error');
        } else {
          showToast(data.message || 'Failed to save blog post. Please try again.', 'error');
        }
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while saving.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 w-full select-none font-sans text-slate-800">
      {/* Toast Alert */}
      {toast.message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header: Back Button + Add a New Blog / Edit Blog */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/edu-admin/blogs')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium shadow-2xs transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-normal text-slate-900 tracking-tight">
            {isEdit || slugOrId ? 'Edit Blog' : 'Add a New Blog'}
          </h1>
        </div>
      </div>

      {/* If Fetching Blog Data */}
      {fetchingBlog ? (
        <div className="bg-white border border-slate-300 rounded p-12 shadow-2xs">
          <AdminLoader
            text="Loading Blog Details..."
            subtext="Retrieving article content, categories, and featured media"
          />
        </div>
      ) : (
        /* Main Grid: Left Editor (75%) + Right Panels (25%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column (9 cols) */}
        <div className="lg:col-span-9 space-y-3">
          {/* Post Title Input */}
          <div className="space-y-1">
            <div
              ref={titleRef}
              className={`bg-white border rounded shadow-2xs transition-all duration-200 ${
                errors.title
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                  : 'border-slate-300 focus-within:border-[#2271b1]'
              }`}
            >
              <input
                type="text"
                placeholder="Enter Blog Post Title Here"
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  clearError('title');
                  if (!metaTitle) setMetaTitle(newTitle);
                  if (!isCustomSlug) {
                    const autoSlug = newTitle
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setSlug(autoSlug);
                    clearError('slug');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-transparent text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none rounded"
              />
            </div>
            {errors.title && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={13} className="shrink-0 text-rose-500" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* WordPress Permalink / URL Slug Input */}
          <div className="space-y-1">
            <div
              ref={slugRef}
              className={`bg-white border rounded px-3.5 py-2 flex flex-wrap items-center gap-2 text-xs shadow-2xs transition-all duration-200 ${
                errors.slug
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/10'
                  : 'border-slate-300 focus-within:border-[#2271b1]'
              }`}
            >
              <span className="font-semibold text-slate-700 shrink-0">Permalink:</span>
              <span className="text-slate-400 font-mono select-all shrink-0 hidden sm:inline">
                https://educationmasters.in/
              </span>
              <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setIsCustomSlug(true);
                    clearError('slug');
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\-]/g, '-')
                        .replace(/-+/g, '-')
                    );
                  }}
                  placeholder="custom-url-slug"
                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-[#2271b1] shadow-2xs"
                />
                {slug && (
                  <button
                    type="button"
                    onClick={() => window.open(`/${slug}`, '_blank')}
                    className="text-xs text-[#2271b1] hover:text-[#135e96] font-semibold hover:underline flex items-center gap-1 shrink-0 px-1 cursor-pointer"
                    title="View Live Article Link"
                  >
                    <span>View</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
            {errors.slug && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={13} className="shrink-0 text-rose-500" />
                <span>{errors.slug}</span>
              </p>
            )}
          </div>

          {/* WordPress / TinyMCE Editor Section */}
          <div
            ref={contentRef}
            className={`bg-white border rounded shadow-2xs overflow-hidden transition-all duration-200 ${
              errors.content
                ? 'border-rose-500 ring-2 ring-rose-500/20'
                : 'border-slate-300'
            }`}
          >
            {/* Top Bar: Add Media button */}
            <div className="bg-[#f6f7f7] border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMediaModalTarget('editor');
                  setShowMediaModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium shadow-2xs transition-colors"
              >
                <ImageIcon size={13} className="text-[#2271b1]" />
                <span>Add Media</span>
              </button>
            </div>

            {/* TinyMCE JoditEditorWrapper */}
            <div className="p-0.5 bg-white">
              <JoditEditorWrapper
                value={content}
                onChange={(newVal) => {
                  setContent(newVal);
                  clearError('content');
                }}
                height={450}
                placeholder="Write your article content here..."
              />
            </div>

            {errors.content && (
              <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                <AlertCircle size={13} className="shrink-0 text-rose-500" />
                <span>{errors.content}</span>
              </div>
            )}
          </div>

          {/* SEO Tags Section Accordion */}
          <div
            className={`bg-white border rounded shadow-2xs transition-all duration-200 ${
              errors.metaTitle || errors.metaDescription
                ? 'border-rose-500 ring-2 ring-rose-500/20'
                : 'border-slate-300'
            }`}
          >
            <div
              onClick={() => setCollapseSEO(!collapseSEO)}
              className="px-3.5 py-2.5 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800">SEO Tags Section</h3>
                {(errors.metaTitle || errors.metaDescription) && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Required Fields Missing
                  </span>
                )}
              </div>
              <button type="button" className="text-slate-600 hover:text-slate-900">
                {collapseSEO ? <Plus size={14} /> : <Minus size={14} />}
              </button>
            </div>

            {!collapseSEO && (
              <div className="p-3.5 space-y-3 bg-white">
                {/* Allow Indexing */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 font-medium">Allow Indexing:</span>
                  <input
                    type="checkbox"
                    checked={allowIndexing}
                    onChange={(e) => setAllowIndexing(e.target.checked)}
                    className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1]"
                  />
                </div>

                {/* Meta Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Meta Title <span className="text-rose-500">*</span>
                  </label>
                  <div
                    ref={metaTitleRef}
                    className={`rounded transition-all duration-200 ${
                      errors.metaTitle ? 'ring-2 ring-rose-500/20' : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => {
                        setMetaTitle(e.target.value);
                        clearError('metaTitle');
                      }}
                      placeholder="Enter SEO Meta Title"
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors ${
                        errors.metaTitle
                          ? 'border-rose-500 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.metaTitle && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.metaTitle}</span>
                    </p>
                  )}
                </div>

                {/* Meta Keywords */}
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, ..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#2271b1]"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Meta Description <span className="text-rose-500">*</span>
                  </label>
                  <div
                    ref={metaDescriptionRef}
                    className={`rounded transition-all duration-200 ${
                      errors.metaDescription ? 'ring-2 ring-rose-500/20' : ''
                    }`}
                  >
                    <textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => {
                        setMetaDescription(e.target.value);
                        clearError('metaDescription');
                      }}
                      placeholder="Enter SEO Meta Description summary..."
                      className={`w-full px-3 py-1.5 bg-white border rounded text-xs text-slate-800 focus:outline-none transition-colors resize-y ${
                        errors.metaDescription
                          ? 'border-rose-500 bg-rose-50/10'
                          : 'border-slate-300 focus:border-[#2271b1]'
                      }`}
                    />
                  </div>
                  {errors.metaDescription && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <AlertCircle size={13} className="shrink-0 text-rose-500" />
                      <span>{errors.metaDescription}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Panels (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Panel 1: Publish */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs">
            <div
              onClick={() => setCollapsePublish(!collapsePublish)}
              className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800">Publish</span>
              {collapsePublish ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>

            {!collapsePublish && (
              <div className="p-3 space-y-3 bg-white">
                {/* Save Draft & Preview Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-[#2271b1] border border-[#2271b1] rounded text-xs font-normal transition-colors shadow-2xs"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (slugOrId || actualId) {
                        window.open(`/${slugOrId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, '_blank');
                      } else {
                        showToast('Preview available after saving');
                      }
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-normal transition-colors shadow-2xs"
                  >
                    Preview
                  </button>
                </div>

                {/* Status selector */}
                <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2">
                  <span>📌 Status:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#2271b1]"
                  >
                    {!isAuthor && <option value="publish">Published</option>}
                    <option value="pending">Pending Review</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Submit / Publish Button */}
                <div className="border-t border-slate-200 pt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave(status)}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#28a745] hover:bg-[#218838] text-white rounded text-xs font-bold transition-colors shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : isAuthor
                      ? status === 'draft'
                        ? 'Save Draft'
                        : 'Submit for Review'
                      : isEdit || slugOrId
                      ? 'Update Blog'
                      : status === 'draft'
                      ? 'Save Draft'
                      : 'Publish Blog'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel 2: Featured Image */}
          <div className="bg-white border border-slate-300 rounded shadow-2xs">
            <div
              onClick={() => setCollapseFeatured(!collapseFeatured)}
              className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800">Featured Image</span>
              {collapseFeatured ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>

            {!collapseFeatured && (
              <div className="p-3 bg-white">
                {featuredMedia ? (
                  <div className="space-y-2">
                    <div className="w-full h-32 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img
                        src={getImageUrl(featuredMedia)}
                        alt="Featured"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeaturedMedia(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline block"
                    >
                      Remove featured image
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaModalTarget('featured');
                      setShowMediaModal(true);
                    }}
                    className="text-xs text-[#2271b1] hover:text-[#135e96] hover:underline"
                  >
                    Set Featured Image
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Panel 3: Categories */}
          <div
            ref={categoriesRef}
            className={`bg-white border rounded shadow-2xs transition-all duration-200 ${
              errors.categories
                ? 'border-rose-500 ring-2 ring-rose-500/20'
                : 'border-slate-300'
            }`}
          >
            <div
              onClick={() => setCollapseCategories(!collapseCategories)}
              className="px-3.5 py-2 bg-[#f6f7f7] border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Categories</span>
                {errors.categories && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Required
                  </span>
                )}
              </div>
              {collapseCategories ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>

            {errors.categories && !collapseCategories && (
              <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-200 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-in fade-in duration-200">
                <AlertCircle size={13} className="shrink-0 text-rose-500" />
                <span>{errors.categories}</span>
              </div>
            )}

            {!collapseCategories && (() => {
              const displayedCategories = (() => {
                if (categorySearch.trim()) {
                  if (searchResults !== null) {
                    return searchResults;
                  }
                  const q = categorySearch.toLowerCase().trim();
                  return categoryList.filter((cat) => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    return String(catName).toLowerCase().includes(q);
                  });
                }
                if (categoryTab === 'most_used') {
                  return categoryList.filter((cat) => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    return selectedCategories.includes(catName);
                  });
                }
                return categoryList;
              })();

              return (
                <div className="p-3 bg-white space-y-2.5">
                  {/* Categories Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryTab('all');
                          setCategorySearch('');
                        }}
                        className={`font-medium transition-colors cursor-pointer ${
                          categoryTab === 'all'
                            ? 'text-slate-900 border-b-2 border-slate-800 font-bold pb-0.5'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        All Categories
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryTab('most_used');
                          setCategorySearch('');
                        }}
                        className={`font-medium transition-colors cursor-pointer ${
                          categoryTab === 'most_used'
                            ? 'text-slate-900 border-b-2 border-slate-800 font-bold pb-0.5'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Most Used
                      </button>
                    </div>
                    {catTotal > 0 && categoryTab === 'all' && !categorySearch.trim() && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {categoryList.length} of {catTotal}
                      </span>
                    )}
                  </div>

                  {/* Search Input Bar */}
                  <div className="relative">
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-7 pr-7 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2271b1] transition-all"
                    />
                    {categorySearch && !searchingCats && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      >
                        <X size={11} />
                      </button>
                    )}
                    {searchingCats && (
                      <Loader2
                        size={11}
                        className="animate-spin text-[#2271b1] absolute right-2 top-1/2 -translate-y-1/2"
                      />
                    )}
                  </div>

                  {/* Checkbox List */}
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded p-2 space-y-1.5 custom-scrollbar bg-slate-50/50">
                    {displayedCategories.map((cat) => {
                      const catName = typeof cat === 'object' ? cat.name : cat;
                      const catKey = typeof cat === 'object' ? cat._id || cat.slug || cat.name : cat;
                      return (
                        <label
                          key={catKey}
                          className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(catName)}
                            onChange={() => toggleCategory(catName)}
                            className="rounded border-slate-300 text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                          />
                          <span className="truncate">{catName}</span>
                        </label>
                      );
                    })}

                    {categorySearch.trim() && displayedCategories.length === 0 && !searchingCats && (
                      <div className="text-[11px] text-slate-400 italic py-3 text-center">
                        No categories found matching &quot;{categorySearch}&quot;
                      </div>
                    )}

                    {!categorySearch.trim() &&
                      categoryTab === 'most_used' &&
                      displayedCategories.length === 0 && (
                        <div className="text-[11px] text-slate-400 italic py-3 text-center">
                          No categories selected yet
                        </div>
                      )}
                  </div>

                  {/* Load More Button */}
                  {!categorySearch.trim() && categoryTab === 'all' && hasMoreCats && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        disabled={loadingMoreCats}
                        onClick={handleLoadMoreCategories}
                        className="w-full py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-[#2271b1] hover:text-[#135e96] border border-slate-200 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        {loadingMoreCats ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-[#2271b1]" />
                            <span>Loading more categories...</span>
                          </>
                        ) : (
                          <>
                            <span>+ Load More Categories</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({categoryList.length} of {catTotal})
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* + Add New Category */}
                  {!isAuthor && (
                    <div>
                      {!showAddCat ? (
                        <button
                          type="button"
                          onClick={() => setShowAddCat(true)}
                          className="text-xs text-[#2271b1] hover:text-[#135e96] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>+ Add New Category</span>
                        </button>
                      ) : (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <input
                            type="text"
                            placeholder="New category name"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCategory();
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#2271b1]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAddCategory}
                              className="px-2.5 py-0.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-medium rounded shadow-2xs"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddCat(false);
                                setNewCatName('');
                              }}
                              className="text-xs text-slate-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Panel 4: Country */}
          <SearchableSelectPanel
            title="Country"
            endpoint="/apis/v1/countries"
            selectedValue={selectedCountry}
            onSelect={(val) => {
              setSelectedCountry(val);
              setSelectedState(val === 'India' ? '-- All India --' : `-- All ${val} --`);
            }}
            defaultOption={{ label: 'India', value: 'India' }}
            emptyMessage="No countries found"
          />

          {/* Panel 5: State */}
          <SearchableSelectPanel
            title="State"
            endpoint="/apis/v1/states"
            selectedValue={selectedState}
            onSelect={(val) => setSelectedState(val)}
            defaultOption={{
              label: selectedCountry === 'India' ? '— All India —' : `— All ${selectedCountry || 'Country'} —`,
              value: selectedCountry === 'India' ? '-- All India --' : `-- All ${selectedCountry || 'Country'} --`,
            }}
            extraParams={{ country: selectedCountry }}
            dependency={selectedCountry}
            emptyMessage={`No states found for ${selectedCountry || 'selected country'}`}
          />
        </div>
      </div>
      )}

      {/* WordPress Style Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelected}
        targetType={mediaModalTarget}
      />
    </div>
  );
}
