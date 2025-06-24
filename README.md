# Flying Feathers

A beautiful Next.js application built with shadcn/ui components and Tailwind CSS.

## Features

- ⚡ **Next.js 14** with App Router
- 🎨 **shadcn/ui** components for beautiful UI
- 🎯 **TypeScript** for type safety
- 🎨 **Tailwind CSS** for styling
- 📱 **Responsive design**
- 🌙 **Dark mode support**

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
flying-feathers-app/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   └── lib/                # Utility functions
├── public/                 # Static assets
└── ...config files
```

## Available Components

This project includes the following shadcn/ui components:

- Button
- Card

To add more components, use:

```bash
npx shadcn@latest add [component-name]
```

## Customization

- **Colors**: Edit the CSS variables in `src/app/globals.css`
- **Components**: All shadcn/ui components are in `src/components/ui/`
- **Styling**: Tailwind classes can be customized in `tailwind.config.ts`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
