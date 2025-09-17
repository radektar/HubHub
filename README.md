# HubHub - Designer-Client Matching Platform

A Next.js-based platform that connects designers with clients through admin-curated matching, featuring CV parsing, profile management, and blind CV generation.

## 🚀 Project Status

**Current Phase**: PoC Foundation (Phase 1)
- ✅ **Authentication System**: User registration, login, and email verification working
- ✅ **Database Schema**: Comprehensive 16-table structure implemented
- ✅ **CV Parsing**: AI-powered PDF parsing with Google Gemini API
- ✅ **Profile Editing**: Interactive profile completion interface
- 🔧 **In Progress**: Enhanced profile validation and completion workflow

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **CV Parsing**: Google Gemini AI + regex fallback
- **State Management**: Zustand
- **Hosting**: Vercel

### Key Features
- **Admin-Controlled Access**: Only platform admin can browse full designer database
- **Three-Layer Data Collection**: PDF parsing + manual completion + specialized survey
- **Profile Validation**: MVP required fields with completion percentage tracking
- **Blind CV Generation**: Anonymized CVs for client review
- **Role-Based Access**: Designer, Client, and Admin roles with specific permissions

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd HubHub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Run database migrations (in Supabase SQL Editor)
# 1. Run corrected-database-setup.sql
# 2. Run final-supabase-auth-setup.sql

# Start development server
npm run dev
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

## 📱 Usage

### For Designers
1. **Register** at `/auth/register` with email verification
2. **Upload CV** for AI-powered parsing
3. **Complete Profile** using interactive editing interface
4. **Wait for Admin Approval** to be included in database

### For Clients
1. **Register** and submit project requirements
2. **Review Admin-Selected Candidates** (no direct database access)
3. **Approve Candidates** for offers

### For Admin
1. **Browse Designer Database** with advanced filtering
2. **Review and Approve** designer profiles
3. **Match Designers** to client projects
4. **Generate Blind CVs** for client review

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Role-specific dashboards
│   ├── designer/          # Designer-specific pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── cv-upload/        # CV upload and parsing
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── cv-parser/        # CV parsing logic
│   ├── supabase/         # Database clients
│   └── validation/       # Form validation
└── stores/               # Zustand state management
```

## 📊 Database Schema

16 interconnected tables supporting comprehensive designer profiles:
- **Core**: users, designer_profiles
- **Experience**: work_experiences, education, certifications
- **Skills**: skills, languages, cv_projects
- **Platform**: client_projects, offers, evaluations

See [TECHNICAL_APPROACH.md](TECHNICAL_APPROACH.md) for detailed schema and MVP requirements.

## 🔧 Development Workflow

1. **Check Documentation**: Review TECHNICAL_APPROACH.md and BUSINESS_IDEA.md
2. **Follow MVP Requirements**: Ensure all required fields are implemented
3. **Update Changelog**: Document all changes in CHANGELOG.md
4. **Test Authentication Flow**: Registration → Email Verification → Profile Completion

## 📋 Current Development Focus

### Phase 1 Remaining Tasks
- [ ] Enhanced profile validation with completion percentage
- [ ] Survey integration for specialized design fields
- [ ] Admin dashboard for profile review and approval
- [ ] Complete profile completion workflow

### Upcoming Phases
- **Phase 2**: Admin matching system and client portal
- **Phase 3**: Blind CV generation and offer management

## 📚 Documentation

- [TECHNICAL_APPROACH.md](TECHNICAL_APPROACH.md) - Architecture and implementation details
- [BUSINESS_IDEA.md](BUSINESS_IDEA.md) - Business model and requirements
- [CHANGELOG.md](CHANGELOG.md) - Version history and changes
- [CV_PARSING_SETUP.md](CV_PARSING_SETUP.md) - CV parsing configuration

## 🤝 Contributing

1. Read project documentation thoroughly
2. Follow established patterns and MVP requirements
3. Update changelog for significant changes
4. Test authentication and profile completion flows

---

**Last Updated**: September 17, 2025  
**Version**: 1.2 - Authentication system fully operational
