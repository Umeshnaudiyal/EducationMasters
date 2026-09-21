'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import BlogEditorForm from '@/components/admin/BlogEditorForm';

export default function EditBlogPage() {
  const params = useParams();
  const slug = params?.slug;

  return <BlogEditorForm slugOrId={slug} isEdit={true} />;
}
