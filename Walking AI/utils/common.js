var Common = {};

(function() {

  // Returns backup value if primary value is undefined or null
  Common.avoidNull = function(value, backup) {
    return value === undefined || value === null ? backup : value;
  };

  // Extends primary object with secondary keys/values if property does not exist
  Common.extend = function(primary, secondary) {
    for (let key in secondary) {
      if (!primary.hasOwnProperty(key)) {
        primary[key] = secondary[key];
      }
    }
    return primary;
  };

  // Clone an object
  Common.clone = function(obj, isDeep) {
    if (isDeep) return JSON.parse( JSON.stringify( obj ) );
    let output = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        output[key] = obj[key];
      }
    }
    return output;
  };

  // Checks if two lists have at least one element in common
  Common.sharesItem = function(arr1, arr2) {
    return arr1.some(r => arr2.includes(r));
  };

  // Clamp a value between a min and max
  Common.clamp = function(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  // Removes undefined elements from a list
  Common.clean = function(list) {
    let l = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] !== undefined) l.push(list[i]);
    }
    return l;
  };

})();
