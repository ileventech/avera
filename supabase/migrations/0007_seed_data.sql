-- ============================================================================
-- 0007_seed_data.sql
-- Run this script in your Supabase SQL Editor to populate rich demo CRM data.
-- ============================================================================

do $$
declare
  org_rec record;
begin
  for org_rec in select id from organizations loop

    -- 1. Clients
    insert into clients (id, organization_id, name, email, phone, status, address, "referredBy", "idType", "idNo", "maritalStatus", occupation, workplace, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Acme Real Estate Holdings', 'contact@acmerealty.com', '+1 (555) 234-5678', 'Active', '742 Evergreen Terrace, Springfield', 'Direct Referral', 'NIN', 'NIN-8839201', 'Married', 'Investment Director', 'Acme Corp', now() - interval '60 days'),
      (gen_random_uuid(), org_rec.id, 'Apex Horizon Ventures', 'info@apexhorizon.io', '+1 (555) 876-5432', 'Active', '100 Innovation Way, Silicon Valley, CA', 'Google Search', 'Passport', 'PASS-992011', 'Single', 'CEO', 'Apex Horizon', now() - interval '45 days'),
      (gen_random_uuid(), org_rec.id, 'Starlight Capital Ltd', 'support@starlightcap.com', '+1 (555) 345-6789', 'Active', '55 Wall Street, New York, NY', 'Conference', 'Driver License', 'DL-77281', 'Married', 'Managing Partner', 'Starlight Cap', now() - interval '30 days'),
      (gen_random_uuid(), org_rec.id, 'Blue Sky Developers', 'deals@blueskydev.org', '+1 (555) 654-3210', 'Inactive', '12 Ocean Drive, Miami, FL', 'LinkedIn', 'NIN', 'NIN-1029384', 'Single', 'Project Lead', 'Blue Sky', now() - interval '15 days')
    on conflict do nothing;

    -- 2. Staff
    insert into staff (id, organization_id, name, role, department, email, phone, status, "joinDate", address, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Sarah Jenkins', 'Senior Sales Director', 'Sales', 'sarah.j@company.com', '+1 (555) 111-2233', 'Active', '2024-01-15', '45 Park Ave, NY', now() - interval '120 days'),
      (gen_random_uuid(), org_rec.id, 'Michael Chang', 'Lead Software Engineer', 'Engineering', 'michael.c@company.com', '+1 (555) 222-3344', 'Active', '2024-03-01', '88 Technology Blvd, CA', now() - interval '90 days'),
      (gen_random_uuid(), org_rec.id, 'Elena Rostova', 'HR Specialist', 'HR', 'elena.r@company.com', '+1 (555) 333-4455', 'Active', '2024-05-10', '12 Pine Street, TX', now() - interval '60 days'),
      (gen_random_uuid(), org_rec.id, 'David Miller', 'Financial Analyst', 'Finance', 'david.m@company.com', '+1 (555) 444-5566', 'On Leave', '2024-06-20', '30 Cedar Court, IL', now() - interval '30 days')
    on conflict do nothing;

    -- 3. Approvals
    insert into approvals (id, organization_id, title, requester, date, status, type, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Q3 Marketing Campaign Budget', 'Sarah Jenkins', current_date - interval '5 days', 'Approved', 'Budget Request', now() - interval '5 days'),
      (gen_random_uuid(), org_rec.id, 'Senior Backend Engineer Requisition', 'Michael Chang', current_date - interval '3 days', 'Pending', 'Headcount', now() - interval '3 days'),
      (gen_random_uuid(), org_rec.id, 'Office Facilities Maintenance Contract', 'Elena Rostova', current_date - interval '1 day', 'Approved', 'Contract', now() - interval '1 day')
    on conflict do nothing;

    -- 4. Incomes
    insert into incomes (id, organization_id, "transactionId", source, amount, date, category, status, description, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'TRX-1001', 'Acme Real Estate Holdings', 45000.00, current_date - interval '20 days', 'SaaS Subscription', 'Completed', 'Annual Enterprise Platform License Fee', now() - interval '20 days'),
      (gen_random_uuid(), org_rec.id, 'TRX-1002', 'Apex Horizon Ventures', 28500.00, current_date - interval '10 days', 'Consulting', 'Completed', 'Real Estate Portfolio Optimization Retainer', now() - interval '10 days'),
      (gen_random_uuid(), org_rec.id, 'TRX-1003', 'Starlight Capital Ltd', 62000.00, current_date - interval '2 days', 'One-time Sale', 'Completed', 'Commercial Property Listing Advisory Services', now() - interval '2 days')
    on conflict do nothing;

    -- 5. Expenditures
    insert into expenditures (id, organization_id, "expenseNo", vendor, amount, date, category, status, description, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'EXP-9001', 'AWS Cloud Services', 4200.00, current_date - interval '18 days', 'Infrastructure', 'Approved', 'Monthly Hosting & Database Compute Charges', now() - interval '18 days'),
      (gen_random_uuid(), org_rec.id, 'EXP-9002', 'WeWork Office Spaces', 8500.00, current_date - interval '12 days', 'Office', 'Approved', 'Monthly Headquarters Office Space Rental', now() - interval '12 days'),
      (gen_random_uuid(), org_rec.id, 'EXP-9003', 'Google Ads Marketing', 3100.00, current_date - interval '5 days', 'Marketing', 'Pending', 'Digital Lead Generation Search Campaign', now() - interval '5 days')
    on conflict do nothing;

    -- 6. Invoices
    insert into invoices (id, organization_id, "invoiceNo", client, amount, "issueDate", "dueDate", status, items, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'INV-2026-001', 'Acme Real Estate Holdings', 45000.00, current_date - interval '30 days', current_date - interval '5 days', 'Paid', 'Annual Enterprise Platform License Fee', now() - interval '30 days'),
      (gen_random_uuid(), org_rec.id, 'INV-2026-002', 'Apex Horizon Ventures', 28500.00, current_date - interval '15 days', current_date + interval '15 days', 'Pending', 'Real Estate Portfolio Optimization Retainer', now() - interval '15 days'),
      (gen_random_uuid(), org_rec.id, 'INV-2026-003', 'Blue Sky Developers', 15000.00, current_date - interval '45 days', current_date - interval '15 days', 'Overdue', 'Initial Architectural Review Advisory', now() - interval '45 days')
    on conflict do nothing;

    -- 7. Orders
    insert into orders (id, organization_id, "orderNo", customer, "totalAmount", date, status, "shippingAddress", items, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'ORD-5001', 'Starlight Capital Ltd', 12500.00, current_date - interval '14 days', 'Delivered', '55 Wall Street, New York, NY', '5x Real Estate Data Analytics Terminal Units', now() - interval '14 days'),
      (gen_random_uuid(), org_rec.id, 'ORD-5002', 'Apex Horizon Ventures', 8200.00, current_date - interval '7 days', 'Shipped', '100 Innovation Way, Silicon Valley, CA', '2x Executive Workstations & Displays', now() - interval '7 days'),
      (gen_random_uuid(), org_rec.id, 'ORD-5003', 'Acme Real Estate Holdings', 4500.00, current_date - interval '2 days', 'Processing', '742 Evergreen Terrace, Springfield', '1x On-Site Property Scanner Kit', now() - interval '2 days')
    on conflict do nothing;

    -- 8. Payrolls
    insert into payrolls (id, organization_id, employee, role, salary, bonus, period, status, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Sarah Jenkins', 'Senior Sales Director', 9500.00, 2500.00, 'July 2026', 'Processed', now() - interval '10 days'),
      (gen_random_uuid(), org_rec.id, 'Michael Chang', 'Lead Software Engineer', 10500.00, 1500.00, 'July 2026', 'Processed', now() - interval '10 days'),
      (gen_random_uuid(), org_rec.id, 'Elena Rostova', 'HR Specialist', 7000.00, 500.00, 'July 2026', 'Processed', now() - interval '10 days'),
      (gen_random_uuid(), org_rec.id, 'David Miller', 'Financial Analyst', 8000.00, 0.00, 'July 2026', 'Pending', now() - interval '5 days')
    on conflict do nothing;

    -- 9. Attendances
    insert into attendances (id, organization_id, employee, date, "clockIn", "clockOut", status, "hoursWorked", created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Sarah Jenkins', current_date, '08:55 AM', '05:30 PM', 'Present', 8.5, now()),
      (gen_random_uuid(), org_rec.id, 'Michael Chang', current_date, '09:12 AM', '06:00 PM', 'Late', 8.0, now()),
      (gen_random_uuid(), org_rec.id, 'Elena Rostova', current_date, '09:00 AM', '05:00 PM', 'Present', 8.0, now()),
      (gen_random_uuid(), org_rec.id, 'David Miller', current_date, '—', '—', 'Absent', 0.0, now())
    on conflict do nothing;

    -- 10. Leave Requests
    insert into leave_requests (id, organization_id, employee, "leaveType", "startDate", "endDate", status, reason, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'David Miller', 'Annual Leave', current_date - interval '2 days', current_date + interval '5 days', 'Approved', 'Family summer vacation trip', now() - interval '10 days'),
      (gen_random_uuid(), org_rec.id, 'Sarah Jenkins', 'Personal Leave', current_date + interval '10 days', current_date + interval '12 days', 'Pending', 'Attending industry seminar', now() - interval '2 days')
    on conflict do nothing;

    -- 11. Leads
    insert into leads (id, organization_id, name, company, email, phone, status, source, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Robert Vance', 'Vance Refrigeration', 'robert@vance.com', '+1 (555) 999-1111', 'Qualified', 'Website Contact Form', now() - interval '25 days'),
      (gen_random_uuid(), org_rec.id, 'Jessica Alba', 'Honest Co.', 'j.alba@honest.com', '+1 (555) 888-2222', 'Contacted', 'LinkedIn Outreach', now() - interval '15 days'),
      (gen_random_uuid(), org_rec.id, 'Carlos Santana', 'Smooth Music Ltd', 'carlos@santana.io', '+1 (555) 777-3333', 'New', 'Direct Referral', now() - interval '5 days')
    on conflict do nothing;

    -- 12. Sale Records
    insert into sale_records (id, organization_id, "dealName", client, value, "closeDate", stage, owner, notes, created_at)
    values
      (gen_random_uuid(), org_rec.id, 'Acme Commercial Complex Acquisition', 'Acme Real Estate Holdings', 185000.00, current_date - interval '10 days', 'Closed Won', 'Sarah Jenkins', 'Deal finalized and contracts signed.', now() - interval '30 days'),
      (gen_random_uuid(), org_rec.id, 'Apex High-Rise Portfolio Partnership', 'Apex Horizon Ventures', 95000.00, current_date + interval '15 days', 'Negotiation', 'Sarah Jenkins', 'Finalizing term sheet details.', now() - interval '20 days'),
      (gen_random_uuid(), org_rec.id, 'Starlight Financial District Expansion', 'Starlight Capital Ltd', 120000.00, current_date + interval '30 days', 'Proposal', 'Sarah Jenkins', 'Proposal sent for executive review.', now() - interval '10 days')
    on conflict do nothing;

    -- 13. Tasks
    insert into tasks (id, organization_id, title, description, "startDate", "dueDate", priority, status, assignee, "assigneeColor", subtasks, checklists, "blockingTask", "waitingTask", created_at)
    values
      -- To Do
      (gen_random_uuid(), org_rec.id,
        'Q3 Marketing Campaign Launch',
        'Plan and execute the Q3 digital marketing campaign across all channels including social media, email, and paid search.',
        current_date, current_date + 14,
        'High Priority', 'To Do', 'SJ', '#1E3A8A',
        ARRAY['Define target audience segments', 'Draft copy for all channels', 'Design ad creatives'],
        ARRAY['{"text":"Finalize campaign brief","done":false}','{"text":"Set budget allocation","done":false}','{"text":"Brief design team","done":false}','{"text":"Schedule content calendar","done":false}'],
        '', '', now() - interval '2 days'),

      (gen_random_uuid(), org_rec.id,
        'Onboard New Enterprise Client',
        'Complete the onboarding workflow for Starlight Capital Ltd including account setup, data migration, and training sessions.',
        current_date + 1, current_date + 7,
        'High Priority', 'To Do', 'ER', '#EC4899',
        ARRAY['Send welcome email', 'Schedule kickoff call', 'Prepare onboarding materials'],
        ARRAY['{"text":"Create client workspace","done":false}','{"text":"Configure permissions","done":false}','{"text":"Import historical data","done":false}','{"text":"Run first training session","done":false}'],
        '', 'Apex High-Rise Portfolio Partnership', now() - interval '1 day'),

      (gen_random_uuid(), org_rec.id,
        'Annual Performance Reviews',
        'Conduct annual performance evaluations for all department heads. Compile ratings, feedback, and salary adjustment recommendations.',
        current_date + 3, current_date + 21,
        'Medium', 'To Do', 'ER', '#EC4899',
        ARRAY['Send self-assessment forms', 'Schedule 1:1 review meetings', 'Compile results report'],
        ARRAY['{"text":"Send assessment templates","done":false}','{"text":"Collect manager feedback","done":false}','{"text":"Prepare promotion recommendations","done":false}'],
        '', '', now() - interval '3 days'),

      (gen_random_uuid(), org_rec.id,
        'Update Company Financial Projections',
        'Revise the Q4 and FY2026 financial models to reflect actual Q3 performance and updated market assumptions.',
        current_date + 5, current_date + 14,
        'Medium', 'To Do', 'DM', '#8B5CF6',
        ARRAY['Pull actuals from accounting', 'Update revenue model'],
        ARRAY['{"text":"Gather Q3 actuals","done":false}','{"text":"Update revenue assumptions","done":false}','{"text":"Model three scenarios","done":false}','{"text":"Present to CFO","done":false}'],
        '', '', now() - interval '1 day'),

      (gen_random_uuid(), org_rec.id,
        'Vendor Contract Renewals',
        'Review and renew contracts for key technology vendors including AWS, Salesforce, and office suppliers before expiry.',
        current_date + 2, current_date + 30,
        'Low', 'To Do', 'MC', '#10B981',
        ARRAY['Audit all active vendor contracts', 'Negotiate renewal terms'],
        ARRAY['{"text":"List all expiring contracts","done":false}','{"text":"Request renewal quotes","done":false}','{"text":"Legal review","done":false}'],
        '', '', now() - interval '4 days'),

      -- In Progress
      (gen_random_uuid(), org_rec.id,
        'CRM Platform Backend Integration',
        'Implement REST API endpoints for the new CRM module, including authentication, client management, and reporting APIs.',
        current_date - 7, current_date + 3,
        'High Priority', 'In Progress', 'MC', '#10B981',
        ARRAY['Design API schema', 'Implement auth endpoints', 'Build client CRUD APIs', 'Write unit tests'],
        ARRAY['{"text":"API schema finalized","done":true}','{"text":"Auth endpoints live","done":true}','{"text":"Client endpoints done","done":true}','{"text":"Reporting endpoints","done":false}','{"text":"Unit test coverage 80%+","done":false}'],
        '', '', now() - interval '8 days'),

      (gen_random_uuid(), org_rec.id,
        'Hire Senior Product Designer',
        'Source, interview, and hire a Senior Product Designer to lead the design system initiative.',
        current_date - 10, current_date + 5,
        'High Priority', 'In Progress', 'ER', '#EC4899',
        ARRAY['Post job listings', 'Screen 50+ applicants', 'Conduct design interviews'],
        ARRAY['{"text":"Job description written","done":true}','{"text":"Posted on LinkedIn & Dribbble","done":true}','{"text":"First round interviews done","done":true}','{"text":"Portfolio reviews","done":false}','{"text":"Offer letter sent","done":false}'],
        '', '', now() - interval '12 days'),

      (gen_random_uuid(), org_rec.id,
        'Office Relocation Planning',
        'Plan the move to the new HQ space on 5th Avenue. Coordinate with facilities, IT, and HR to ensure smooth transition.',
        current_date - 5, current_date + 10,
        'Medium', 'In Progress', 'SJ', '#1E3A8A',
        ARRAY['Finalise new office layout', 'Coordinate IT infrastructure setup'],
        ARRAY['{"text":"Floor plan approved","done":true}','{"text":"IT network cabling ordered","done":true}','{"text":"Moving company booked","done":false}','{"text":"Staff communication sent","done":false}','{"text":"Move-in day logistics plan","done":false}'],
        'CRM Platform Backend Integration', '', now() - interval '6 days'),

      (gen_random_uuid(), org_rec.id,
        'Sales Team Training Workshop',
        'Organise a two-day intensive training workshop for the sales team covering new product features and negotiation techniques.',
        current_date - 3, current_date + 4,
        'Medium', 'In Progress', 'SJ', '#1E3A8A',
        ARRAY['Book training venue', 'Prepare workshop materials'],
        ARRAY['{"text":"Agenda drafted","done":true}','{"text":"Speaker confirmed","done":true}','{"text":"Materials printed","done":false}','{"text":"Post-training assessment ready","done":false}'],
        '', '', now() - interval '5 days'),

      -- Completed
      (gen_random_uuid(), org_rec.id,
        'Q2 Financial Report Presentation',
        'Prepare and present the Q2 financial performance report to the board of directors including key metrics and variance analysis.',
        current_date - 30, current_date - 15,
        'High Priority', 'Completed', 'DM', '#8B5CF6',
        ARRAY['Compile all financial statements', 'Create slide deck', 'Present to board'],
        ARRAY['{"text":"P&L statement finalised","done":true}','{"text":"Variance analysis complete","done":true}','{"text":"Slide deck approved","done":true}','{"text":"Board presentation delivered","done":true}'],
        '', '', now() - interval '32 days'),

      (gen_random_uuid(), org_rec.id,
        'Company Website Redesign',
        'Redesign and relaunch the company website with new branding, improved SEO, and a refreshed blog section.',
        current_date - 45, current_date - 10,
        'High Priority', 'Completed', 'MC', '#10B981',
        ARRAY['UX research and wireframes', 'Design system creation', 'Development & QA', 'SEO optimisation'],
        ARRAY['{"text":"New designs approved","done":true}','{"text":"Dev complete","done":true}','{"text":"QA testing passed","done":true}','{"text":"Launched successfully","done":true}'],
        '', '', now() - interval '50 days'),

      (gen_random_uuid(), org_rec.id,
        'ISO 27001 Security Audit',
        'Complete the annual ISO 27001 information security audit, remediate any findings, and renew certification.',
        current_date - 20, current_date - 5,
        'Medium', 'Completed', 'MC', '#10B981',
        ARRAY['Internal audit sweep', 'External auditor review', 'Remediate findings'],
        ARRAY['{"text":"Internal audit done","done":true}','{"text":"External audit passed","done":true}','{"text":"Findings remediated","done":true}','{"text":"Certificate renewed","done":true}'],
        '', '', now() - interval '25 days'),

      (gen_random_uuid(), org_rec.id,
        'Employee Benefits Package Refresh',
        'Review and update the employee benefits package including health insurance, pension contributions, and wellness perks.',
        current_date - 25, current_date - 8,
        'Low', 'Completed', 'ER', '#EC4899',
        ARRAY['Survey employee preferences', 'Negotiate with insurance providers'],
        ARRAY['{"text":"Benefits survey sent","done":true}','{"text":"New health plan selected","done":true}','{"text":"Communication to staff","done":true}'],
        '', '', now() - interval '28 days')

    on conflict do nothing;

  end loop;
end $$;

