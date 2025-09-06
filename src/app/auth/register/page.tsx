import { SignUpForm } from '@/components/auth/sign-up-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <SignUpForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Sign Up | HubHub',
  description: 'Create your HubHub account',
}
