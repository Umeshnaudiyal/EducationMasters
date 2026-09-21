import { redirect } from 'next/navigation';

export default function CategoryIndexRedirect() {
  redirect('/category/articles');
}
