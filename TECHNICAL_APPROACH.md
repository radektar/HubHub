# Technical Approach & Architecture

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand (lightweight, perfect for PoC)
- **Forms**: React Hook Form + Zod validation
- **File Upload**: react-dropzone for CV uploads

### Backend & Database
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth (built-in OAuth, email/password)
- **API**: Supabase REST API + Edge Functions for complex operations
- **File Storage**: Supabase Storage for CV files and portfolio assets
- **Real-time**: Supabase Realtime for live updates

### Additional Services & Tools
- **CV Parsing**: 
  - Primary: **Affinda API** or **Resume Parser API** for comprehensive PDF parsing
  - Fallback: **pdf-parse** + **mammoth** (for local parsing)
  - Advanced: **OpenAI GPT-4** for intelligent data extraction and structured categorization
  - Manual Completion: Form interface for users to complete/verify parsed data
  - Focus: **PDF CV parsing + manual completion** for comprehensive profiles
- **Email Service**: **Resend** or **SendGrid** for notifications
- **PDF Generation**: **Puppeteer** or **jsPDF** for blind CV generation
- **Image Processing**: **Cloudinary** for portfolio image optimization
- **Search**: **Algolia** or Supabase full-text search for profile filtering

### Infrastructure & DevOps
- **Hosting**: Vercel (seamless Next.js deployment)
- **Database Hosting**: Supabase Cloud
- **CI/CD**: GitHub Actions + Vercel auto-deployment
- **Monitoring**: Vercel Analytics + Sentry for error tracking
- **Environment**: Vercel Preview deployments for staging

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│  Supabase API   │────│   PostgreSQL   │
│   (Frontend)    │    │   (Backend)      │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │ Supabase Storage│              │
         │              │ (Files & Assets)│              │
         │              └─────────────────┘              │
         │                       │                       │
    ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ CV Parser   │    │ Email Service   │    │ PDF Generator   │
    │ (External)  │    │ (Resend/SG)     │    │ (Puppeteer)     │
    └─────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Designer Onboarding**: CV upload → Parse → Store profile data → Manual completion
2. **Client Project Submission**: Client submits project requirements → Admin reviews → Project stored
3. **Admin Matching Process**: Admin searches/filters designer database → Selects candidates → Creates shortlist
4. **Blind CV Generation**: Admin selects profiles → Anonymize data → Generate PDF → Send to client
5. **Offer Management**: Client approves candidates → Admin sends offers → Track responses → Facilitate connection

### Key Components

#### Frontend Components
- **Admin Dashboard**: Main navigation and overview for platform management
- **Designer Profile Manager**: CV upload, parsing results, and manual profile editing
  - ✅ **ParsingResults Component**: Interactive profile editing with real-time updates (existing in test-cv-parser)
  - ✅ **CVUploadZone Component**: File upload with drag-and-drop functionality (existing)
  - 🔧 **Enhanced Profile Completion**: Extended ParsingResults with MVP field validation
- **Admin Search & Filter**: Advanced filtering interface for browsing designers (admin-only access)
- **Client Project Portal**: Clients submit project requirements and review candidate recommendations
- **Project Manager**: Admin manages offers, tracks responses, facilitates communication
- **Blind CV Generator**: Admin tool to anonymize and generate professional CVs for client review

#### Backend Services (Supabase Edge Functions)
- **CV Parser Service**: Handle file upload and parsing integration
- **Email Notification Service**: Send updates, offers, and reminders
- **PDF Generation Service**: Create anonymized CVs and reports
- **Matching Algorithm**: Score and rank designer-project compatibility

## Database Design

### Core Entities
1. **users**
   - Fields: id, email, role (designer/client/admin), created_at, updated_at
   - Relationships: One-to-one with profiles, one-to-many with projects/offers
   - Note: Only admin can access full designer database

2. **designer_profiles**
   - Fields: user_id, name, title, professional_summary, phone, email, location, availability, portfolio_url, cv_file_url, photo_url, total_experience_years, rating, is_profile_complete, survey_data (JSON), created_at, updated_at
   - Relationships: Belongs to user, has many work_experiences, educations, skills, certifications, languages, projects
   - Required Fields (MVP): title, phone, email, availability, portfolio_url, cv_file_url, professional_summary, total_experience_years
   - Optional Fields: name, location, photo_url, rating

