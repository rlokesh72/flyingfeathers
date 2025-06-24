# Flying Feathers Badminton Club Tournament Management

A comprehensive tournament management system for Flying Feathers Badminton Club Edinburgh, built with Next.js, MongoDB, and modern UI components.

## Features

- 🏆 **Tournament Management** - Create and manage badminton tournaments
- 👥 **Team Registration** - Easy team setup and player management  
- ⚡ **Real-time Scoring** - Live match scoring with direct number input
- 📊 **Live Standings** - Real-time tournament standings and results
- 📅 **Court Scheduling** - Smart court allocation and time management
- 🔐 **Admin Authentication** - Secure admin access with approval workflow
- 📧 **Email Notifications** - Automated approval emails
- 🎯 **Round-robin Format** - Complete round-robin tournament scheduling
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or cloud)
- (Optional) Resend API key for email notifications

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rlokesh72/flyingfeathers.git
cd flyingfeathers
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `RESEND_API_KEY`: (Optional) Your Resend API key for emails
- `NEXTAUTH_URL`: Your app URL
- `NEXTAUTH_SECRET`: A secure random string

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Admin Setup

1. Go to the login page and register a new admin account
2. Check your email for approval (or console logs if email not configured)
3. Click the approval link to activate your admin account
4. You can now create and manage tournaments!

## Project Structure

```
flying-feathers-app/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   └── tournaments/  # Tournament management endpoints
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── schedules/        # Public schedules page
│   │   ├── club-info/        # Club information page
│   │   └── login/            # Authentication pages
│   ├── components/           # React components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/                 # Utility functions and database
│   └── models/              # MongoDB data models
├── public/                  # Static assets including club logo
└── ...config files
```

## How It Works

### Tournament Workflow
1. **Create Tournament** - Set up tournament with teams and courts
2. **Team Registration** - Add teams and player details
3. **Confirm Setup** - Review and confirm tournament configuration
4. **Start Tournament** - Begin with automatic round-robin scheduling
5. **Live Scoring** - Log match scores in real-time
6. **Live Standings** - View updated standings after each match
7. **Complete Tournament** - Finalize and view final results

### Key Features
- **Round-robin Scheduling**: Automatically generates all possible match combinations
- **Court Management**: Distributes matches across available courts with time slots
- **Real-time Updates**: Standings update automatically as scores are entered
- **Direct Score Input**: Enter exact scores (not incremental)
- **Final Results**: Comprehensive final standings with match statistics

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `RESEND_API_KEY` | Resend API key for emails | ❌ Optional |
| `NEXTAUTH_URL` | Your app URL | ✅ Yes |
| `NEXTAUTH_SECRET` | Secure random string | ✅ Yes |
| `ADMIN_EMAIL` | Admin email for notifications | ❌ Optional |

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `NEXTAUTH_URL` (your Vercel app URL)
   - `NEXTAUTH_SECRET`
   - `RESEND_API_KEY` (optional)

4. Deploy!

**Note**: The app will work without email configuration - approval details will be logged to console instead.

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: MongoDB with Mongoose
- **Authentication**: Custom JWT-based auth
- **Email**: Resend (optional)
- **Deployment**: Vercel

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## About Flying Feathers Badminton Club

Flying Feathers Badminton Club Edinburgh is dedicated to fostering competitive spirit and sportsmanship in the badminton community. Our tournament management system ensures fair play and accurate tracking of all matches and results.

**Chief Organiser**: Samsheer Abdullah

---
*Last updated: January 2025*
