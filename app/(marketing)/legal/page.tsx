import Link from 'next/link';
import { pageMeta } from '@/app/lib/seo';
export const metadata = pageMeta('/legal', 'Privacy and terms — InboxRhino', 'Read the InboxRhino privacy policy and terms and conditions for receive-only email testing, data retention, cookies and acceptable use.');
export default function LegalPage() {
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-16 sm:px-6"><h1 className="text-4xl font-bold">Privacy and terms</h1><p className="text-base leading-7 text-stone-700">Read how we handle your information and the terms that apply when you use InboxRhino.</p><nav aria-label="Legal pages" className="flex flex-col gap-4 font-bold text-[#0F3D3E] underline"><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms and conditions</Link></nav></main>;
}
