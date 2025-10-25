# Community Projects Feature - Setup Guide

## Overview

The Community Projects feature enables users to create, discover, join, and collaborate on community initiatives like building gardens, coding workshops, art projects, and more.

## Features Implemented

✅ Browse and search projects  
✅ Filter by category and status  
✅ View project statistics  
✅ Create new projects  
✅ View detailed project information  
✅ Join/leave projects  
✅ Participant management  
✅ Project creator controls

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration to create all necessary tables:

```bash
# Option A: Using Supabase CLI
supabase db push supabase-migrations/community-projects.sql

# Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase-migrations/community-projects.sql`
4. Paste and execute the SQL
```

### Step 2: Verify Tables

After running the migration, verify that these tables exist:

- `community_projects` - Main projects table
- `project_participants` - Tracks project members
- `project_updates` - Project announcements and discussions

### Tables Schema

#### community_projects

| Column           | Type         | Description                         |
| ---------------- | ------------ | ----------------------------------- |
| id               | BIGSERIAL    | Primary key                         |
| creator_id       | UUID         | References auth.users               |
| title            | VARCHAR(255) | Project title                       |
| description      | TEXT         | Project description                 |
| category         | VARCHAR(100) | Project category                    |
| status           | VARCHAR(50)  | planning/active/completed/cancelled |
| start_date       | DATE         | Optional start date                 |
| end_date         | DATE         | Optional end date                   |
| max_participants | INTEGER      | Optional participant limit          |
| goals            | TEXT         | Optional project goals              |
| skills_needed    | TEXT         | Optional comma-separated skills     |
| created_at       | TIMESTAMP    | Auto-generated                      |
| updated_at       | TIMESTAMP    | Auto-updated                        |

#### project_participants

| Column     | Type        | Description                   |
| ---------- | ----------- | ----------------------------- |
| id         | BIGSERIAL   | Primary key                   |
| project_id | BIGINT      | References community_projects |
| user_id    | UUID        | References auth.users         |
| role       | VARCHAR(50) | creator/member/moderator      |
| joined_at  | TIMESTAMP   | Auto-generated                |

#### project_updates

| Column      | Type        | Description                               |
| ----------- | ----------- | ----------------------------------------- |
| id          | BIGSERIAL   | Primary key                               |
| project_id  | BIGINT      | References community_projects             |
| user_id     | UUID        | References auth.users                     |
| content     | TEXT        | Update content                            |
| update_type | VARCHAR(50) | general/announcement/milestone/discussion |
| created_at  | TIMESTAMP   | Auto-generated                            |

## Row Level Security (RLS)

The migration automatically configures RLS policies:

### Community Projects

- ✅ Anyone can **view** all projects
- ✅ Authenticated users can **create** projects
- ✅ Creators can **update** their own projects
- ✅ Creators can **delete** their own projects

### Project Participants

- ✅ Anyone can **view** participants
- ✅ Users can **join** projects (self-insert)
- ✅ Users can **leave** projects (self-delete)
- ✅ Project creators can **manage** all participants

### Project Updates

- ✅ Anyone can **view** updates
- ✅ Participants can **create** updates
- ✅ Users can **edit/delete** their own updates

## Routes Created

### 1. Projects Listing Page

**Route:** `/projects`  
**File:** `app/projects/page.tsx`

Features:

- View all community projects
- Search projects by title/description
- Filter by category (7 categories)
- Filter by status (planning/active/completed)
- Stats dashboard (total projects, active, participants)
- Responsive grid layout
- Empty states

### 2. Create Project Page

**Route:** `/projects/new`  
**File:** `app/projects/new/page.tsx`

Features:

- Create new project form
- Required: title, description, category
- Optional: dates, max participants, goals, skills
- Form validation
- Success/error notifications
- Redirects to project detail on success

### 3. Project Detail Page

**Route:** `/projects/[id]`  
**File:** `app/projects/[id]/page.tsx`

Features:

- View full project information
- See all participants with avatars
- Join/leave project buttons
- Project creator controls
- Timeline display (start/end dates)
- Skills needed badges
- Participant count with limits
- Message creator button

## Navigation

The "Projects" link has been added to the main navbar:

- Icon: Users (Lucide icon)
- Position: Between "Bookings" and "Profile"
- Accessible from all pages

## Categories Available

1. Community Development
2. Technology
3. Education
4. Environment
5. Arts & Culture
6. Health & Wellness
7. Other

## Project Statuses

- **Planning** - Project is in planning phase (blue badge)
- **Active** - Project is actively running (green badge)
- **Completed** - Project has been finished (gray badge)
- **Cancelled** - Project was cancelled (not shown in UI filters)

## Usage Examples

### Creating a Project

```typescript
const { data, error } = await supabase.from("community_projects").insert({
  creator_id: user.id,
  title: "Community Garden",
  description: "Let's build a garden together!",
  category: "Environment",
  status: "planning",
  max_participants: 20,
  goals: "Create raised beds, plant vegetables",
  skills_needed: "Gardening, Carpentry",
});
```

### Joining a Project

```typescript
const { error } = await supabase.from("project_participants").insert({
  project_id: projectId,
  user_id: user.id,
  role: "member",
});
```

### Fetching Projects with Participants

```typescript
const { data } = await supabase.from("community_projects").select(`
    *,
    creator:profiles!community_projects_creator_id_fkey(
      id, full_name, avatar_url
    ),
    participants:project_participants(count)
  `);
