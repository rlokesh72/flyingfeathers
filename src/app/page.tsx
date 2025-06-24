'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          {/* Logo/Brand Section */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 mb-6">
              <img 
                src="/flying-feathers-logo.png" 
                alt="Flying Feathers Badminton Club Logo" 
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
            <h1 className="text-5xl font-bold text-white mb-2">
              FLYING FEATHERS
            </h1>
            <p className="text-2xl text-cyan-400 font-semibold mb-4">
              BADMINTON CLUB EDINBURGH
            </p>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Admin portal for Edinburgh&apos;s premier badminton tournament management system
            </p>
          </div>
          
          <div className="flex gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
            >
              Admin Login
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => router.push('/schedules')}
              className="border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
            >
              View Schedules
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                🏆 Tournament Management
              </CardTitle>
              <CardDescription className="text-slate-300">
                Organize and manage badminton tournaments with ease
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Create tournaments, manage brackets, track scores, and generate results in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-pink-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-pink-400 flex items-center gap-2">
                👥 Player Registration
              </CardTitle>
              <CardDescription className="text-slate-300">
                Streamlined registration process for all skill levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Easy online registration with player profiles, skill ratings, and tournament history.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                📊 Live Scoring
              </CardTitle>
              <CardDescription className="text-slate-300">
                Real-time match scoring and leaderboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Digital scorekeeping with live updates, match statistics, and automatic bracket progression.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-pink-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-pink-400 flex items-center gap-2">
                📅 Court Scheduling
              </CardTitle>
              <CardDescription className="text-slate-300">
                Efficient court allocation and time management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Smart court scheduling system that optimizes playing time and minimizes wait periods.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                🎯 Rankings & Stats
              </CardTitle>
              <CardDescription className="text-slate-300">
                Comprehensive player rankings and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Track player performance, maintain ELO ratings, and generate detailed match analytics.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-pink-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-pink-400 flex items-center gap-2">
                📱 Mobile Friendly
              </CardTitle>
              <CardDescription className="text-slate-300">
                Access from any device, anywhere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Responsive design ensures seamless experience on mobile, tablet, and desktop devices.
              </p>
            </CardContent>
          </Card>
        </div>



        {/* Club Information Section - Bottom */}
        <div className="text-center border-t border-slate-700 pt-8">
          <div className="max-w-md mx-auto">
            <p className="text-slate-400 text-sm mb-4">
              Learn more about our club
            </p>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/club-info')}
              className="text-pink-400 hover:text-pink-300 hover:bg-pink-900/20 border border-pink-500/30 hover:border-pink-400"
            >
              View Club Information
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
