/* Case Zero: the rules for a subdomain request. Written by NOCIV.
   Runs in the browser on the test page and will run in GitHub Actions on every request. */
(function (root) {
  var RESERVED = ['www', 'mail', 'email', 'admin', 'api', 'ns', 'ns1', 'ns2', 'ns3', 'ftp', 'sftp', 'smtp', 'imap', 'pop', 'pop3', 'root', 'support', 'help', 'billing', 'login', 'signin', 'secure', 'security', 'account', 'accounts', 'payment', 'payments', 'pay', 'bank', 'status', 'blog', 'docs', 'cdn', 'assets', 'static', 'dev', 'test', 'staging', 'localhost', 'autodiscover', 'nociv', 'nocivco', 'base', 'shop', 'store', 'casezero', 'case-zero', 'abuse', 'postmaster', 'webmaster', 'hostmaster'];
  var TYPES = ['CNAME', 'A', 'URL'];

  function validName(name) {
    var e = [];
    if (typeof name !== 'string' || !name) return ['Pick a name.'];
    if (name.length < 3) e.push('Names need at least 3 characters.');
    if (name.length > 40) e.push('Names can be up to 40 characters.');
    if (!/^[a-z0-9-]*$/.test(name)) e.push('Use only lowercase letters, numbers and hyphens.');
    if (/^-|-$/.test(name)) e.push('A name cannot start or end with a hyphen.');
    if (/--/.test(name)) e.push('No double hyphens.');
    if (RESERVED.indexOf(name) >= 0 || /nociv/.test(name)) e.push('That name is saved for NOCIV.');
    return e;
  }
  function ipv4(v) {
    var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(v || ''); if (!m) return null;
    var p = m.slice(1).map(Number); for (var i = 0; i < 4; i++) if (p[i] > 255) return null; return p;
  }
  function validValue(type, value) {
    var e = [], v = String(value || '').trim();
    if (!v) return ['Say where it should point.'];
    if (type === 'CNAME') {
      if (ipv4(v)) e.push('That is an IP address. Use type A for an IP.');
      else if (!/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(v)) e.push('Use a web address like yourname.github.io, with no https:// and no slash.');
    } else if (type === 'A') {
      var p = ipv4(v);
      if (!p) e.push('Use an IPv4 address like 185.199.108.153.');
      else if (p[0] === 10 || p[0] === 127 || p[0] === 0 || p[0] >= 224 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254)) e.push('That address is private or reserved, the internet cannot reach it.');
    } else if (type === 'URL') {
      if (!/^https:\/\/[^\s]+$/.test(v) || v.length > 300) e.push('A redirect needs a full address that starts with https://');
    }
    return e;
  }
  function validate(req) {
    var errors = [];
    if (TYPES.indexOf(req && req.type) < 0) errors.push('Pick a type: CNAME, A or URL.');
    errors = errors.concat(validName(req && req.name));
    if (TYPES.indexOf(req && req.type) >= 0) errors = errors.concat(validValue(req.type, req.value));
    return { ok: errors.length === 0, errors: errors };
  }
  // The file a person submits. One small file per name.
  function requestFile(req, domain) {
    var rec = {}; rec[req.type] = String(req.value).trim();
    return { name: req.name, domain: domain || '', owner: req.owner || '', records: rec };
  }
  // What it will do to DNS, in plain terms.
  function dnsPreview(req, domain) {
    var host = req.name + '.' + (domain || 'yourdomain');
    if (req.type === 'URL') return host + ' sends visitors to ' + req.value + ' (a redirect).';
    return host + ' ' + req.type + ' ' + String(req.value).trim();
  }
  var api = { validate: validate, validName: validName, validValue: validValue, requestFile: requestFile, dnsPreview: dnsPreview, RESERVED: RESERVED, TYPES: TYPES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CaseZero = api;
})(typeof window !== 'undefined' ? window : this);
