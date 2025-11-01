# Georgian Distribution System

## Overview

The Georgian Distribution System is a comprehensive B2B food distribution platform designed to modernize the traditional Georgian food supply chain. It provides real-time order tracking, role-based access control, and a complete management dashboard for distributors, restaurants, and drivers.

## Features

### 🎯 Core Functionality
- **Real-time Order Tracking**: Live updates using Supabase Realtime via WebSockets
- **Role-Based Access Control (RBAC)**: Separate interfaces for Admin, Restaurant, Driver, and Demo users
- **Dynamic Pricing**: Custom pricing per order with profitability calculations
- **Multi-language Support**: Georgian and English interfaces
- **Mobile-First Design**: Responsive design for all device types

### 🏗️ Architecture
- **Frontend**: Next.js 15 with React 19 and TypeScript
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (PostgreSQL with real-time capabilities)
- **Authentication**: Supabase Auth with JWT tokens
- **Real-time Engine**: Supabase Realtime for live notifications
- **File Storage**: Supabase Storage for product images and logos
- **Development**: Official Supabase platform for easy development and testing

### 👥 User Roles
- **Administrator**: Full access to dashboard, order management, pricing, and analytics
- **Restaurant**: Order placement, status tracking, and order history
- **Driver**: Delivery management and status updates
- **Demo**: Read-only access for potential clients

### 🔧 Technology Stack
- **Framework**: Next.js 15.1.6 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL 16 with Row-Level Security (RLS)
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts for analytics dashboard

## Environment Setup

### Development Environment
- **Backend**: Official Supabase project at https://supabase.com
- **Frontend**: Local development server
- **MCP Integration**: Full database management via MCP tools

### Production Environment
- **Backend**: Self-hosted Supabase on VPS
- **Frontend**: Deployed Next.js application
- **Domains**: 
  - Frontend: https://greenland77.ge
  - Backend: https://data.greenland77.ge

## Key Features

### Order Management Workflow
1. **Restaurant Places Order**: Digital catalog with product selection
2. **Administrator Pricing**: Custom pricing with profitability analysis
3. **Driver Assignment**: Automatic assignment with notifications
4. **Real-time Tracking**: Live status updates throughout delivery
5. **Delivery Confirmation**: Two-step confirmation process
6. **Order Completion**: Final status with complete transaction history

### Security Features
- **Row-Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schemas for all user inputs
- **Role Permissions**: Granular access control per user role

### Performance Optimizations
- **Server Components**: Optimized Next.js App Router implementation
- **Real-time Subscriptions**: Efficient WebSocket usage
- **Database Optimization**: Proper indexing and query optimization
- **Caching Strategy**: React Query for server state management

## Project Structure

```
Distribution-Managment/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── validators/     # Zod validation schemas
│   ├── public/             # Static assets
│   └── docs/               # Frontend documentation
├── project-documentation/   # Comprehensive project docs
├── specs/                  # Feature specifications
├── database/              # Migration tools and scripts
└── docs/                  # General documentation
```

## Development Workflow

### Quick Start
1. **Environment Setup**: Use official Supabase for development
2. **Frontend Development**: `cd frontend && npm run dev`
3. **Database Management**: Via Supabase dashboard and MCP tools
4. **Testing**: Local testing with development environment

### MCP Integration
- **Supabase MCP**: Full database operations and schema management
- **GitHub MCP**: Repository management and code operations
- **Sentry MCP**: Error tracking and monitoring
- **Perplexity MCP**: Research and documentation assistance

## Deployment

### Current Phase: Development on Hosted Supabase
- **Backend**: Official Supabase platform for rapid development
- **Advantages**: No infrastructure setup, managed scaling, built-in backup

### Future Phase: Self-Hosted Supabase on VPS
- **Infrastructure**: Contabo VPS with Dockploy deployment
- **Migration**: Prepared scripts for zero-downtime migration
- **Timeline**: After development completion and validation

## Monitoring & Observability

- **Primary**: Sentry for error tracking and performance monitoring
- **Uptime**: External monitoring service for availability
- **Health Checks**: Built-in system health monitoring

## Documentation

Comprehensive documentation includes:
- **Architecture**: System design and component relationships
- **API Reference**: Complete API documentation
- **Security Guide**: Security best practices and RLS policies
- **Deployment Guide**: Step-by-step deployment instructions
- **Development Guide**: Local development setup and workflows

## Contributing

This project follows modern development practices with:
- **TypeScript**: Full type safety across the codebase
- **ESLint/Prettier**: Code quality and formatting standards
- **Testing**: Unit and integration tests
- **Documentation**: Comprehensive inline and external docs

## License

Private repository - All rights reserved.

## Support

For development support, refer to the project documentation in the `project-documentation/` directory or use the MCP tools for immediate assistance.