3. **work_experiences**
   - Fields: id, designer_profile_id, job_title, company_name, company_size, industry, location, start_date, end_date, is_current, description, achievements[], technologies_used[], created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): company_name, industry (for companies worked for + industry experience)
   - Optional Fields: job_title, company_size, location, start_date, end_date, description, achievements, technologies_used

4. **educations**
   - Fields: id, designer_profile_id, institution_name, degree_type, field_of_study, start_date, end_date, gpa, honors[], relevant_coursework[], description, created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): None (all optional for MVP)
   - Optional Fields: All fields

5. **skills**
   - Fields: id, designer_profile_id, skill_name, category (technical/soft/design/tool), proficiency_level (1-5), years_of_experience, last_used_date, is_endorsed, endorsement_count, created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): skill_name, category, proficiency_level (for skills_category + tools proficiency)
   - Optional Fields: years_of_experience, last_used_date, is_endorsed, endorsement_count

6. **certifications**
   - Fields: id, designer_profile_id, certification_name, issuing_organization, issue_date, expiration_date, credential_id, credential_url, is_verified, created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): None (all optional for MVP)
   - Optional Fields: All fields

7. **languages**
   - Fields: id, designer_profile_id, language_name, proficiency_level (1-5), is_native, certification_name, created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): language_name, proficiency_level
   - Optional Fields: is_native, certification_name

8. **cv_projects**
   - Fields: id, designer_profile_id, project_name, description, role, duration_months, team_size, technologies_used[], outcomes[], project_url, client_type, created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): None (all optional for MVP)
   - Optional Fields: All fields

9. **awards_honors**
   - Fields: id, designer_profile_id, title, issuing_organization, issue_date, description, award_url, created_at, updated_at
   - Relationships: Belongs to designer_profile
   - Required Fields (MVP): None (all optional for MVP)

10. **publications**
    - Fields: id, designer_profile_id, title, publication_type, publisher, publication_date, description, publication_url, co_authors[], created_at, updated_at
    - Relationships: Belongs to designer_profile
    - Required Fields (MVP): None (all optional for MVP)

11. **professional_references**
    - Fields: id, designer_profile_id, reference_name, title, company, relationship, email, phone, linkedin_url, reference_text, created_at, updated_at
    - Relationships: Belongs to designer_profile
    - Required Fields (MVP): None (all optional for MVP)

12. **volunteer_experiences**
    - Fields: id, designer_profile_id, organization_name, role, start_date, end_date, description, skills_used[], created_at, updated_at
    - Relationships: Belongs to designer_profile
    - Required Fields (MVP): None (all optional for MVP)

13. **projects**
   - Fields: id, client_id, title, description, requirements (JSON), budget_range, timeline, status, custom_fields (JSON), selected_candidates[], created_at, updated_at
   - Relationships: Belongs to client user, has many offers
   - Note: selected_candidates tracks admin-curated shortlist for each project

14. **offers**
   - Fields: id, project_id, designer_id, status (sent/viewed/accepted/declined), custom_message, sent_at, responded_at
   - Relationships: Belongs to project and designer

15. **evaluations**
   - Fields: id, project_id, designer_id, client_rating, client_feedback, work_samples[], created_at
   - Relationships: Belongs to project and designer

16. **update_requests**
   - Fields: id, designer_id, requested_by, message, status, created_at, completed_at
   - Relationships: Belongs to designer

### Data Relationships
- Users have different roles with corresponding profile types
- Designers can receive multiple offers for different projects
- Projects belong to clients and can have multiple candidate offers
- Evaluations link projects with designer performance data

## MVP Field Requirements

### Required Fields for Designer Profile Completion
To be included in the designer database, profiles must have these mandatory fields completed:

#### **Core Profile Information**
- **Position/Title** (`designer_profiles.title`)
- **Phone** (`designer_profiles.phone`)
- **Email** (`designer_profiles.email`)
- **Availability** (`designer_profiles.availability`)
- **Portfolio URL** (`designer_profiles.portfolio_url`)
- **CV File** (`designer_profiles.cv_file_url`)
- **Professional Summary** (`designer_profiles.professional_summary`)
- **Total Experience Years** (`designer_profiles.total_experience_years`)

