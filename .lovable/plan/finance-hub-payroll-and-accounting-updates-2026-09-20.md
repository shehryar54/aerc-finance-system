# Finance Hub payroll and accounting updates

## Scope

1. **Employee screen**
   - Remove Basic Salary from the employee add/edit form and employee directory.
   - Replace the wide employee table with vertical detail rows: each employee remains one list item, with labeled details stacked for easier reading.
   - Keep search, filters, paging, salary history, edit, and delete actions unchanged.
   - New monthly salary rows will derive Basic Pay from the employee’s latest salary-sheet record, rather than the removed employee field.

2. **Print all salary slips**
   - Add a **Print All** action for the currently selected month/year and current employee search result.
   - Generate one print document containing every matching salary slip, with one employee per printed page and the same AERC/UoK format as the individual slip.
   - Disable printing when no salary rows are available.

3. **Voucher signatures**
   - For vouchers up to and including Rs. 100,000, omit the Vice Chancellor signature field.
   - Keep the Vice Chancellor signature for vouchers above Rs. 100,000, matching the existing two-stage approval rule.
   - Make both preview and print use the same conditional layout.

4. **HEC-compatible account codes**
   - Add a separate HEC/NAM reporting code to Account Heads instead of overwriting internal posting codes that existing automation depends on.
   - Map existing heads to the closest Pakistan public-sector Chart of Accounts categories and clearly mark institution-specific/unmatched heads.
   - Show the reporting code in account selectors and voucher/ledger printouts while keeping bank account numbers distinct.
   - Preserve all existing voucher, payroll, opening-balance, and bank posting automation.

5. **General Ledger report**
   - Correct the ledger print layout to match the supplied ruled-book reference: year heading, account title/code, month shown on change, date/voucher/particulars/folio, split debit-credit-balance columns, Dr/Cr indicator, sheet number, totals, and ruled blank rows.
   - Keep one account per printed sheet and ensure page sizing is stable on A4.

6. **Dynamic Adhoc management**
   - Preserve the existing Adhoc 2022–2025 values and all historical salary months.
   - Add a **Manage Adhoc** action on Salary & Payroll.
   - Allow selecting two or more Adhoc columns and merging them into one newly named Adhoc for the selected month onward.
   - Allow creating a new Adhoc as either a percentage of Basic Pay or a manually editable amount per employee, with an effective month.
   - Include dynamic Adhocs in instant Gross Pay and Net Pay recalculation, monthly cloning, CSV export, dashboard totals, salary slips, and Print All.

## Technical details

- Add a dynamic salary allowance structure and calculation trigger through a database migration; retain legacy columns for historical compatibility.
- Add validated merge/create operations that reject duplicate names, invalid percentages, empty selections, and destructive changes to earlier periods.
- Add an HEC/NAM cross-reference field and seed mapping through a database migration without changing stable internal account identifiers.
- Update shared salary-slip markup so individual and batch printing cannot drift.
- Verify employee CRUD, salary edits/calculations, both voucher thresholds, Adhoc merge/create, account-code display, and print layouts in the live preview.
