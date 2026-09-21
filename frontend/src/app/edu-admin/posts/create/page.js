'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import BlogEditorForm from '@/components/admin/BlogEditorForm';

export default function CreateOrEditPostPage() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  return <BlogEditorForm slugOrId={postId} isEdit={Boolean(postId)} />;
}
