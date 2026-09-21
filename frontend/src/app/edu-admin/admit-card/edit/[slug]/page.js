import React from 'react';
import AdmitCardEditorForm from '@/components/admin/AdmitCardEditorForm';

export const metadata = {
  title: 'Edit Admit Card | Education Masters Admin',
};

export default async function EditAdmitCardPage({ params }) {
  const { slug } = await params;
  return <AdmitCardEditorForm slugOrId={slug} isEdit={true} />;
}
