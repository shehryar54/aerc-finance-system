# Harmony Finance

Build a production-ready Finance Hub / Payroll ERP using React, TypeScript, TailwindCSS, shadcn/ui, Supabase, React Query, React Hook Form, Zod, TanStack Table, and Recharts.

This is NOT a simple payroll calculator. It is a complete Finance Management System for an organization. The application should have a clean, modern, professional dashboard with excellent UX, responsive design, dark/light mode support, and scalable architecture.

==========================================================

GENERAL REQUIREMENTS

==========================================================

• Use Supabase as the backend.

• Use Row Level Security.

• Build reusable components.

• Use proper folder structure.

• Use TypeScript everywhere.

• Use loading states.

• Use skeleton loaders.

• Use empty states.

• Use proper error handling.

• Use confirmation dialogs before delete.

• Use toast notifications.

• Mobile responsive.

• Professional animations.

• Global search.

• Audit log ready.

==========================================================

SIDEBAR

==========================================================

Dashboard

Employee Management

Payroll

Allowances

Deductions

Loans

Provident Fund

Income Tax

Banks

Reports

Settings

==========================================================

FIRST PAGE = DASHBOARD

==========================================================

This is the most important page.

Design a beautiful finance dashboard similar to a banking/admin dashboard.

Top of dashboard:

Greeting

Current Date

Current Month

Financial Year

Quick Action buttons

Add Employee

Process Payroll

Update Opening Balance

Transfer Funds

Generate Report

==========================================================

BANK CARDS

==========================================================

At the top create three beautiful cards.

National Bank

Sindh Bank

Internal AERC Bank

Each card should display

Bank Name

Opening Balance

Current Balance

Total Credit

Total Debit

Last Updated

Status

Each card should have

Edit Opening Balance button

View Transactions button

Transfer Money button

When Edit Opening Balance is clicked, open a modal.

Modal fields

Bank Name

Opening Balance

Effective Date

Remarks

Save

Cancel

Opening Balance must automatically become Current Balance if there are no transactions.

Current Balance should always be calculated as

Opening Balance

+ Credits

- Debits

Never manually edit Current Balance.

==========================================================

FINANCIAL SUMMARY

==========================================================

Create beautiful statistic cards.

Total Employees

Monthly Payroll

Total Credits

Total Debits

Net Cash

Pending Loans

Provident Fund Balance

Income Tax Collected

==========================================================

CHARTS

==========================================================

Use Recharts.

Charts required

Monthly Cash Flow

Credits vs Debits

Payroll Trend

Employees by BPS

Employees by Department

==========================================================

RECENT TRANSACTIONS

==========================================================

Beautiful table

Date

Bank

Description

Reference

Credit

Debit

Balance

Status

Search

Filter

Pagination

Sorting

==========================================================

RECENT ACTIVITIES

==========================================================

Right side panel

Employee Added

Payroll Generated

Opening Balance Updated

Bank Transfer

Loan Created

PF Updated

Tax Generated

==========================================================

BANK MANAGEMENT

==========================================================

Create Banks page.

Three banks already exist.

National Bank

Sindh Bank

Internal AERC Bank

Fields

Bank Name

Account Title

Account Number

Branch

Opening Balance

Current Balance

Status

Last Updated

Transactions

==========================================================

DATABASE

==========================================================

Create tables

banks

id

name

account_title

account_number

branch

opening_balance

current_balance

status

created_at

updated_at

bank_transactions

id

bank_id

date

description

reference_no

credit

debit

balance_after_transaction

remarks

created_by

created_at

Whenever a transaction is added

Automatically recalculate Current Balance.

==========================================================

EMPLOYEE MANAGEMENT

==========================================================

Create Employee module.

Table

Employee ID

Employee Name

Department

Designation

BPS

Phone

Status

Actions

Filters

Search

Employee ID

Employee Name

Department

Designation

BPS

Status

Sorting

Employee ID

Employee Name

BPS

Joining Date

Pagination

25

50

100

All

Employee Profile page with tabs

Overview

Employment

Salary

Loans

Provident Fund

Tax

Documents

Activity

==========================================================

UI DESIGN

==========================================================

Use

Blue

White

Gray

Modern glass cards

Rounded corners

Soft shadows

Professional spacing

Beautiful typography

Lucide icons

==========================================================

HEADER

==========================================================

Top right

Notifications

Dark Mode Toggle

Profile

Settings

==========================================================

FOOTER

==========================================================

Finance Hub

Version

Current Financial Year

==========================================================

IMPORTANT BUSINESS RULES

==========================================================

Opening Balance can only be updated from the Opening Balance modal.

Current Balance is calculated automatically.

Every bank transaction must update Current Balance instantly.

All monetary values should display with comma separators and two decimal places.

No hardcoded values.

Use Supabase database for everything.

Seed the application with these three banks:

National Bank

Sindh Bank

Internal AERC Bank

Opening Balance = 0 initially.

==========================================================

FINAL RESULT

==========================================================

Create a beautiful, production-quality Finance Hub dashboard that looks like a modern banking ERP, not a simple admin panel. The dashboard should be fully functional, connected to Supabase, responsive, and ready for future modules like Payroll, Loans, Provident Fund, Tax, Reports, and Settings.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e3732567-ed2e-4c4c-afc5-d95c6c2663d5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
