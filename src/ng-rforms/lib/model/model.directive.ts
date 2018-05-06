import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { NgRFModelSetterService } from './model-setter.service';
import { NgRFFormComponent } from '../form/form.component';

/**
 * This directive control nested inputs and sets values on the Original Model set at {@link NgRFFormComponent#rfModelData}
 *
 * #### Given an rfModelData rfModelData on the controller:
 * ```typescript
 * this.userModel = {
 *    firstName: 'John',
 *    address: {
 *        street: 'Carnaby Street'
 *    }
 * };
 * ```
 *
 * #### Use it on the form
 * ```html
 * <form [rfModelData]="userModel">
 *   <div class="form-group">
 *      <label for="name">Name:</label>
 *
 *      <input
 *        id="name"
 *        class="form-control"
 *        rfModel="userModel.name"
 *      />
 *   </div>
 * </form>
 * ```
 */
@Directive({
  selector: '[rfModel]',
})
export class NgRFModelDirective implements OnInit, OnDestroy {

  /**
   * The dot notation full name of the rfModelData
   */
    // tslint:disable-next-line:no-input-rename
  @Input('rfModel') rfModelName: string;


  private isRegisteredToFormControl = false;

  parentFormGroup: FormGroup;
  formControl: FormControl;
  modelPath: string;
  inputEl: HTMLInputElement;


  constructor(
    private modelSetter: NgRFModelSetterService,
    @Optional() private rfForm: NgRFFormComponent,
    { nativeElement }: ElementRef,
  ) {
    this.inputEl = nativeElement;
  }


  /**
   * Register this input component to its parent form [FormGroup]{@link https://angular.io/api/forms/FormGroup}
   *
   * And starts to emit the input's value when it changes.
   */
  ngOnInit() {
    this.modelPath = this.getModelPathWithoutFirstPart();
    this.registerToFormGroup();
    this.subscribeToValueChanges();
  }


  ngOnDestroy() {
    if (this.parentFormGroup) {
      this.parentFormGroup.removeControl(this.rfModelName);
    }
  }


  /**
   * Register this input to its parent [FormGroup]{@link https://angular.io/api/forms/FormGroup}
   * to enable validations and data manipulation
   */
  private registerToFormGroup() {
    if (this.isRegisteredToFormControl) {
      return;
    }

    const formGroup = this.getFormGroup();
    const formControl = this.getFormControl(formGroup);

    this.formControl = formControl;
    this.inputEl.value = formControl.value || '';

    if (formGroup) {
      this.isRegisteredToFormControl = true;
      this.parentFormGroup = formGroup;
      formGroup.addControl(this.rfModelName, formControl);
    }
  }


  /**
   * Verify if this input is inside a [NgRFFormComponent]{@link NgRFFormComponent}
   * and return its [FormGroup]{@link https://angular.io/api/forms/FormGroup}
   *
   * Otherwise a new empty [FormGroup]{@link https://angular.io/api/forms/FormGroup}
   */
  private getFormGroup() {
    if (this.rfForm) {
      return this.rfForm.formGroup;
    }

    return new FormGroup({});
  }


  /**
   * Verify if the [FormGroup]{@link https://angular.io/api/forms/FormGroup} has an control with the current name and return it.
   * Otherwise return a new [FormControl]{@link https://angular.io/api/forms/FormControl}
   */
  protected getFormControl(formGroup: FormGroup): FormControl {
    let formControl = formGroup && <FormControl>formGroup.get(this.rfModelName);

    if (!formControl) {
      formControl = this.getNewFormControl();
    }

    return formControl;
  }


  /**
   * Instantiate a new [FormControl]{@link https://angular.io/api/forms/FormControl} and return it
   */
  protected getNewFormControl(): FormControl {
    const initialValue = this.getModelValue();
    return new FormControl(initialValue || null);
  }


  /**
   * Subscribe to [valueChanges]{@link https://angular.io/api/forms/AbstractControl#valueChanges} and update the Entity value
   */
  private subscribeToValueChanges() {
    this.formControl.valueChanges.subscribe(newValue => this.setModelValue(newValue));
  }


  /**
   * Return the dot notation path of the rfModelData, without the first part,
   * because it is the rfModelData itself.
   */
  private getModelPathWithoutFirstPart(): string {
    return this.rfModelName.substr(this.rfModelName.indexOf('.') + 1);
  }


  /**
   * Get the value from the [rfModelData]{@link NgRFFormComponent#rfModelData}
   */
  private getModelValue(): any | null {
    return this.modelSetter.getValue(this.modelPath, this.rfForm.rfModelData);
  }


  /**
   * Set the value to the [rfModelData]{@link NgRFFormComponent#rfModelData}
   */
  private setModelValue(newValue: any) {
    return this.modelSetter.setValue(this.modelPath, newValue || null, this.rfForm.rfModelData);
  }


  @HostListener('input', ['$event.target'])
  onModelChange(input: HTMLInputElement) {
    this.formControl.setValue(input.value, { emitModelToViewChange: false });
  }

}