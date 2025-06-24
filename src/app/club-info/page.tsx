'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClubInfoPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img 
              src="/flying-feathers-logo.png" 
              alt="Flying Feathers Badminton Club Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Club Information
          </h1>
          <p className="text-lg text-cyan-400 mb-4">
            About Flying Feathers Badminton Club Edinburgh
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Button 
              onClick={() => router.push('/')}
              variant="outline" 
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
            >
              Back to Home
            </Button>
          </div>
        </div>

        {/* Club Information Cards */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Club Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 mb-4 mx-auto">
                <img 
                  src="/flying-feathers-logo.png" 
                  alt="Flying Feathers Badminton Club Logo" 
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
              <CardTitle className="text-3xl text-cyan-400 mb-2">
                FLYING FEATHERS
              </CardTitle>
              <CardDescription className="text-xl text-pink-400 font-semibold">
                BADMINTON CLUB EDINBURGH
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-slate-300 space-y-4">
                <p className="text-lg">
                  Edinburgh's premier badminton club dedicated to fostering competitive spirit and sportsmanship in the badminton community.
                </p>
                <p>
                  We organize regular tournaments, training sessions, and social events for players of all skill levels. 
                  Our state-of-the-art tournament management system ensures fair play and accurate tracking of all matches and results.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-pink-400 text-center">
                Club Leadership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg p-6">
                  <div className="text-3xl mb-2">👤</div>
                  <h3 className="text-2xl font-bold text-cyan-400 mb-2">
                    Samsheer Abdullah
                  </h3>
                  <p className="text-lg text-pink-400 font-semibold mb-2">
                    Chief Organiser
                  </p>
                  <p className="text-slate-300">
                    Leading the Flying Feathers Badminton Club with passion and dedication to excellence in tournament organization and player development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Club Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  🏆 Tournaments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-slate-300 space-y-2">
                  <li>• Regular competitive tournaments</li>
                  <li>• Round-robin format competitions</li>
                  <li>• Real-time scoring and standings</li>
                  <li>• Professional tournament management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
                  📍 Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-300 space-y-2">
                  <p><strong>Edinburgh, Scotland</strong></p>
                  <p>Multiple venue partnerships across the city</p>
                  <p>Premium court facilities</p>
                  <p>Accessible locations for all members</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  👥 Membership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-slate-300 space-y-2">
                  <li>• Open to all skill levels</li>
                  <li>• Beginners welcome</li>
                  <li>• Competitive players encouraged</li>
                  <li>• Regular training opportunities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center gap-2">
                  🎯 Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-300 space-y-2">
                  <p>To promote badminton excellence in Edinburgh through:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Fair and competitive tournaments</li>
                    <li>• Community building</li>
                    <li>• Skill development</li>
                    <li>• Sportsmanship values</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-2xl text-white text-center">
                Get Involved
              </CardTitle>
              <CardDescription className="text-slate-300 text-center">
                Join Edinburgh's most competitive badminton community
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-300">
                Interested in joining our tournaments or becoming a member? 
                Contact our Chief Organiser for more information about upcoming events and membership opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/schedules')}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
                >
                  View Tournament Schedules
                </Button>
                <Button 
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
                >
                  Admin Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 