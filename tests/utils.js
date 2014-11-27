Tinytest.add('Utils - encode decode', function(test) {
  var data = {aa: 10, date: new Date()};
  var str = EncodeEJSON(data);
  var decoded = DecodeEJSON(str);

  test.equal(decoded.aa, data.aa);
  test.equal(decoded.date.getTime(), data.date.getTime());
});

Tinytest.add('AddedToChanged - new fields', function(test) {
  var localCopy = {aa: 10};
  var added = {fields: {aa: 20, bb: 20}, msg: 'added'};

  AddedToChanged(localCopy, added);

  test.equal(added.msg, 'changed');
  test.equal(added.fields, {aa: 20, bb: 20});
});

Tinytest.add('AddedToChanged - removed fields', function(test) {
  var localCopy = {aa: 10, cc: 20, bb: 10};
  var added = {fields: {bb: 20}, msg: 'added'};

  AddedToChanged(localCopy, added);

  test.equal(added.msg, 'changed');
  test.equal(added.fields, {bb: 20});
  test.equal(added.cleared, ['aa', 'cc']);
});