import { redirect } from 'next/navigation';

export default function AuthorIndexRedirect() {
  redirect('/authors');
}