#### **Skills & Proficiency (1-5 scale)**
- **Skills by Category** (`skills.skill_name`, `skills.category`, `skills.proficiency_level`)
  - Design skills (UX, UI, etc.)
  - Tool proficiency (Figma, Adobe, etc.)
- **Industry Experience** (`work_experiences.company_name`, `work_experiences.industry`)
- **Languages** (`languages.language_name`, `languages.proficiency_level`)

#### **Work History**
- **Companies Worked For** (`work_experiences.company_name`)

### Profile Completion Logic
- `is_profile_complete` flag set to `true` only when all required MVP fields are filled
- Admin can only include designers with `is_profile_complete = true` in client searches
- System validates required fields before allowing profile activation

### Designer Profile Survey Structure

The platform collects comprehensive designer information through a structured survey:

#### **Multiple Choice Fields:**
- **Main Specialization**: Analytics, UX, UI, Animation, Accessibility
- **Industry Experience**: Automotive, Energy, IT, Finance, Insurance, Banking, Healthcare, Startups, Blockchain/Crypto, AdTech/MarTech, Manufacturing, Construction, eCommerce, Education, Transport/Logistics, Agriculture, Tourism/Hospitality, Telecommunications, Green Tech, HR
- **Interface Types**: Web Services, Intranets, Mobile Apps, Enterprise Systems (Salesforce/SAP), Dashboards, Voice UI, IoT, Hardware/Professional Equipment
- **Framework Experience**: Salesforce, SAP, Microsoft Dynamics 365, Oracle Cloud, Adobe Experience Cloud, Shopify Plus, Atlassian Suite, HubSpot, Other (custom text)
- **AI Design Tools**: Multiple entry field for tool names and experience

#### **Competency Ratings (0-5 scale):**
- Web Analytics (GA4 and related)
- BI Dashboard Design
- UX/WCAG Audits
- Quantitative/Qualitative Research
- UX/UI Design
- UX Writing
- Workshop Facilitation
- Customer Journey Mapping
- Empathy Maps
- Interaction Prototyping
- Low-code/No-code Tools

#### **Tool Proficiency (Multiple Entry Fields):**
- Analytics Tools
- UX Research Tools
- Workshop Tools (FigJam, etc.)
- UX/UI Design Tools
- Coding Languages/Frameworks

#### **Language Skills (1-5 scale):**
- English, German, Spanish, Other

#### **Certifications:**
- Free text field for certification descriptions

**Survey Reference**: https://tally.so/r/me9rqQ

### Data Collection Strategy - MVP Focus

The platform uses a **three-layer data collection approach** for comprehensive designer profiles:

#### **Layer 1: PDF CV Parsing (Primary)**
- **Automated Extraction**: Basic profile information, work history, education, skills
- **Parsing Tools**: Affinda API, Resume Parser API, or local fallback
- **Data Quality**: Good for structured information, may need manual verification

#### **Layer 2: Manual Profile Completion (Required)**
- **Required Fields Completion**: Ensures all MVP mandatory fields are filled
- **Data Verification**: Designers verify and complete parsed CV data
- **Profile Enhancement**: Add missing information not captured from CV

#### **Layer 3: Survey Data Integration (Specialized)**
- **Design-Specific Information**: Industry specialization, framework experience, tool proficiency
- **Competency Ratings**: Self-assessed skill levels (1-5 scale)
- **Professional Context**: AI tool experience, certification details, language skills

#### **Profile Completion Workflow - REVISED**
1. **CV Upload** → PDF parsing → Basic profile creation (✅ existing)
2. **Interactive Data Review** → ParsingResults component displays parsed data with editing capabilities (✅ existing)
3. **Enhanced Manual Completion** → Extended ParsingResults with MVP required fields (✅ completed)
   - Add missing fields: title, availability, experience years, industry categorization
   - Add proficiency levels for skills and languages (1-5 scale)
   - Real-time validation with visual feedback
4. **Survey Integration** → Complete specialized design survey → Add competency ratings (🔧 planned)
5. **Database Save** → Profile completion API saves enhanced data and sets `is_profile_complete` flag (🔧 planned)
6. **Admin Review** → Platform owner evaluates → Approve for database inclusion (🔧 planned)

#### **Existing Functionality Leveraged**
- ✅ **Interactive Editing**: Personal info, work experience, skills editing with real-time updates
- ✅ **Dynamic Content Management**: Add/remove work experiences and skills
- ✅ **Basic Validation**: Required field checking with visual indicators
- ✅ **Professional UI**: Card-based layout with proper state management
- ✅ **API Integration**: Connected to CV parsing service with error handling

