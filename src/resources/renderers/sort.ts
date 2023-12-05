//https://gist.github.com/httpJunkie/431561420d62a746e02eef2d218d07d1
export class SortValueConverter {
  toView(array, property, direction, of = null) {
    if (!array)
      return array;
    let factor = direction.match(/^desc*/i) ? 1 : -1;
    if (property !== '') {
      if (!of) {
        var retvalue = array.sort((a, b) => {
          var textA = a.toUpperCase ? a[property].toUpperCase() : a[property];
          var textB = b.toUpperCase ? b[property].toUpperCase() : b[property];
          return (textA < textB) ? factor : (textA > textB) ? -factor : 0;
        })
      } else {
        var retvalue = array.sort((a, b) => {
          var textA = a.toUpperCase ? a[of][property].toUpperCase() : a[of][property];
          var textB = b.toUpperCase ? b[of][property].toUpperCase() : b[of][property];
          return (textA < textB) ? factor : (textA > textB) ? -factor : 0;
        })
      }

    } else {
      var retvalue = array.sort((a, b) => {
        return (a < b) ? factor : (a > b) ? -factor : 0;
      })
    }
    return retvalue;
  }
}
