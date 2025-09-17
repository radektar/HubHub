'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, signOut, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getDashboardContent = () => {
    switch (user.role) {
      case 'admin':
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Designer Management</CardTitle>
                <CardDescription>Manage designer profiles and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Designers</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Client Projects</CardTitle>
                <CardDescription>View and manage client project requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Projects</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Matching System</CardTitle>
                <CardDescription>Match designers with client projects</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Matches</Button>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'designer':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Complete and manage your designer profile</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => router.push('/designer/profile')}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Project Offers</CardTitle>
                <CardDescription>View and respond to project offers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Offers</Button>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'client':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit Project</CardTitle>
                <CardDescription>Submit a new project request</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">New Project</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>View your submitted projects and matches</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Projects</Button>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>Your account is being set up</CardDescription>
            </CardHeader>
          </Card>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HubHub Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user.email} ({user.role})
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {getDashboardContent()}
        </div>
      </main>
    </div>
  )
}
