# HubHub Test Credentials

## 🧪 Testing Environment Setup

### Development Server
- **URL**: http://localhost:3000
- **Status**: Run `npm run dev` to start

### Test User Accounts

#### 👨‍🎨 Designer Account
- **Email**: `designer@hubhub.test`
- **Password**: `TestDesigner123!`
- **Role**: Designer
- **Purpose**: Test CV upload, profile management, offer responses

#### 👔 Client Account  
- **Email**: `client@hubhub.test`
- **Password**: `TestClient123!`
- **Role**: Client
- **Purpose**: Test project submission, candidate review

#### 🔧 Admin Account
- **Email**: `admin@hubhub.test`
- **Password**: `TestAdmin123!`
- **Role**: Admin
- **Purpose**: Test designer database access, matching, offer management

## 🚀 Quick Testing Guide

### 1. Test CV Upload (Designer Flow)
1. Navigate to: http://localhost:3000
2. Click "Sign Up" → Create designer account or use test credentials
3. Go to: http://localhost:3000/designer/cv-upload
4. Upload your CV file (PDF, DOCX, or TXT)
5. Review and edit parsed results
6. Confirm to save profile

### 2. Test Authentication Flow
1. Sign up with different roles
2. Verify role-based dashboard redirects
3. Test protected routes and middleware

### 3. Test Database Integration
1. Upload CV and save profile
2. Check Supabase dashboard for saved data
3. Verify profile completion validation

## 📋 Test Scenarios

### CV Parsing Tests
- [ ] Upload PDF CV → Verify data extraction
- [ ] Upload DOCX CV → Verify data extraction  
- [ ] Upload TXT CV → Verify data extraction
- [ ] Test with missing information → Verify validation
- [ ] Test with complex formatting → Verify parsing accuracy

### Authentication Tests
- [ ] Designer registration → Access to CV upload
- [ ] Client registration → Access to project submission
- [ ] Admin registration → Access to full designer database
- [ ] Role-based route protection
- [ ] Session persistence

### Database Tests  
- [ ] CV data saves correctly to all tables
- [ ] Profile completion validation works
- [ ] MVP required fields enforcement
- [ ] RLS policies prevent unauthorized access

## 🔍 Debugging Tools

### Database Access
- **Supabase Dashboard**: https://supabase.com/dashboard/project/onvekvladcenwdqlmjtw
- **Table Editor**: Check data in designer_profiles, work_experiences, skills, etc.
- **SQL Editor**: Run queries to verify data integrity

### API Testing
- **CV Parse Endpoint**: POST /api/cv-parse
- **Direct CV Parser Test Page**: http://localhost:3000/test-cv-parser (bypasses authentication)
- **Test with curl**:
```bash
curl -X POST http://localhost:3000/api/cv-parse \
  -F "file=@your-cv.pdf"
```

### Browser DevTools
- **Network Tab**: Monitor API requests and responses
- **Console**: Check for JavaScript errors
- **Application Tab**: Verify authentication tokens

## 📁 Test Files Location
- Place test CV files in `/test-files/` directory
- Include various formats: PDF, DOCX, TXT
- Test with different CV structures and layouts

## 🐛 Common Issues & Solutions

### CV Parsing Fails
- Check file format is supported (PDF/DOCX/TXT)
- Verify file size < 10MB
- Check server logs for parsing errors

### Authentication Issues  
- Clear browser cookies and localStorage
- Verify environment variables are set
- Check Supabase project configuration

### Database Connection Issues
- Verify .env.local has correct Supabase credentials
- Check RLS policies allow user operations
- Confirm database schema is applied

## 📊 Success Criteria

### ✅ CV Upload Works When:
- File uploads successfully
- Text extraction completes
- Data parsing shows confidence > 40%
- Required fields are identified
- User can edit and verify results
- Data saves to database correctly

### ✅ Authentication Works When:
- Users can register with different roles
- Login redirects to appropriate dashboard
- Protected routes block unauthorized access
- Session persists across page refreshes

### ✅ Database Integration Works When:
- Parsed CV data appears in Supabase tables
- Profile completion validation triggers
- MVP required fields are enforced
- RLS policies protect user data

---

**Ready for Testing!** 🎯

Start with the Designer flow: Register → Upload CV → Review Results → Save Profile