## API Design

### Authentication & Authorization ✅ **OPERATIONAL**
- **Authentication Method**: Supabase Auth (JWT tokens, email/password) - **WORKING**
- **Email Verification**: Automatic email confirmation system - **WORKING**
- **User Registration**: Complete signup flow with role selection - **WORKING**
- **Database Integration**: Auth triggers create user profiles automatically - **WORKING**
- **Authorization Strategy**: Role-Based Access Control (RBAC)
- **Protected Routes**: 
  - Admin-only: Designer database access, profile browsing, candidate selection
  - Client-only: Project submission, candidate review (pre-selected only)
  - Designer-only: Profile management, offer responses

### Core Endpoints
```
# Admin-only endpoints
GET    /api/admin/designers      # Browse all designer profiles (admin only)
GET    /api/admin/projects       # View all projects and matching status
POST   /api/admin/shortlist      # Create candidate shortlist for project

# Client endpoints  
POST   /api/projects             # Submit new project requirements
GET    /api/projects/:id/candidates # View pre-selected candidates only
POST   /api/projects/:id/approve    # Approve selected candidates

# Designer endpoints
GET    /api/designer/profile     # Get own profile
PUT    /api/designer/profile     # Update own profile  
GET    /api/designer/offers      # View received offers
PUT    /api/offers/:id/respond   # Respond to offers

# Shared endpoints
POST   /api/auth/login           # Authentication
GET    /api/dashboard            # Role-specific dashboard data
```

## Development Strategy

### Phase 1: PoC Foundation (Weeks 1-3) - **CURRENT STATUS: DATABASE INTEGRATION COMPLETE**
- [x] Next.js + Supabase project setup
- [x] **Complete authentication system** - User registration, login, and email verification fully operational
- [x] **Database schema creation** - Comprehensive 16-table structure with required/optional field designations
- [x] **Supabase integration** - Auth triggers, RLS policies, and user profile creation working
- [x] CV upload and PDF parsing integration (AI-powered with Google Gemini API + regex fallback)
- [x] **Manual data completion interface** - Existing ParsingResults component with interactive editing
- [x] **Basic profile form functionality** - Test CV parser demonstrates working profile editing
- [x] **Enhanced ParsingResults component** - Add missing MVP fields (title, availability, experience years, industry categorization, skills/languages proficiency levels)
- [x] **Upgraded validation system** - Complete MVP field validation with profile completion API
- [x] **Database integration** - Profile completion API fully operational with comprehensive data saving and `is_profile_complete` flag management
- [x] **CV Upload API Integration** - Connected CV upload workflow to profile completion API for streamlined database operations
- [x] **Authenticated profile completion page** - Integrated enhanced ParsingResults with authentication, user context, and existing data loading
- [ ] **Survey data collection form** - Add specialized design fields as additional completion step
- [ ] **Basic admin dashboard** - Profile review and approval interface

#### **Key Discovery: 70% of Profile Completion Already Exists!**
The test CV parser at `/test-cv-parser` contains a sophisticated profile editing interface with:
- ✅ Real-time data editing (personal info, work experience, skills)
- ✅ Add/remove functionality for dynamic content
- ✅ Basic validation with visual feedback
- ✅ Professional UI with proper state management
- ✅ Integration with CV parsing API

**Revised Strategy**: Extend and enhance existing functionality rather than build from scratch.

### Phase 2: Core Features (Weeks 4-6)
- [ ] Admin profile browsing with advanced filtering (approved profiles only)
- [ ] Client project submission portal
- [ ] Admin project management and candidate selection workflow
- [ ] Offer sending system (admin to designers on behalf of clients)
- [ ] Email notifications integration (offers, updates, reminders)
- [ ] Blind CV generation from structured profile data
- [ ] Designer profile update requests and version management

### **Detailed Phase 1 Implementation Plan**

