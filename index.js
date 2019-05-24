module.exports = co;
co.wrap = wrap;
co.default = co.co = co;

function co(fn, ...args) {
  return wrap(fn).call(this, ...args);
}

function wrap(fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;

  function createPromise(...args) {
    let gen;
    try {
      gen = typeof fn === 'function' ? fn.apply(this, args) : fn;
    } catch (e) {
      return Promise.reject(e);
    }
    // gen 不是生成器就直接 resolve
    if (!(gen && typeof gen.next === 'function')) return Promise.resolve(gen);

    // 如果 gen 是个生成器
    return new Promise((resolve, reject) => {
      function handle(valueToPass, action = 'next') {
        let done, value;
        try {
          ({done, value} = gen[action](valueToPass));
        } catch (e) {
          return reject(e);
        }
        // console.log(done, value);

        const pro = toPromise.call(this, value);
        if (done) {
          // pro.then(feed => resolve(feed), feed => reject(feed));
          return resolve(value);
        } else {
          // for invalid value
          if (!isPromise(pro)) {
            return handle(new TypeError('You may only yield a function, promise, generator, array, or object'), 'throw');
          }
          pro.then(feed => handle(feed), feed => handle(feed, 'throw'));
        }
      }

      handle(undefined);
    });
  }
}

/* helper functions */

function toPromise(raw) {
  if (raw == undefined) return raw;
  if (isPromise(raw)) return raw;
  if (isGeneratorFunction(raw)) return co.call(this, raw);
  if (isGenerator(raw)) return co.call(this, raw);
  if (Array.isArray(raw)) return Promise.all(raw.map(toPromise, this));

  // isThunk
  if (typeof raw === 'function') {
    return new Promise((resolve, reject) => {
      raw.call(this, (err, ...res) => err ? reject(err) : resolve(res.length > 1 ? res : res[0]));
    });
  }

  // Object
  if (Object === raw.constructor) {
    const promises = [];
    const results = {};

    for (const k of Object.keys(raw)) {
      const pro = toPromise.call(this, raw[k]);
      if (isPromise(pro)) {
        results[k] = undefined;
        promises.push(pro.then(ret => results[k] = ret));
      } else {
        results[k] = raw[k];
      }
    }

    return Promise.all(promises).then(() => results);
  }

  return raw;
}

const isPromise = o => o && typeof o.then === 'function';

const isGenerator = o => o && typeof o.next === 'function' && typeof o.throw === 'function';

function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}
