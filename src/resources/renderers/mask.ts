export class MaskValueConverter {
  toView(value, mask) {
    if (value) {
      let newValue = Object.assign(value);
      if (value && mask) {
        for (let i = 0; i <= mask.length; i++) {
          if (mask[i] == ' ') {
            newValue = newValue.substr(0, i) + ' ' + newValue.substr(i, newValue.length - 1)
          }
        }
      }
      return newValue;
    } else return value;
  }
}
