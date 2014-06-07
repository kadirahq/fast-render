/*
  stolen from express: http://goo.gl/qgarJu
  some parts has been changed to deal with our api
*/

Utils = {};

Utils._pathRegexp = function _pathRegexp(path, keys, sensitive, strict) {
  if (toString.call(path) == '[object RegExp]') return path;
  if (Array.isArray(path)) path = '(' + path.join('|') + ')';
  path = path
    .replace(/(.)\/$/, '$1')
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/#/, '/?#')
    .replace(
      /(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g,
    function(match, slash, format, key, capture, optional){
      keys.push({ name: key, optional: !! optional });
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '')
        + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*)');
  return new RegExp('^' + path + '$', sensitive ? '' : 'i');
};

Utils._pathMatch = function _pathMatch(uri, route){
  uri = decodeURI(uri);

  var params = [];
  var uriParts2 = uri.split('?');
  var path = uriParts2[0];
  var queryString = uriParts2[1];

  if(queryString) {
    _.each(queryString.split('&'), function (paramString) {
      paramParts = paramString.split('=');
      params[paramParts[0]] = decodeURIComponent(paramParts[1]);
    });
  }

  var keys = route.keys
    , m = route.regexp.exec(path);

  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];

    try {
      var val = 'string' == typeof m[i]
        ? decodeURIComponent(m[i])
        : m[i];
    } catch(e) {
      var err = new Error("Failed to decode param '" + m[i] + "'");
      err.status = 400;
      throw err;
    }

    if (key) {
      params[key.name] = val;
    } else {
      params.push(val);
    }
  }
  
  return params;
};
