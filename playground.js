
var co = require('.');

function getPromise(val, err) {
  return new Promise(function (resolve, reject) {
    if (err) reject(err);
    else resolve(val);
  });
}

co(function *(){
  errors = [];

  try {
    var a = yield 'something';
  } catch (err) {
    errors.push(err.message);
  }

  try {
    var a = yield 'something';
  } catch (err) {
    errors.push(err.message);
  }

  console.log(errors);
});

co.toPromise({ name: 'Bob' })
  .then(console.log)