```

## Automatic Behaviors

The database includes triggers that automatically:

1. **Add creator as participant** - When a project is created, the creator is automatically added to `project_participants` with role='creator'
2. **Update timestamps** - The `updated_at` field is automatically updated when a project is modified

## UI/UX Features

- **Gradient styling** - Consistent emerald-to-teal gradient theme
- **Animations** - Framer Motion page transitions
- **Loading states** - Spinner while fetching data
- **Empty states** - Helpful messages when no data
- **Toast notifications** - Success/error feedback
- **Responsive design** - Works on mobile, tablet, desktop
- **Custom scrollbars** - Styled scrollbars matching app theme
- **Status badges** - Color-coded project status indicators

## Future Enhancements

Potential features to add:

- [ ] Project discussion/chat system (using project_updates table)
- [ ] Image uploads for projects
- [ ] Project milestones and progress tracking
- [ ] Email notifications for project updates
- [ ] Participant roles and permissions
- [ ] Project templates
- [ ] Geographic location for local projects
- [ ] Project categories management
- [ ] Advanced search and filters
- [ ] Export participant lists

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Verify all tables exist in Supabase
- [ ] Test RLS policies (try unauthorized actions)
- [ ] Create a new project
- [ ] View projects list
- [ ] Search and filter projects
- [ ] View project details
- [ ] Join a project
- [ ] Leave a project
- [ ] Test max participants limit
- [ ] Test creator controls
- [ ] Test on mobile devices

## Troubleshooting

### "Table does not exist" error

- Ensure you've run the SQL migration
- Check Supabase dashboard to verify tables exist
- Verify your Supabase client is configured correctly

### "Permission denied" error

- Check RLS policies are enabled
- Verify user is authenticated
- Ensure creator_id matches auth.uid() for creator actions

### Project not appearing in list

- Check project status filter
- Verify search query
- Check if data was actually inserted

### Join project fails

- Check if project is at max capacity
- Verify user is authenticated
- Check if user is already a participant

## Support

For issues or questions:

1. Check Supabase logs for database errors
2. Check browser console for client-side errors
3. Verify RLS policies in Supabase dashboard
4. Test SQL queries directly in Supabase SQL Editor

---

**Status:** ✅ Fully Implemented  
**Last Updated:** 2024  
**Version:** 1.0.0
