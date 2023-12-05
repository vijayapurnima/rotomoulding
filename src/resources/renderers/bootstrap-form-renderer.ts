import {
  RenderInstruction,
  ValidateResult
} from 'aurelia-validation';

export class BootstrapFormRenderer {
  render(instruction: RenderInstruction) {
    for (let {result, elements} of instruction.unrender) {
      for (let element of elements) {
        this.remove(element, result);
      }
    }

    for (let {result, elements} of instruction.render) {
      for (let element of elements) {
        this.add(element, result);
      }
    }
  }

  add(element: Element, result: ValidateResult) {
    const formGroup = element.closest('.form-group');
    if (!formGroup) {
      return;
    }

    if (result.valid) {
      if (!element.classList.contains('is-valid')) element.classList.add('is-valid')
    } else {
      element.classList.remove('is-valid')
      element.classList.add('is-invalid')

      // add help-block
      const message = document.createElement('span');
      message.className = 'invalid-feedback validation-message';
      message.textContent = result.message;
      message.id = `validation-message-${result.id}`;
      formGroup.appendChild(message);
    }
  }

  remove(element: Element, result: ValidateResult) {
    const formGroup = element.closest('.form-group');
    if (!formGroup) {
      return;
    }

    if (result.valid) {
      if (element.classList.contains('is-valid')) {
        element.classList.remove('is-valid');
      }
    } else {
      // remove help-block
      const message = formGroup.querySelector(`#validation-message-${result.id}`);
      if (message) {
        formGroup.removeChild(message);

        // remove the has-error class from the enclosing form-group div
        if (formGroup.querySelectorAll('.invalid-feedback.validation-message').length === 0) {
          element.classList.remove('is-invalid');
        }
      }
    }
  }
}
