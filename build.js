const fs = require('fs');

if (!fs.existsSync('built')) fs.mkdirSync('built');
const { pages, files, index: indexname, vars } = JSON.parse(fs.readFileSync('data.json'));
const index = fs.readFileSync(indexname, 'utf-8');
const build = [];

function getr(name, obj = vars) {
  if (!obj) return null;
  let x = name;
  let y = obj[x.shift()];
  if (x.length) return getr(x.join('.'), y);
  else return y;
}

function get(name, page) {
  return getr(name.split('.').filter(x => x), { ...pages[page].vars, name: page }) ?? 
    getr(name.split('.').filter(x => x));
}

function mod(data, page) {
  data = data.replace(/(?<!\\)\$fe{(\w+),(\w+)}/g, (_, name, name2) => 
    get(name, page).map(Function('...args', get(name2, page))).join(''));
  data = data.replace(/(?<!\\)\${(\w+)}/g, (og, name) => get(name, page) ?? og);
  return data;
}

files.forEach(n => build.push([n, fs.readFileSync(n)]));
Object.keys(pages).forEach(page => {
  let value = index;
  let lv = null;
  for (let i = 0; value != lv && i < 100; i++) {
    lv = value;
    value = mod(value, page);
  }
  value = value.replace(/\\./g, '\\');
  build.push([page == '.' ? 'index.html' : page + '/index.html', value]);
});


build.forEach(x => {
  let paths = x[0].split('/');
  paths.pop();
  let path = '';
  paths.forEach(x => {
    path += x;
    if (!fs.existsSync(path)) fs.mkdirSync(path);
    path += '/';
  });
  fs.writeFileSync('built/' + x[0], x[1]);
});