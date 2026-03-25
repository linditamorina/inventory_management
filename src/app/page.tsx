import { redirect } from 'next/navigation'

export default function HomePage() {
  // Kjo thjesht thotë: "Shko te dashboard"
  redirect('/dashboard')
}