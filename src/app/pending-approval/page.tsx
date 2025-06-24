'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 mx-auto">
            <img 
              src="/flying-feathers-logo.png" 
              alt="Flying Feathers Badminton Club Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <CardTitle className="text-2xl text-white">
            Registration Submitted
          </CardTitle>
          <CardDescription className="text-slate-300">
            Your admin access request is pending approval
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          <div className="bg-cyan-900/50 border border-cyan-600 text-cyan-300 px-4 py-6 rounded-lg mb-6">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="font-semibold text-lg mb-2">Approval Required</h3>
            <p className="text-sm">
              Your registration has been submitted successfully. An approval email has been sent to the administrator.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-left bg-slate-700 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">What happens next?</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Administrator will review your request</li>
                <li>• You&apos;ll receive an email notification</li>
                <li>• Once approved, you can login normally</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
              >
                Go to Login
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Back to Home
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-xs text-slate-400">
              Need help? The approval process typically takes 1-2 business days.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 