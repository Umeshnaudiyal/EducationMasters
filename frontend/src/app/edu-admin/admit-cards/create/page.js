import React from 'react';
import AdmitCardEditorForm from '@/components/admin/AdmitCardEditorForm';

export const metadata = {
  title: 'Add New Admit Card | Education Masters Admin',
};

export default function CreateAdmitCardPage() {
  return <AdmitCardEditorForm isEdit={false} />;
}
