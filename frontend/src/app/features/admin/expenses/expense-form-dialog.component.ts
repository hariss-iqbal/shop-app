import { Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

import { ExpenseService } from '../../../core/services/expense.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Expense, EXPENSE_VALIDATION } from '../../../models/expense.model';

@Component({
  selector: 'app-expense-form-dialog',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    TextareaModule,
    DatePickerModule,
    FloatLabelModule
  ],
  templateUrl: './expense-form-dialog.component.html'
})
export class ExpenseFormDialogComponent implements OnChanges {
  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private toastService: ToastService
  ) { }

  @Input() visible = false;
  @Input() expense: Expense | null = null;
  @Input() locationId: string | null = null;
  @Input() locationName: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Expense>();

  saving = signal(false);
  EXPENSE_VALIDATION = EXPENSE_VALIDATION;

  // Cap the date picker at the END of today — no future-dated expenses. Using
  // end-of-day (not `new Date()`) matters: the default value is created later in the
  // dialog lifecycle than this cap, so a same-day-but-later timestamp would otherwise
  // exceed maxDate and PrimeNG would refuse to display it.
  readonly maxDate = (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();

  // The date uses ngModel (matching every other datepicker in the app) rather than
  // a reactive control — PrimeNG's datepicker CVA doesn't render the bound default here.
  expenseDate: Date = new Date();

  form: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(EXPENSE_VALIDATION.AMOUNT_MIN)]],
    description: ['', [Validators.required, Validators.maxLength(EXPENSE_VALIDATION.DESCRIPTION_MAX)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.expense ? this.patchForm() : this.resetForm();
    }
  }

  private resetForm(): void {
    this.form.reset({ amount: null, description: '' });
    this.expenseDate = new Date();
    this.form.markAsUntouched();
  }

  private patchForm(): void {
    if (!this.expense) return;
    const [y, m, d] = this.expense.expenseDate.split('-').map(Number);
    this.form.patchValue({
      amount: this.expense.amount,
      description: this.expense.description
    });
    this.expenseDate = new Date(y, m - 1, d);
    this.form.markAsUntouched();
  }

  onVisibleChange(visible: boolean): void {
    if (!visible && this.saving()) {
      return;
    }
    this.visibleChange.emit(visible);
  }

  /**
   * Assign the date AFTER the dialog content has rendered. A PrimeNG datepicker
   * inside a lazily-rendered p-dialog won't paint a value that was set before its
   * input existed, so we (re)assign a fresh Date here to force the display.
   */
  onDialogShow(): void {
    const value = this.expense
      ? (() => { const [y, m, d] = this.expense!.expenseDate.split('-').map(Number); return new Date(y, m - 1, d); })()
      : new Date();
    // Defer one macrotask so the datepicker's input view exists before the value is
    // written — otherwise PrimeNG doesn't paint it into the field inside a dialog.
    setTimeout(() => { this.expenseDate = value; }, 0);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.expense && !this.locationId) {
      this.toastService.error('Error', 'Select a shop before adding an expense');
      return;
    }

    this.saving.set(true);

    try {
      const value = this.form.value;
      const expenseDate = ExpenseService.toDateString(this.expenseDate);

      let result: Expense;
      if (this.expense) {
        result = await this.expenseService.updateExpense(this.expense.id, {
          amount: value.amount,
          description: value.description,
          expenseDate
        });
      } else {
        result = await this.expenseService.createExpense({
          locationId: this.locationId!,
          amount: value.amount,
          description: value.description,
          expenseDate
        });
      }

      this.saved.emit(result);
      this.visibleChange.emit(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save expense';
      this.toastService.error('Error', message);
      console.error('Failed to save expense:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
