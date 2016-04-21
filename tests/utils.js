bufferedWritesInterval = 5;

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