#### **Phase 1A: Enhance Existing Components (Week 1) - ✅ COMPLETED**
**Days 1-2: Extend ParsingResults Component** - ✅ COMPLETED
- ✅ Add missing MVP fields to existing ParsingResults:
  - ✅ Title/Position field with dropdown options
  - ✅ Availability status (Available, Busy, Not Available)
  - ✅ Total Experience Years calculator (auto-calculate from work experience)
  - ✅ Industry dropdown for each work experience entry
  - ✅ Skills proficiency levels (1-5 rating for each skill)
  - ✅ Languages with proficiency levels (1-5 rating)

**Days 3-4: Enhanced Validation** - ✅ COMPLETED
- ✅ Upgrade validation function in ParsingResults:
  - ✅ Check all MVP required fields completion
  - ✅ Validate skills have proficiency levels
  - ✅ Validate work experience has industry classification
  - ✅ Validate languages have proficiency levels
  - ✅ Add completion percentage indicator

**Days 5-7: Database Integration** - ✅ COMPLETED
- ✅ Create profile completion API endpoint (`/api/designer/profile-complete`)
- ✅ Save enhanced parsing results to database with comprehensive validation
- ✅ Update `is_profile_complete` flag based on validation
- ✅ Handle related data (skills, work experience, languages, education)
- ✅ **CV Upload API Integration** - Connected CV upload workflow to use profile completion API

#### **Phase 1B: Authentication & Survey Integration (Week 2)**
**Days 1-3: Authenticated Profile Completion Page** - ✅ COMPLETED
- ✅ Create `/designer/profile` page using enhanced ParsingResults
- ✅ Add authentication checks and user context
- ✅ Integrate with existing CV upload workflow and dashboard navigation
- ✅ Add existing profile data loading and edit mode support
- ✅ Implement seamless transition between CV upload and profile editing

**Days 4-7: Survey Integration**
- Build survey form component based on tally.so structure
- Integrate survey data storage (JSONB field)
- Add survey step to completion workflow
- Connect survey data to profile validation

#### **Phase 1C: Admin Dashboard & Polish (Week 3)**
**Days 1-4: Basic Admin Dashboard**
- Create admin profile list and review interface
- Add approve/reject functionality for completed profiles
- Profile completion status tracking and filtering
- Integration with existing admin authentication

**Days 5-7: Testing & Refinement**
- End-to-end testing of complete workflow
- UI/UX improvements and consistency
- Bug fixes and performance optimization
- Documentation updates

### Phase 3: PoC Completion (Weeks 7-8)
- [ ] Performance evaluation system
- [ ] UI/UX refinement
- [ ] Basic reporting and analytics
- [ ] Testing and bug fixes
- [ ] Demo preparation and documentation

## Technical Decisions & Rationale

### Next.js + Supabase Architecture
- **Decision**: Use Next.js frontend with Supabase as backend-as-a-service
- **Rationale**: Rapid development for PoC, built-in auth, real-time features, and PostgreSQL
- **Alternatives Considered**: MERN stack, T3 stack, Firebase - chosen for speed and SQL database

### CV Parsing Strategy
- **Decision**: External API (Affinda/Resume Parser) with local fallback
- **Rationale**: Higher accuracy than building from scratch, faster PoC development
- **Alternatives Considered**: Building custom parser, using only local libraries - chosen for reliability

### TypeScript + Tailwind CSS
- **Decision**: Full TypeScript with Tailwind CSS for styling
- **Rationale**: Type safety for complex data structures, rapid UI development
- **Alternatives Considered**: JavaScript + CSS modules - chosen for maintainability

## Development Guidelines

### Code Standards
- **Linting**: [ESLint, Prettier configuration]
- **Testing**: [Testing framework and coverage requirements]
- **Documentation**: [Code documentation standards]
- **Git Workflow**: [Branch naming, commit message format]

### Performance Considerations
- [Performance requirement 1]
- [Performance requirement 2]
- [Performance requirement 3]

### Security Considerations
- [Security measure 1]
- [Security measure 2]
- [Security measure 3]

## Deployment Strategy

### Development Environment
- [Local development setup]

### Staging Environment
- [Staging environment details]

### Production Environment
- [Production deployment strategy]

## Monitoring & Maintenance

### Key Metrics to Track
- [Metric 1]: [Description and target]
- [Metric 2]: [Description and target]
- [Metric 3]: [Description and target]

### Backup Strategy
- [Backup frequency and retention]
- [Recovery procedures]

---

*Last Updated: September 17, 2025*
*Version: 1.3 - CV Upload API integration complete, database operations streamlined through profile completion API*
